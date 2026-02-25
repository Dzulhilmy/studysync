/**
 * FILE: app/api/teacher/subjects/route.ts
 * 
 * GET → Returns all subjects assigned to the logged-in teacher,
 *        including how many students are enrolled and how many
 *        learning materials have been uploaded per subject.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'
import Material from '@/models/Material'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/teacher/subjects
// Returns the teacher's subjects with student list and material count
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  // Step 1: Verify the user is a teacher
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  // Step 2: Find all subjects where teacher = this user
  // .populate('students') replaces student IDs with their name and email
  const subjects = await Subject.find({ teacher: (session.user as any).id })
    .populate('students', 'name email')
    .sort({ createdAt: -1 })

  // Step 3: For each subject, count how many materials have been uploaded
  const enriched = await Promise.all(
    subjects.map(async (subject) => {
      // Count documents in the Material collection that belong to this subject
      const materialCount = await Material.countDocuments({ subject: subject._id })

      return {
        ...subject.toObject(),
        materialCount, // attach the count so the frontend can display it
      }
    })
  )

  return NextResponse.json(enriched)
}
