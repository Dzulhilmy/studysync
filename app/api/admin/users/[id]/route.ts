import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

// PATCH update user
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const body = await req.json()
  const update: any = {}

  if (body.name) update.name = body.name
  if (body.email) update.email = body.email
  if (body.role) update.role = body.role
  if (body.isActive !== undefined) update.isActive = body.isActive
  if (body.password) update.password = await bcrypt.hash(body.password, 12)

  const user = await User.findByIdAndUpdate(params.id, update, { new: true }).select('-password')
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(user)
}

// DELETE user
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  await User.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
}
