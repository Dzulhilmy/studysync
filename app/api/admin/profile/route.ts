import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const { name, currentPassword, newPassword } = await req.json()
  const user = await User.findById((session.user as any).id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const update: any = {}
  if (name) update.name = name

  if (currentPassword && newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    update.password = await bcrypt.hash(newPassword, 12)
  }

  await User.findByIdAndUpdate(user._id, update)
  return NextResponse.json({ success: true })
}
