/**
 * FILE: app/api/student/announcements/route.ts
 *
 * GET   → Returns all announcements visible to this student:
 *          - Global announcements (scope: 'global')
 *          - Subject-level announcements for subjects they're enrolled in
 * PATCH → Mark an announcement as read by this student.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Announcement from '@/models/Announcement'
import Subject from '@/models/Subject'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/student/announcements
// Returns global + subject announcements relevant to this student
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const studentId = (session.user as any).id

  // Step 1: Find which subjects this student is enrolled in
  const enrolledSubjects = await Subject.find({ students: studentId }).select('_id')
  const subjectIds = enrolledSubjects.map((s) => s._id)

  // Step 2: Fetch announcements that are either:
  //   a) Global (scope = 'global') — visible to all students
  //   b) For one of this student's subjects
  const announcements = await Announcement.find({
    $or: [
      { scope: 'global' },
      { scope: 'subject', subject: { $in: subjectIds } },
    ],
  })
    .populate('author', 'name')      // show who posted it
    .populate('subject', 'name code') // show which subject it's for
    .sort({ isPinned: -1, createdAt: -1 }) // pinned first, then newest

  return NextResponse.json(announcements)
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/student/announcements
// Mark an announcement as "read" by this student
// Body: { announcementId }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { announcementId } = await req.json()
  const studentId = (session.user as any).id

  // $addToSet adds the studentId to readBy[] only if it's not already there
  // This prevents duplicate entries in the readBy array
  await Announcement.findByIdAndUpdate(announcementId, {
    $addToSet: { readBy: studentId },
  })

  return NextResponse.json({ success: true })
}
