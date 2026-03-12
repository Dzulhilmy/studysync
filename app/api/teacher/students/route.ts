/**
 * FILE: app/api/teacher/students/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import Subject                       from '@/models/Subject'
import Project                       from '@/models/Project'
import Submission                    from '@/models/Submission'
import { createNotification }        from '@/lib/notifications'

// ── GET: all students + submission progress per subject ───────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const subjects = await Subject.find({ teacher: (session.user as any).id })
    .populate('students', 'name email avatarUrl')

  const result = await Promise.all(subjects.map(async (subj) => {
    const projects      = await Project.find({ subject: subj._id, status: 'approved' })
    const totalProjects = projects.length

    const studentsProgress = await Promise.all(
      (subj.students as any[]).map(async (student: any) => {
        const submissions = await Submission.find({
          project: { $in: projects.map(p => p._id) },
          student: student._id,
        })
        const submitted  = submissions.filter(s => s.status !== 'pending' && s.status !== 'draft').length
        const graded     = submissions.filter(s => s.status === 'graded').length
        const totalGrade = submissions.reduce((acc, s) => acc + (s.grade ?? 0), 0)
        const avgGrade   = graded > 0 ? Math.round(totalGrade / graded) : null
        const progressPct = totalProjects > 0 ? Math.round((submitted / totalProjects) * 100) : 0

        return {
          _id: student._id, name: student.name, email: student.email,
          avatarUrl: student.avatarUrl ?? null,
          submitted, graded, totalProjects, progressPct, avgGrade,
        }
      })
    )

    return {
      subject: { _id: subj._id, name: subj.name, code: subj.code },
      students: studentsProgress,
      totalProjects,
    }
  }))

  return NextResponse.json(result)
}

// ── PATCH: grade a submission OR request a redo ───────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const body = await req.json()
  const { submissionId } = body

  const submission = await Submission.findById(submissionId)
    .populate({ path: 'project', populate: { path: 'subject', select: 'name code' } })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Case A: request a redo ─────────────────────────────────────────────────
  if (body.requestRedo) {
    submission.redoRequested = true
    submission.redoReason    = body.redoReason ?? ''
    await submission.save()

    const projectTitle = (submission.project as any)?.title ?? 'a project'
    const reason       = body.redoReason ? ` — "${body.redoReason}"` : ''
    await createNotification({
      recipient: submission.student.toString(),
      type:      'redo_requested',
      title:     '🔄 Revision Requested',
      message:   `Your teacher has requested a revision for "${projectTitle}"${reason}.`,
      link:      '/student/projects',
    })

    return NextResponse.json({ success: true })
  }

  // ── Case B: grade a submission ─────────────────────────────────────────────
  if (body.grade !== undefined) {
    const { grade, feedback } = body

    submission.grade    = grade
    submission.feedback = feedback ?? ''
    submission.status   = 'graded'

    // Sync grade + feedback onto the matching version entry
    const versionEntry = (submission.versions ?? []).find(
      (v: any) => v.version === submission.currentVersion
    )
    if (versionEntry) {
      versionEntry.grade    = grade
      versionEntry.feedback = feedback ?? ''
      versionEntry.status   = 'graded'
      submission.markModified('versions')
    }

    await submission.save()

    const projectTitle = (submission.project as any)?.title ?? 'your project'
    const subjCode     = (submission.project as any)?.subject?.code ?? ''
    await createNotification({
      recipient: submission.student.toString(),
      type:      'submission_graded',
      title:     '✅ Submission Graded',
      message:   `Your submission for "${projectTitle}" (${subjCode}) has been graded. Score: ${grade}pts.`,
      link:      '/student/projects',
    })

    return NextResponse.json(submission)
  }

  return NextResponse.json({ error: 'No valid action provided' }, { status: 400 })
}