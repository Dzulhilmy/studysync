/**
 * FILE: app/api/teacher/projects/route.ts
 * 
 * GET  → Returns all projects created by the logged-in teacher,
 *         enriched with submission stats and 5-day warning flags.
 * POST → Creates a new project. Status starts as "pending" until admin approves.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Project from '@/models/Project'
import Submission from '@/models/Submission'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/teacher/projects
// Returns all projects this teacher created, with submission counts attached
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  // Step 1: Verify the user is logged in and has the "teacher" role
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Connect to MongoDB
  await connectDB()

  // Step 3: Find all projects where this teacher is the creator
  // .populate() replaces the subject ID with the actual subject data
  const projects = await Project.find({ createdBy: (session.user as any).id })
    .populate('subject', 'name code students') // get subject name, code, and enrolled students
    .sort({ createdAt: -1 })                   // show newest first

  // Step 4: Loop through each project and attach extra stats
  const enriched = await Promise.all(
    projects.map(async (project) => {
      const projectObj = project.toObject()

      // How many students are enrolled in this subject?
      const totalStudents = (projectObj.subject as any)?.students?.length ?? 0

      // Get all submissions for this project
      const submissions = await Submission.find({ project: project._id })

      // Count students who have actually submitted (status is not "pending")
      const submitted = submissions.filter((s) => s.status !== 'pending').length

      // Count students whose work has been graded
      const graded = submissions.filter((s) => s.status === 'graded').length

      // Calculate how many days are left before the deadline
      const daysLeft = Math.ceil(
        (new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      // Students who still haven't submitted
      const unsubmitted = totalStudents - submitted

      // Trigger warning if: deadline ≤ 5 days AND some students haven't submitted
      const warnUnsubmitted = daysLeft <= 5 && daysLeft >= 0 && unsubmitted > 0

      // Return the original project data PLUS our extra stats
      return {
        ...projectObj,
        totalStudents,
        submitted,
        graded,
        warnUnsubmitted, // true = show warning banner on the frontend
        daysLeft,
        unsubmitted,
      }
    })
  )

  return NextResponse.json(enriched)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/teacher/projects
// Creates a brand new project and sends it for admin approval
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Step 1: Only teachers can create projects
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  // Step 2: Extract data from the request body
  const { title, description, subject, deadline, maxScore } = await req.json()

  // Step 3: Make sure required fields are present
  if (!title || !subject || !deadline) {
    return NextResponse.json(
      { error: 'Title, subject, and deadline are required' },
      { status: 400 }
    )
  }

  // Step 4: Save the project to the database
  // Note: status = 'pending' means it waits for admin to approve before students can see it
  const project = await Project.create({
    title,
    description,
    subject,
    deadline,
    maxScore: maxScore || 100, // default 100 if not provided
    createdBy: (session.user as any).id,
    status: 'pending',
  })

  // Return the new project with HTTP 201 (Created)
  return NextResponse.json(project, { status: 201 })
}
