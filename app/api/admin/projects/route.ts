import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Project from '@/models/Project'
import Subject from '@/models/Subject'
import { createNotification, createBulkNotifications } from '@/lib/notifications'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const projects = await Project.find({})
    .populate('subject', 'name code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
  return NextResponse.json(projects)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id, status, adminNote } = await req.json()
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const project = await Project.findByIdAndUpdate(
    id,
    { status, adminNote: adminNote || '' },
    { new: true }
  ).populate('subject', 'name code').populate('createdBy', 'name email')

  if (project) {
    const teacherId = (project.createdBy as any)._id?.toString()
    const title     = (project as any).title
    const subjCode  = (project.subject as any)?.code ?? ''

    // Notify the teacher who owns this project
    if (status === 'approved') {
      await createNotification({
        recipient: teacherId,
        type:      'project_approved',
        title:     '✅ Project Approved',
        message:   `Your project "${title}" (${subjCode}) has been approved and is now visible to students.`,
        link:      '/teacher/projects',
      })
      // Notify enrolled students that a new project is available
      const subject = await Subject.findById((project as any).subject._id)
      if (subject?.students?.length) {
        const studentIds = subject.students.map((s: any) => s.toString())
        await createBulkNotifications(studentIds, {
          type:    'project_published',
          title:   '📋 New Project Available',
          message: `A new project "${title}" has been published for ${subjCode}.`,
          link:    '/student/projects',
        })
      }
    } else if (status === 'rejected') {
      await createNotification({
        recipient: teacherId,
        type:      'project_rejected',
        title:     '❌ Project Rejected',
        message:   `Your project "${title}" (${subjCode}) was rejected.${adminNote ? ` Note: ${adminNote}` : ''}`,
        link:      '/teacher/projects',
      })
    }
  }

  return NextResponse.json(project)
}