import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await params  // Next.js 15: params must be awaited
  const body = await req.json()
  const subject = await Subject.findByIdAndUpdate(id, body, { new: true })
    .populate('teacher', 'name email')
    .populate('students', 'name email')
  if (!subject) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(subject)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await params  // Next.js 15: params must be awaited
  await Subject.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}