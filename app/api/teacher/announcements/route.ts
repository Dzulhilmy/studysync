/**
 * FILE: app/api/teacher/announcements/route.ts
 *
 * GET    → Returns all announcements posted by this teacher.
 * POST   → Creates a new announcement (can be global or subject-specific).
 * DELETE → Removes an announcement this teacher posted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Announcement from '@/models/Announcement'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/teacher/announcements
// Returns all announcements made by this teacher (pinned ones appear first)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const announcements = await Announcement.find({ author: (session.user as any).id })
    .populate('subject', 'name code') // show which subject it's for
    .sort({ isPinned: -1, createdAt: -1 }) // pinned first, then newest

  return NextResponse.json(announcements)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/teacher/announcements
// Creates a new announcement
// Body: { title, content, subject (optional), isPinned (optional) }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { title, content, subject, isPinned } = await req.json()

  // Title and content are required
  if (!title || !content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    )
  }

  const announcement = await Announcement.create({
    title,
    content,
    author: (session.user as any).id,
    subject: subject || null, // null = not linked to any specific subject

    // If a subject was provided → scope is "subject" (only that class sees it)
    // If no subject → scope is "global" (all students see it)
    scope: subject ? 'subject' : 'global',

    isPinned: isPinned ?? false, // default: not pinned
  })

  return NextResponse.json(announcement, { status: 201 })
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/teacher/announcements
// Removes an announcement — only if this teacher is the author
// Body: { id: "<announcementId>" }
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { id } = await req.json()

  // Only delete if this teacher is the one who created it
  await Announcement.findOneAndDelete({
    _id: id,
    author: (session.user as any).id, // security check
  })

  return NextResponse.json({ success: true })
}
