/**
 * FILE: app/api/student/submissions/route.ts
 *
 * GET   → Returns all submissions for the logged-in student (across all projects).
 * POST  → Create a new submission for a project.
 *          status: 'draft'     = saved but not submitted yet
 *          status: 'submitted' = officially submitted for grading
 * PATCH → Edit an existing submission (update file URL, text, or status).
 *          Also used to: submit a draft, or resubmit after rejection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Submission from '@/models/Submission'
import Project from '@/models/Project'
import Subject from '@/models/Subject'
import User from '@/models/User'
import { createNotification } from '@/lib/notifications'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/submissions
// Returns all of this student's submissions (for the dashboard and project pages)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const submissions = await Submission.find({ student: (session.user as any).id })
    .populate({
      path: 'project',
      populate: { path: 'subject', select: 'name code' }, // nested populate: project → subject
    })
    .sort({ updatedAt: -1 })

  return NextResponse.json(submissions)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student/submissions
// Creates a new submission for a project
// Body: { projectId, fileUrl?, textResponse?, isDraft }
//   isDraft: true  → save as draft (student can edit later)
//   isDraft: false → officially submit
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const studentId = (session.user as any).id
  const { projectId, fileUrl, textResponse, isDraft } = await req.json()

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
  }

  // Check if the student already has a submission for this project
  const existing = await Submission.findOne({ project: projectId, student: studentId })
  if (existing) {
    return NextResponse.json({ error: 'You already have a submission for this project' }, { status: 400 })
  }

  // Find the project to check the deadline (for late detection)
  const project = await Project.findById(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Is the submission late? (only relevant if actually submitting, not drafting)
  const isLate = !isDraft && new Date() > new Date(project.deadline)

  const submission = await Submission.create({
    project: projectId,
    student: studentId,
    fileUrl: fileUrl || '',
    textResponse: textResponse || '',
    submittedAt: isDraft ? null : new Date(),
    isLate,
    status: isDraft ? 'draft' : 'submitted',
  })

  // Notify the project's teacher that a submission was received (not for drafts)
  if (!isDraft && project) {
    const subject = await Subject.findById(project.subject)
    if (subject?.teacher) {
      const student = await User.findById(studentId, 'name')
      await createNotification({
        recipient: subject.teacher.toString(),
        type:      'submission_received',
        title:     '📥 New Submission',
        message:   `${student?.name ?? 'A student'} submitted "${project.title}".`,
        link:      '/teacher/students',
      })
    }
  }

  return NextResponse.json(submission, { status: 201 })
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/student/submissions
// Update an existing submission — edit file, submit a draft, or resubmit
// Body: { submissionId, fileUrl?, textResponse?, isDraft }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const studentId = (session.user as any).id
  const { submissionId, fileUrl, textResponse, isDraft } = await req.json()

  // Find the submission — must belong to this student
  const submission = await Submission.findOne({ _id: submissionId, student: studentId })
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Find the project to check deadline
  const project = await Project.findById(submission.project)
  const isLate = !isDraft && project ? new Date() > new Date(project.deadline) : false

  // Build the update
  const update: any = {
    fileUrl: fileUrl ?? submission.fileUrl,
    textResponse: textResponse ?? submission.textResponse,
    status: isDraft ? 'draft' : 'submitted',
    isLate,
    submittedAt: isDraft ? submission.submittedAt : new Date(),
  }

  const updated = await Submission.findByIdAndUpdate(submissionId, update, { new: true })

  // Notify teacher only when transitioning from draft → submitted
  if (!isDraft && submission.status === 'draft' && project) {
    const subject = await Subject.findById(project.subject)
    if (subject?.teacher) {
      const student = await User.findById(studentId, 'name')
      await createNotification({
        recipient: subject.teacher.toString(),
        type:      'submission_received',
        title:     '📥 Submission Received',
        message:   `${student?.name ?? 'A student'} submitted "${project.title}".`,
        link:      '/teacher/students',
      })
    }
  }

  return NextResponse.json(updated)
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/student/submissions
// Remove a submission (only allowed if it's a draft or not yet graded)
// Body: { submissionId }
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { submissionId } = await req.json()

  // Only allow deletion if status is 'draft' or 'submitted' (not graded)
  const submission = await Submission.findOne({
    _id: submissionId,
    student: (session.user as any).id,
  })

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (submission.status === 'graded') {
    return NextResponse.json({ error: 'Cannot delete a graded submission' }, { status: 403 })
  }

  await Submission.findByIdAndDelete(submissionId)
  return NextResponse.json({ success: true })
}