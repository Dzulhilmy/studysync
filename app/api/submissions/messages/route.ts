/**
 * FILE: app/api/submissions/messages/route.ts  ← CREATE THIS NEW FILE
 *
 * GET  /api/submissions/messages?submissionId=xxx  → fetch all messages
 * POST /api/submissions/messages                   → send a message
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import connectDB                      from '@/lib/db'
import Submission                     from '@/models/Submission'
import { createNotification }         from '@/lib/notifications'

// ── GET: fetch messages for a submission ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const submissionId = req.nextUrl.searchParams.get('submissionId')
  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

  const sub = await Submission.findById(submissionId)
    .populate({ path: 'project', populate: { path: 'subject', select: 'teacher' } })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userId    = (session.user as any).id
  const userRole  = (session.user as any).role
  const isStudent = userRole === 'student' && sub.student.toString() === userId
  const isTeacher = userRole === 'teacher'

  if (!isStudent && !isTeacher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = (sub.messages ?? []).map((m: any) => ({
    _id:        m._id,
    senderName: m.senderName,
    senderRole: m.senderRole,
    content:    m.content,
    createdAt:  m.createdAt,
  }))

  return NextResponse.json(messages)
}

// ── POST: send a message ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const { submissionId, content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  if (!submissionId)    return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

  const sub = await Submission.findById(submissionId)
    .populate({ path: 'project', select: 'title teacher' })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userId   = (session.user as any).id
  const userRole = (session.user as any).role as 'teacher' | 'student'
  const userName = (session.user as any).name ?? 'Unknown'

  const isStudent = userRole === 'student' && sub.student.toString() === userId
  const isTeacher = userRole === 'teacher'
  if (!isStudent && !isTeacher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Append the new message
  sub.messages.push({
    sender:     userId,
    senderName: userName,
    senderRole: userRole,
    content:    content.trim(),
    createdAt:  new Date(),
  } as any)
  sub.markModified('messages')
  await sub.save()

  // ── Notify the other party ────────────────────────────────────────────────
  const projectTitle = (sub.project as any)?.title ?? 'a project'
  if (isTeacher) {
    // Teacher → notify the student
    await createNotification({
      recipient: sub.student.toString(),
      type:      'new_message',
      title:     '💬 New Message from Teacher',
      message:   `${userName} sent you a message about "${projectTitle}".`,
      link:      '/student/projects',
    })
  } else {
    // Student → notify the teacher
    const teacherId = (sub.project as any)?.teacher?.toString()
    if (teacherId) {
      await createNotification({
        recipient: teacherId,
        type:      'new_message',
        title:     '💬 New Message from Student',
        message:   `${userName} sent you a message about "${projectTitle}".`,
        link:      '/teacher/students',
      })
    }
  }

  // Return the full updated messages array (same shape as GET)
  const messages = (sub.messages ?? []).map((m: any) => ({
    _id:        m._id,
    senderName: m.senderName,
    senderRole: m.senderRole,
    content:    m.content,
    createdAt:  m.createdAt,
  }))

  return NextResponse.json(messages, { status: 201 })
}