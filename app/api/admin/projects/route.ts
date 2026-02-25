import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Project from '@/models/Project'

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
  return NextResponse.json(project)
}
