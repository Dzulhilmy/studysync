import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Subject from '@/models/Subject'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const subjects = await Subject.find({})
    .populate('teacher', 'name email')
    .populate('students', 'name email')
    .sort({ createdAt: -1 })
  return NextResponse.json(subjects)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const body = await req.json()
  const { name, code, description, teacher } = body
  if (!name || !code) return NextResponse.json({ error: 'Name and code required' }, { status: 400 })

  const exists = await Subject.findOne({ code: code.toUpperCase() })
  if (exists) return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 })

  const subject = await Subject.create({ name, code, description, teacher: teacher || null })
  return NextResponse.json(subject, { status: 201 })
}
