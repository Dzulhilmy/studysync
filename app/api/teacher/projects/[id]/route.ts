/**
 * FILE: app/api/teacher/projects/[id]/route.ts
 *
 * GET    /api/teacher/projects/[id]  → fetch single project
 * PATCH  /api/teacher/projects/[id]  → edit / resubmit a project
 * DELETE /api/teacher/projects/[id]  → delete project + its submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import Project                       from '@/models/Project'
import Submission                    from '@/models/Submission'
import { notifyAdmins }              from '@/lib/notifications'

// Next.js 15+ passes params as a Promise — always await it
type RouteContext = { params: Promise<{ id: string }> }

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params

  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const project = await Project.findById(id)
    .populate('subject', 'name code teacher')
    .lean() as any

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json(project)
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params

  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const project = await Project.findById(id)
    .populate('subject', 'name code teacher')
    .lean() as any

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Verify teacher owns the subject this project belongs to
  const teacherId     = (session.user as any).id as string
  const subjectTeacher = project.subject?.teacher?.toString()
                      ?? project.teacher?.toString()
                      ?? ''
  if (subjectTeacher !== teacherId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body        = await req.json()
  const title       = body.title       as string | undefined
  const description = body.description as string | undefined
  const deadline    = body.deadline    as string | undefined
  const maxScore    = body.maxScore
  const fileUrl     = body.fileUrl  ?? undefined
  const fileName    = body.fileName ?? undefined
  const subjectId   = (body.subject ?? body.subjectId) as string | undefined

  const update: any = {}
  if (title?.trim())       update.title       = title.trim()
  if (description != null) update.description = description
  if (deadline)            update.deadline    = new Date(deadline)
  if (maxScore != null)    update.maxScore    = Number(maxScore)
  if (fileUrl  != null)    update.fileUrl     = fileUrl  || null
  if (fileName != null)    update.fileName    = fileName || null
  if (subjectId)           update.subject     = subjectId

  // Resubmitting a rejected project — reset to pending and notify admins
  if (project.status === 'rejected') {
    update.status    = 'pending'
    update.adminNote = ''

    try {
      const teacherName  = (session.user as any).name ?? 'A teacher'
      const projectTitle = update.title ?? project.title
      const subjectCode  = project.subject?.code ?? project.subject?.name ?? ''
      await notifyAdmins({
        type:    'project_pending_approval',
        title:   '🔔 Project Resubmitted',
        message: `${teacherName} resubmitted "${projectTitle}" in ${subjectCode} after revision.`,
        link:    '/admin/projects',
      })
    } catch (err) {
      console.error('[PATCH /teacher/projects/[id]] notify failed (non-fatal):', err)
    }
  }

  const updated = await Project.findByIdAndUpdate(
    id, { $set: update }, { new: true }
  ).populate('subject', 'name code teacher').lean()

  return NextResponse.json(updated)
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params

  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const project = await Project.findById(id)
    .populate('subject', 'teacher')
    .lean() as any

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const teacherId      = (session.user as any).id as string
  const subjectTeacher = project.subject?.teacher?.toString()
                      ?? project.teacher?.toString()
                      ?? ''
  if (subjectTeacher !== teacherId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete all submissions for this project first, then the project
  await Submission.deleteMany({ project: id })
  await Project.findByIdAndDelete(id)

  return NextResponse.json({ success: true })
}