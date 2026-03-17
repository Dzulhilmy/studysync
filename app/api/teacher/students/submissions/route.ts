/**
 * FILE: app/api/teacher/students/submissions/route.ts
 * GET ?studentId=xxx&subjectId=yyy  → all submissions by student for that subject's projects
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'
import Project from '@/models/Project'
import Submission from '@/models/Submission'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const studentId = req.nextUrl.searchParams.get('studentId')
  const subjectId = req.nextUrl.searchParams.get('subjectId')
  if (!studentId || !subjectId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Verify teacher owns this subject
  // Use findById + string comparison to avoid ObjectId type mismatch issues
  const subject = await Subject.findById(subjectId).lean()
  if (!subject) {
    return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
  }

  const sessionTeacherId = String((session.user as any).id ?? '')
  const subjectTeacherId = String((subject as any).teacher ?? '')

  if (!sessionTeacherId || sessionTeacherId !== subjectTeacherId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // All approved projects for this subject
  const projects = await Project.find({
    subject: (subject as any)._id,
    status: 'approved',
  }).lean()

  // Submissions by this student for these projects
  const submissions = await Submission.find({
    project: { $in: projects.map(p => (p as any)._id) },
    student: studentId,
  }).lean()

  // Build one row per project (submission may or may not exist)
  const rows = projects.map(proj => {
    const sub = submissions.find(
      s => String((s as any).project) === String((proj as any)._id)
    )
    return {
      project: {
        _id:      (proj as any)._id,
        title:    (proj as any).title,
        maxScore: (proj as any).maxScore,
        deadline: (proj as any).deadline,
      },
      submission: sub ? {
        _id:          (sub as any)._id,
        status:       (sub as any).status,
        grade:        (sub as any).grade ?? null,
        feedback:     (sub as any).feedback ?? '',
        fileUrl:      (sub as any).fileUrl ?? '',
        textResponse: (sub as any).textResponse ?? '',
        submittedAt:  (sub as any).submittedAt ?? null,
        isLate:       (sub as any).isLate ?? false,
        versions:      (sub as any).versions ?? [],
        redoRequested: (sub as any).redoRequested ?? false,
        redoReason:    (sub as any).redoReason ?? '',
        messages:      (sub as any).messages ?? [],
      } : null,
    }
  })

  return NextResponse.json(rows)
}