import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'
import Project from '@/models/Project'
import Submission from '@/models/Submission'
import { createNotification } from '@/lib/notifications'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  // Get all subjects taught by this teacher
  const subjects = await Subject.find({ teacher: (session.user as any).id })
    .populate('students', 'name email')

  // For each subject, get projects and student submission progress
  const result = await Promise.all(subjects.map(async (subj) => {
    const projects = await Project.find({ subject: subj._id, status: 'approved' })
    const totalProjects = projects.length

    const studentsProgress = await Promise.all(
      (subj.students as any[]).map(async (student: any) => {
        const submissions = await Submission.find({
          project: { $in: projects.map(p => p._id) },
          student: student._id,
        })
        const submitted = submissions.filter(s => s.status !== 'pending').length
        const graded = submissions.filter(s => s.status === 'graded').length
        const totalGrade = submissions.reduce((acc, s) => acc + (s.grade ?? 0), 0)
        const avgGrade = graded > 0 ? Math.round(totalGrade / graded) : null
        const progressPct = totalProjects > 0 ? Math.round((submitted / totalProjects) * 100) : 0
        return { _id: student._id, name: student.name, email: student.email, submitted, graded, totalProjects, progressPct, avgGrade }
      })
    )

    return { subject: { _id: subj._id, name: subj.name, code: subj.code }, students: studentsProgress, totalProjects }
  }))

  return NextResponse.json(result)
}

// Grade / feedback on a submission
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { submissionId, grade, feedback } = await req.json()
  const submission = await Submission.findByIdAndUpdate(
    submissionId,
    { grade, feedback, status: 'graded' },
    { new: true }
  ).populate({ path: 'project', populate: { path: 'subject', select: 'name code' } })

  // Notify the student their submission has been graded
  if (submission) {
    const projectTitle = (submission.project as any)?.title ?? 'your project'
    const subjCode     = (submission.project as any)?.subject?.code ?? ''
    await createNotification({
      recipient: submission.student.toString(),
      type:      'submission_graded',
      title:     '✅ Submission Graded',
      message:   `Your submission for "${projectTitle}" (${subjCode}) has been graded. Score: ${grade}pts.`,
      link:      '/student/projects',
    })
  }

  return NextResponse.json(submission)
}