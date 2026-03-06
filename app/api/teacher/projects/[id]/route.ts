/**
 * FILE: app/api/admin/projects/[id]/route.ts   (or wherever you approve projects)
 *
 * EMAIL TRIGGER ADDED:
 *   PATCH status → 'approved'  → email to ALL enrolled students in that subject
 *
 * Adjust the import path and field names to match your actual model.
 */

import { NextRequest, NextResponse }   from 'next/server'
import { getServerSession }            from 'next-auth'
import { authOptions }                 from '@/lib/auth'
import connectDB                       from '@/lib/db'
import Project                         from '@/models/Project'
import Subject                         from '@/models/Subject'
import User                            from '@/models/User'
import { sendNewProjectEmail }         from '@/lib/email'   // ← ADD

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { status, adminNote } = await req.json()

  const project = await Project.findByIdAndUpdate(
    params.id,
    { status, adminNote: adminNote ?? '' },
    { new: true }
  ).populate('subject teacher')

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── EMAIL: project approved → notify every enrolled student ─────────────────
  if (status === 'approved') {
    try {
      // Get subject with enrolled students
      // ⚠️  Change 'students' to your Subject field name if different
      const subject = await Subject.findById(project.subject)
        .populate('students', 'name email')
        .lean() as any

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
  // ── END EMAIL ────────────────────────────────────────────────────────────────

  return NextResponse.json(project)
}