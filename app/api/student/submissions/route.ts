/**
 * FILE: app/api/student/submissions/route.ts
 *
 * GET  /api/student/submissions?projectId=xxx   → fetch student's own submission
 * POST /api/student/submissions                 → create / update submission
 *
 * On submit (not draft): notifies the teacher in-app + sends email to teacher.
 */

import { NextRequest, NextResponse }  from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import connectDB                      from '@/lib/db'
import Submission                     from '@/models/Submission'
import Project                        from '@/models/Project'
import User                           from '@/models/User'
import { createNotification }         from '@/lib/notifications'
import { sendSubmissionNotification } from '@/lib/email'

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const submission = await Submission.findOne({
    project: projectId,
    student: session.user.id,
  }).lean()

  return NextResponse.json(submission ?? null)
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const { projectId, textResponse, fileUrl, isDraft } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // Load project with subject + teacher
  const project = await Project.findById(projectId)
    .populate({ path: 'subject', select: 'name code teacher' })
    .lean() as any
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const deadline  = new Date(project.deadline)
  const now       = new Date()
  const isLate    = now > deadline
  const newStatus = isDraft ? 'draft' : 'submitted'

  let submission = await Submission.findOne({ project: projectId, student: session.user.id })

  if (submission) {
    // ── Resubmission — add new version ────────────────────────────────────
    const newVersion = (submission.currentVersion ?? 1) + 1

    submission.versions.push({
      version:      newVersion,
      fileUrl:      fileUrl      ?? '',
      textResponse: textResponse ?? '',
      submittedAt:  isDraft ? null : now,
      isLate,
      grade:        null,
      feedback:     '',
      status:       newStatus,
    } as any)

    submission.currentVersion = newVersion
    submission.fileUrl        = fileUrl      ?? submission.fileUrl
    submission.textResponse   = textResponse ?? submission.textResponse
    submission.status         = newStatus
    submission.submittedAt    = isDraft ? submission.submittedAt : now
    submission.isLate         = isLate
    submission.redoRequested  = false
    submission.redoReason     = ''

    submission.markModified('versions')
    await submission.save()

  } else {
    // ── First submission ──────────────────────────────────────────────────
    submission = await Submission.create({
      project:        projectId,
      student:        session.user.id,
      status:         newStatus,
      fileUrl:        fileUrl      ?? '',
      textResponse:   textResponse ?? '',
      submittedAt:    isDraft ? null : now,
      isLate,
      currentVersion: 1,
      grade:          null,
      feedback:       '',
      redoRequested:  false,
      redoReason:     '',
      messages:       [],
      versions: [{
        version:      1,
        fileUrl:      fileUrl      ?? '',
        textResponse: textResponse ?? '',
        submittedAt:  isDraft ? null : now,
        isLate,
        grade:        null,
        feedback:     '',
        status:       newStatus,
      }],
    })
  }

  // ── Fire notifications only on real submissions (not saves/drafts) ────────
  if (!isDraft) {
    const studentName  = (session.user as any).name  ?? 'A student'
    const studentEmail = (session.user as any).email ?? ''
    const projectTitle = project.title               ?? 'Untitled Project'
    const subjectName  = project.subject?.name       ?? ''
    const subjectCode  = project.subject?.code       ?? ''
    const teacherId    = project.subject?.teacher?.toString() ?? ''

    if (teacherId) {
      // In-app notification to teacher
      await createNotification({
        recipient: teacherId,
        type:      'new_submission',
        title:     '📥 New Submission',
        message:   `${studentName} submitted "${projectTitle}" (${subjectCode}).`,
        link:      '/teacher/students',
      })

      // Email to teacher — non-fatal
      try {
        const teacher = await User.findById(teacherId).select('email name').lean() as
          { email: string; name: string } | null

        if (teacher?.email) {
          await sendSubmissionNotification(teacher.email, {
            teacherName:  teacher.name,
            studentName,
            studentEmail,
            projectTitle,
            subjectName,
            subjectCode,
            submittedAt:  now.toISOString(),
            isLate,
          })
        }
      } catch (emailErr) {
        console.error('[submission] email to teacher failed (non-fatal):', emailErr)
      }
    }
  }

  return NextResponse.json(submission, { status: 201 })
}