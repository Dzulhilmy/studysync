/**
 * FILE: app/api/teacher/projects/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import Project                       from '@/models/Project'
import Subject                       from '@/models/Subject'
import { notifyAdmins }              from '@/lib/notifications'

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  // Find all subjects this teacher owns, then find all projects in those subjects.
  // This works regardless of whether the project has a `teacher` field populated.
  const teacherSubjects = await Subject.find({
    teacher: (session.user as any).id,
  }).select('_id').lean() as { _id: any }[]

  const subjectIds = teacherSubjects.map(s => s._id)

  const projects = await Project.find({ subject: { $in: subjectIds } })
    .populate('subject', 'name code teacher')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(projects)
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const body        = await req.json()
  const title       = body.title       as string | undefined
  const description = (body.description as string | undefined) ?? ''
  const deadline    = body.deadline    as string | undefined
  const maxScore    = body.maxScore
  const fileUrl     = (body.fileUrl    as string | undefined) ?? null
  const fileName    = (body.fileName   as string | undefined) ?? null

  // Form sends 'subject'; accept 'subjectId' as fallback
  const subjectId = (body.subject ?? body.subjectId ?? '') as string

  // Validate
  const missing: string[] = []
  if (!title?.trim())  missing.push('title')
  if (!subjectId)      missing.push('subject')
  if (!deadline)       missing.push('deadline')
  if (maxScore == null) missing.push('maxScore')

  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  // Verify teacher owns this subject
  const subject = await Subject.findById(subjectId).lean() as any
  if (!subject) {
    return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
  }

  const teacherId = (session.user as any).id as string
  if (subject.teacher?.toString() !== teacherId) {
    return NextResponse.json({ error: 'Forbidden — you do not own this subject' }, { status: 403 })
  }

  // Create — include every field your Project model requires
  const project = await Project.create({
    title:       title!.trim(),
    description,
    subject:     subjectId,
    teacher:     teacherId,
    createdBy:   teacherId,
    deadline:    new Date(deadline!),
    maxScore:    Number(maxScore),
    fileUrl,
    fileName,
    status:      'pending',
  })

  // Notify admins (non-fatal)
  try {
    const teacherName = (session.user as any).name ?? 'A teacher'
    await notifyAdmins({
      type:    'project_pending_approval',
      title:   '🔔 Project Needs Approval',
      message: `${teacherName} created "${title}" in ${subject.code ?? subject.name}.`,
      link:    '/admin/projects',
    })
  } catch (err) {
    console.error('[teacher/projects] notify failed (non-fatal):', err)
  }

  return NextResponse.json(project, { status: 201 })
}