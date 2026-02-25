/**
 * FILE: app/api/student/subjects/route.ts
 *
 * GET → Returns all subjects the logged-in student is enrolled in,
 *        with the list of approved projects and uploaded materials for each.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'
import Project from '@/models/Project'
import Material from '@/models/Material'
import Submission from '@/models/Submission'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/subjects
// Returns subjects this student is enrolled in, each with projects + materials
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  // Step 1: Confirm the user is a logged-in student
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const studentId = (session.user as any).id

  // Step 2: Find all subjects where this student's ID is in the students array
  const subjects = await Subject.find({ students: studentId })
    .populate('teacher', 'name email') // show teacher's name
    .sort({ createdAt: -1 })

  // Step 3: For each subject, fetch its approved projects and materials
  const enriched = await Promise.all(
    subjects.map(async (subject) => {
      // Only approved projects are visible to students
      const projects = await Project.find({
        subject: subject._id,
        status: 'approved',
      }).sort({ deadline: 1 }) // sort by deadline (soonest first)

      // All materials for this subject
      const materials = await Material.find({ subject: subject._id })
        .sort({ createdAt: -1 })

      // For each project, check if this student has submitted
      const projectsWithStatus = await Promise.all(
        projects.map(async (project) => {
          const submission = await Submission.findOne({
            project: project._id,
            student: studentId,
          })
          return {
            ...project.toObject(),
            submission: submission ? submission.toObject() : null, // null = not submitted yet
          }
        })
      )

      return {
        ...subject.toObject(),
        projects: projectsWithStatus,
        materials,
      }
    })
  )

  return NextResponse.json(enriched)
}
