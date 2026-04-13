/**
 * FILE: app/api/student/submissions/route.ts
 *
 * GET    /api/student/submissions?projectId=xxx  → fetch student's own submission
 * POST   /api/student/submissions                → create OR update a submission
 * DELETE /api/student/submissions                → remove a draft/pending submission
 *
 * POST handles both first-time submit and resubmit — the handler finds an
 * existing submission by projectId+student and updates it, or creates new.
 * This removes the need for a PATCH method on the frontend entirely.
 */

import { NextRequest, NextResponse }  from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import connectDB                      from '@/lib/db'
import Submission                     from '@/models/Submission'
import Project                        from '@/models/Project'
import User                           from '@/models/User'
import { createNotification }         from '@/lib/notifications'

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

// ── POST (create or update) ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { projectId, textResponse, fileUrl, isDraft } = body

  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  if (!fileUrl && !textResponse && !isDraft) {
    return NextResponse.json({ error: 'Please attach a file or add a text response before submitting.' }, { status: 400 })
  }

  // Load project + subject so we can detect lateness and notify teacher
  const project = await Project.findById(projectId)
    .populate({ path: 'subject', select: 'name code teacher' })
    .lean() as any
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const deadline  = new Date(project.deadline)
  const now       = new Date()
  const isLate    = now > deadline
  const newStatus = isDraft ? 'draft' : 'submitted'

  // Try to find an existing submission (handles resubmit / redo / draft save)
  let submission = await Submission.findOne({
    project: projectId,
    student: session.user.id,
  })

  if (submission) {
    // ── Update existing ───────────────────────────────────────────────────
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
    submission.redoRequested  = false   // clear redo flag on resubmit
    submission.redoReason     = ''

    submission.markModified('versions')
    await submission.save()

  } else {
    // ── Create new ────────────────────────────────────────────────────────
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

  // ── Notify teacher on real submission (not draft saves) ───────────────────
  if (!isDraft) {
    const studentName  = (session.user as any).name  ?? 'A student'
    const studentEmail = (session.user as any).email ?? ''
    const projectTitle = project.title               ?? 'Untitled Project'
    const subjectCode  = project.subject?.code       ?? ''
    const teacherId    = project.subject?.teacher?.toString() ?? ''

    if (teacherId) {
      // In-app notification — non-fatal
      try {
        await createNotification({
          recipient: teacherId,
          type:      'new_submission',
          title:     '📥 New Submission',
          message:   `${studentName} submitted "${projectTitle}" (${subjectCode}).`,
          link:      '/teacher/students',
        })
      } catch (err) {
        console.error('[submission POST] notify teacher failed (non-fatal):', err)
      }

      // Email — dynamic import so missing nodemailer never crashes the route
      try {
        const emailConfigured = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS
        if (emailConfigured) {
          const { sendSubmissionNotification } = await import('@/lib/email')
          const teacher = await User.findById(teacherId).select('email name').lean() as
            { email: string; name: string } | null
          if (teacher?.email) {
            await sendSubmissionNotification(teacher.email, {
              teacherName:  teacher.name,
              studentName,
              studentEmail,
              projectTitle,
              subjectName:  project.subject?.name ?? '',
              subjectCode,
              submittedAt:  now.toISOString(),
              isLate,
            })
          }
        }
      } catch (emailErr) {
        console.error('[submission POST] email to teacher failed (non-fatal):', emailErr)
      }
    }
  }

  return NextResponse.json(submission, { status: 201 })
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { submissionId } = body
  if (!submissionId) return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })

  // Only allow deleting own submission, and only if not yet graded
  const submission = await Submission.findOne({
    _id:     submissionId,
    student: session.user.id,
  })

  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (submission.status === 'graded') {
    return NextResponse.json({ error: 'Graded submissions cannot be removed.' }, { status: 403 })
  }

  await Submission.findByIdAndDelete(submissionId)
  return NextResponse.json({ success: true })
}