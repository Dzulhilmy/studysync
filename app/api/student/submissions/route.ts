/**
 * FILE: app/api/student/submissions/route.ts
 */

import { NextRequest, NextResponse }       from 'next/server'
import { getServerSession }                from 'next-auth'
import { authOptions }                     from '@/lib/auth'
import connectDB                           from '@/lib/db'
import Submission                          from '@/models/Submission'
import Project                             from '@/models/Project'
import Subject                             from '@/models/Subject'
import User                                from '@/models/User'
import { sendSubmissionNotification }      from '@/lib/email'

// ── POST: create submission ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { projectId, fileUrl, textResponse, isDraft } = await req.json()

  const project = await Project.findById(projectId).populate('teacher subject')
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const isLate = !isDraft && new Date() > new Date(project.deadline)

  // Build the initial version entry (only for real submissions, not drafts)
  const initialVersion = isDraft ? [] : [{
    version:      1,
    fileUrl:      fileUrl      ?? '',
    textResponse: textResponse ?? '',
    submittedAt:  new Date(),
    isLate,
    grade:    null,
    feedback: '',
    status:   'submitted',
  }]

  const submission = await Submission.create({
    student:        (session.user as any).id,
    project:        projectId,
    fileUrl:        fileUrl        ?? '',
    textResponse:   textResponse   ?? '',
    status:         isDraft ? 'draft' : 'submitted',
    isLate,
    submittedAt:    isDraft ? null : new Date(),
    currentVersion: isDraft ? 0    : 1,
    versions:       initialVersion,
    redoRequested:  false,
    redoReason:     '',
    messages:       [],
    gradeVisible:   false,
  })

  // ── EMAIL: only for actual submissions (not drafts) ──────────────────────────
  if (!isDraft) {
    try {
      const [student, teacher] = await Promise.all([
        User.findById((session.user as any).id).lean() as any,
        User.findById(project.teacher?._id ?? project.teacher).lean() as any,
      ])

      if (teacher?.email) {
        await sendSubmissionNotification(teacher.email, {
          teacherName:  teacher.name,
          studentName:  student?.name  ?? session.user?.name  ?? 'A student',
          studentEmail: student?.email ?? session.user?.email ?? '',
          projectTitle: project.title,
          subjectName:  (project.subject as any)?.name ?? '—',
          subjectCode:  (project.subject as any)?.code ?? '—',
          submittedAt:  new Date().toISOString(),
          isLate,
        })
      }
    } catch (emailErr) {
      console.error('[EMAIL] Failed to notify teacher of submission:', emailErr)
    }
  }

  return NextResponse.json(submission, { status: 201 })
}

// ── PATCH: update submission ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { submissionId, fileUrl, textResponse, isDraft } = await req.json()

  const existing = await Submission.findOne({
    _id:     submissionId,
    student: (session.user as any).id,
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const project = await Project.findById(existing.project).populate('teacher subject')
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const wasAlreadySubmitted = existing.status === 'submitted' || existing.status === 'graded'
  const isLate              = !isDraft && new Date() > new Date(project.deadline)
  const isRedoSubmit        = existing.redoRequested && !isDraft

  // ── Append a new version entry for every real (non-draft) submit ──────────
  if (!isDraft) {
    const nextVersion = (existing.versions?.length ?? 0) + 1
    existing.versions.push({
      version:      nextVersion,
      fileUrl:      fileUrl      ?? '',
      textResponse: textResponse ?? '',
      submittedAt:  new Date(),
      isLate,
      grade:    null,
      feedback: '',
      status:   'submitted',
    })
    existing.currentVersion = nextVersion
    existing.markModified('versions')
  }

  // ── Core fields ───────────────────────────────────────────────────────────
  existing.fileUrl      = fileUrl      ?? existing.fileUrl
  existing.textResponse = textResponse ?? existing.textResponse
  existing.status       = isDraft ? 'draft' : 'submitted'
  existing.isLate       = isLate
  if (!isDraft) existing.submittedAt = new Date()

  // ── Clear redo flag once student resubmits ─────────────────────────────────
  if (isRedoSubmit) {
    existing.redoRequested = false
    existing.redoReason    = ''
  }

  await existing.save()

  // ── EMAIL: notify teacher only when going from draft → submitted ──────────
  if (!isDraft && !wasAlreadySubmitted) {
    try {
      const [student, teacher] = await Promise.all([
        User.findById((session.user as any).id).lean() as any,
        User.findById(project.teacher?._id ?? project.teacher).lean() as any,
      ])

      if (teacher?.email) {
        await sendSubmissionNotification(teacher.email, {
          teacherName:  teacher.name,
          studentName:  student?.name  ?? session.user?.name  ?? 'A student',
          studentEmail: student?.email ?? session.user?.email ?? '',
          projectTitle: project.title,
          subjectName:  (project.subject as any)?.name ?? '—',
          subjectCode:  (project.subject as any)?.code ?? '—',
          submittedAt:  new Date().toISOString(),
          isLate,
        })
      }
    } catch (emailErr) {
      console.error('[EMAIL] Failed to notify teacher of updated submission:', emailErr)
    }
  }

  return NextResponse.json(existing)
}

// ── DELETE: remove submission ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { submissionId } = await req.json()
  await Submission.findOneAndDelete({
    _id:     submissionId,
    student: (session.user as any).id,
    status:  { $ne: 'graded' },
  })

  return NextResponse.json({ success: true })
}