/**
 * FILE: app/api/teacher/students/route.ts
 *
 * GET   → Returns student progress for every subject this teacher teaches.
 *          For each student: how many projects submitted, graded, and average grade.
 * PATCH → Grade a student's submission (add score + feedback).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'
import Project from '@/models/Project'
import Submission from '@/models/Submission'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/teacher/students
// Returns an array of subject groups, each containing student progress data
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  // Step 1: Get all subjects this teacher is assigned to
  const subjects = await Subject.find({ teacher: (session.user as any).id })
    .populate('students', 'name email') // get student names and emails

  // Step 2: For each subject, calculate each student's progress
  const result = await Promise.all(
    subjects.map(async (subject) => {

      // Only count APPROVED projects (pending/rejected don't count for students yet)
      const approvedProjects = await Project.find({
        subject: subject._id,
        status: 'approved',
      })
      const totalProjects = approvedProjects.length

      // Step 3: For each student in this subject, count their submissions
      const studentsProgress = await Promise.all(
        (subject.students as any[]).map(async (student) => {

          // Find this student's submissions across all approved projects
          const submissions = await Submission.find({
            project: { $in: approvedProjects.map((p) => p._id) }, // $in = "where project is one of these"
            student: student._id,
          })

          // Count submitted (not "pending")
          const submitted = submissions.filter((s) => s.status !== 'pending').length

          // Count graded
          const graded = submissions.filter((s) => s.status === 'graded').length

          // Calculate average grade across graded submissions
          const totalGrade = submissions.reduce((sum, s) => sum + (s.grade ?? 0), 0)
          const avgGrade = graded > 0 ? Math.round(totalGrade / graded) : null

          // Calculate progress percentage (submitted / total approved projects)
          const progressPct =
            totalProjects > 0 ? Math.round((submitted / totalProjects) * 100) : 0

          return {
            _id: student._id,
            name: student.name,
            email: student.email,
            submitted,
            graded,
            totalProjects,
            progressPct,  // used to render the progress bar width
            avgGrade,     // null means no graded work yet
          }
        })
      )

      return {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
        },
        students: studentsProgress,
        totalProjects,
      }
    })
  )

  return NextResponse.json(result)
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/teacher/students
// Grade a specific submission — add a score and optional feedback comment
// Body: { submissionId: string, grade: number, feedback: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { submissionId, grade, feedback } = await req.json()

  // Update the submission: set grade, feedback, and mark as "graded"
  const submission = await Submission.findByIdAndUpdate(
    submissionId,
    {
      grade,
      feedback,
      status: 'graded', // change status from "submitted" to "graded"
    },
    { new: true } // return updated document
  )

  return NextResponse.json(submission)
}
