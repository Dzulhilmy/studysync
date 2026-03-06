/**
 * FILE: app/api/teacher/projects/route.ts
 *
 * EMAIL TRIGGERS ADDED:
 *   POST  → project created → email to admin(s) for approval
 *   PATCH → project approved by admin → email to all enrolled students
 *
 * HOW TO USE:
 *   Replace your existing app/api/teacher/projects/route.ts with this file.
 *   The email calls are clearly marked with ── EMAIL ── comments.
 *   Everything else is unchanged from your original logic.
 */

import { NextRequest, NextResponse }        from 'next/server'
import { getServerSession }                 from 'next-auth'
import { authOptions }                      from '@/lib/auth'
import connectDB                            from '@/lib/db'
import Project                              from '@/models/Project'
import Subject                              from '@/models/Subject'
import User                                 from '@/models/User'
import {
  sendNewProjectEmail,
  sendProjectApprovalEmail,
} from '@/lib/email'                         // ← ADD

// ── GET: list teacher's projects ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const projects = await Project.find({ teacher: (session.user as any).id })
    .populate('subject', 'name code')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(projects)
}

// ── POST: create new project → notify admins ──────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const body = await req.json()
  const { title, description, subject: subjectId, deadline, maxScore, fileUrl, fileName } = body

  if (!title || !subjectId || !deadline) {
    return NextResponse.json({ error: 'Title, subject and deadline are required.' }, { status: 400 })
  }

  const project = await Project.create({
    title, description, subject: subjectId,
    deadline, maxScore: maxScore ?? 100,
    fileUrl: fileUrl ?? null, fileName: fileName ?? null,
    teacher: (session.user as any).id,
    status: 'pending',
  })

  // ── EMAIL: notify all admins that a new project needs approval ───────────────
  try {
    const [subject, teacher, admins] = await Promise.all([
      Subject.findById(subjectId).lean() as any,
      User.findById((session.user as any).id).lean() as any,
      User.find({ role: 'admin' }).select('name email').lean() as unknown as any[],
    ])

    for (const admin of admins) {
      await sendProjectApprovalEmail(admin.email, {
        adminName:    admin.name,
        teacherName:  teacher?.name  ?? session.user?.name  ?? 'Unknown',
        teacherEmail: teacher?.email ?? session.user?.email ?? '',
        projectTitle: title,
        subjectName:  subject?.name  ?? subjectId,
        subjectCode:  subject?.code  ?? '—',
        deadline,
        maxScore:     maxScore ?? 100,
        description,
      })
    }
  } catch (emailErr) {
    // Never let an email failure break the main flow
    console.error('[EMAIL] Failed to notify admins of new project:', emailErr)
  }
  // ── END EMAIL ────────────────────────────────────────────────────────────────

  return NextResponse.json(project, { status: 201 })
}

// ── PATCH: edit / resubmit project ───────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const body = await req.json()
  const { projectId, title, description, subject: subjectId, deadline, maxScore, fileUrl, fileName } = body

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const project = await Project.findOneAndUpdate(
    { _id: projectId, teacher: (session.user as any).id },
    { title, description, subject: subjectId, deadline, maxScore, fileUrl, fileName, status: 'pending' },
    { new: true }
  )

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── EMAIL: re-submitted project (was rejected) → notify admins again ─────────
  try {
    const [subject, teacher, admins] = await Promise.all([
      Subject.findById(subjectId ?? project.subject).lean() as any,
      User.findById((session.user as any).id).lean() as any,
      User.find({ role: 'admin' }).select('name email').lean() as unknown as any[],
    ])

    for (const admin of admins) {
      await sendProjectApprovalEmail(admin.email, {
        adminName:    admin.name,
        teacherName:  teacher?.name  ?? session.user?.name  ?? 'Unknown',
        teacherEmail: teacher?.email ?? session.user?.email ?? '',
        projectTitle: title ?? project.title,
        subjectName:  subject?.name  ?? '—',
        subjectCode:  subject?.code  ?? '—',
        deadline:     deadline ?? project.deadline,
        maxScore:     maxScore ?? project.maxScore,
        description:  description ?? project.description,
      })
    }
  } catch (emailErr) {
    console.error('[EMAIL] Failed to notify admins of resubmitted project:', emailErr)
  }
  // ── END EMAIL ────────────────────────────────────────────────────────────────

  return NextResponse.json(project)
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await Project.findOneAndDelete({ _id: id, teacher: (session.user as any).id })
  return NextResponse.json({ success: true })
}