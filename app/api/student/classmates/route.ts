/**
 * FILE: app/api/student/classmates/route.ts
 *
 * GET → Returns classmates' progress data for subjects this student shares.
 *        Shows submission progress bars but hides grades (privacy).
 *        The logged-in student's own data is labeled separately.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'
import Project from '@/models/Project'
import Submission from '@/models/Submission'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/classmates
// Returns progress comparison data for all students in shared subjects
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const studentId = (session.user as any).id

  // Step 1: Get subjects this student is enrolled in
  const subjects = await Subject.find({ students: studentId })
    .populate('students', 'name') // get classmates' names (not emails — privacy)
    .populate('teacher', 'name')

  // Step 2: For each subject, build progress data for all students
  const result = await Promise.all(
    subjects.map(async (subject) => {
      // Only approved projects count
      const approvedProjects = await Project.find({
        subject: subject._id,
        status: 'approved',
      })
      const totalProjects = approvedProjects.length

      // Step 3: For each classmate, count their submissions
      const classmatesProgress = await Promise.all(
        (subject.students as any[]).map(async (classmate) => {
          const submissions = await Submission.find({
            project: { $in: approvedProjects.map((p) => p._id) },
            student: classmate._id,
          })

          // Count actual submissions (not drafts or pending)
          const submitted = submissions.filter(
            (s) => s.status === 'submitted' || s.status === 'graded'
          ).length

          const progressPct =
            totalProjects > 0 ? Math.round((submitted / totalProjects) * 100) : 0

          return {
            _id: classmate._id,
            name: classmate._id.toString() === studentId
              ? `${classmate.name} (You)` // label the current student
              : classmate.name,
            isMe: classmate._id.toString() === studentId,
            submitted,
            totalProjects,
            progressPct,
            // NOTE: grades are intentionally NOT included here (privacy)
          }
        })
      )

      // Sort: current student first, then by progress descending
      classmatesProgress.sort((a, b) => {
        if (a.isMe) return -1
        if (b.isMe) return 1
        return b.progressPct - a.progressPct
      })

      return {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          teacher: (subject.teacher as any)?.name,
        },
        classmates: classmatesProgress,
        totalProjects,
      }
    })
  )

  return NextResponse.json(result)
}
