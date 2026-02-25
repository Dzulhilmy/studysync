import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

// GET all users
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const users = await User.find({}, '-password').sort({ createdAt: -1 })
  return NextResponse.json(users)
}

// POST create user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const body = await req.json()
  const { name, email, password, role } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  const exists = await User.findOne({ email })
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, password: hashed, role })
  const { password: _, ...safe } = user.toObject()
  return NextResponse.json(safe, { status: 201 })
}
