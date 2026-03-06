/**
 * FILE: app/api/teacher/projects/[id]/route.ts
 *
 * FIXED for Next.js 15: params is now a Promise — must be awaited.
 *
 * EMAIL TRIGGER:
 *   PATCH status → 'approved' → emails all enrolled students
 */

import { NextRequest, NextResponse }   from 'next/server'
import { getServerSession }            from 'next-auth'
import { authOptions }                 from '@/lib/auth'
import connectDB                       from '@/lib/db'
import Project                         from '@/models/Project'
import Subject                         from '@/models/Subject'
import User                            from '@/models/User'
import { sendNewProjectEmail }         from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: any }   // ← Next.js 15: Promise
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { id } = await params                         // ← must await
  const { status, adminNote } = await req.json()

  const project = await Project.findByIdAndUpdate(
    id,
    { status, adminNote: adminNote ?? '' },
    { new: true }
  ).populate('subject teacher')

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── EMAIL: project approved → notify every enrolled student ─────────────────
  if (status === 'approved') {
    try {
      const subject = await Subject.findById(project.subject)
        .populate('students', 'name email')
        .lean() as unknown as any

      const enrolledStudents: { name: string; email: string }[] =
        subject?.students ?? subject?.enrollments ?? []

      const deadlineStr = project.deadline instanceof Date
        ? project.deadline.toISOString()
        : String(project.deadline)

      for (const student of enrolledStudents) {
        await sendNewProjectEmail(student.email, {
          studentName:  student.name,
          projectTitle: project.title,
          subjectName:  subject?.name ?? '—',
          subjectCode:  subject?.code ?? '—',
          deadline:     deadlineStr,
          maxScore:     project.maxScore,
          description:  project.description,
        })
      }

      console.log(`[EMAIL] Sent new project emails to ${enrolledStudents.length} student(s)`)
    } catch (emailErr) {
      console.error('[EMAIL] Failed to send project approval emails:', emailErr)
    }
  }

  return NextResponse.json(project)
}