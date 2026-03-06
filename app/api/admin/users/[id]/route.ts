import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import User                          from '@/models/User'
import bcrypt                        from 'bcryptjs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await params
  const user = await User.findById(id).select('-password').lean()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const { name, email, role, newPassword } = body

  const user = await User.findById(id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (name)        user.name     = name
  if (email)       user.email    = email
  if (role)        user.role     = role
  if (newPassword) user.password = await bcrypt.hash(newPassword, 12)

  await user.save()
  const updated = await User.findById(id).select('-password').lean()
  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await params
  if (id === (session.user as any).id) {
    return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 })
  }
  await User.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}
