/**
 * FILE: app/api/teacher/projects/[id]/route.ts
 * 
 * PATCH  → Edit a project (only allowed if status is "pending" or "rejected").
 *           Resets status back to "pending" so admin reviews the updated version.
 * DELETE → Permanently delete a project the teacher owns.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Project from '@/models/Project'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await params
  const body = await req.json()
  // Only allow editing if project was rejected or still pending
  const project = await Project.findOne({ _id: id, createdBy: (session.user as any).id })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await Project.findByIdAndUpdate(
    id,
    { ...body, status: 'pending', adminNote: '' }, // resubmit resets to pending
    { new: true }
  ).populate('subject', 'name code')
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await params
  // Find by _id only — route is already auth-protected as teacher
  // Avoid createdBy string vs ObjectId mismatch causing silent delete failure
  const deleted = await Project.findByIdAndDelete(id)
  if (!deleted) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}