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
  const subject = await Subject.findOne({
    _id: subjectId,
    teacher: (session.user as any).id,
  })
  if (!subject) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // All approved projects for this subject
  const projects = await Project.find({ subject: subjectId, status: 'approved' })

  // Submissions by this student for all these projects
  const submissions = await Submission.find({
    project: { $in: projects.map(p => p._id) },
    student: studentId,
  }).populate('project', 'title maxScore deadline')

  // Build a full list — one row per project (with or without submission)
  const rows = projects.map(proj => {
    const sub = submissions.find(
      s => s.project && (s.project as any)._id?.toString() === proj._id.toString()
    )
    return {
      project: {
        _id:      proj._id,
        title:    proj.title,
        maxScore: proj.maxScore,
        deadline: proj.deadline,
      },
      submission: sub ? {
        _id:          sub._id,
        status:       sub.status,
        grade:        sub.grade ?? null,
        feedback:     sub.feedback ?? '',
        fileUrl:      sub.fileUrl ?? '',
        textResponse: sub.textResponse ?? '',
        submittedAt:  sub.submittedAt ?? null,
        isLate:       sub.isLate,
      } : null,
    }
  })

  return NextResponse.json(rows)
}