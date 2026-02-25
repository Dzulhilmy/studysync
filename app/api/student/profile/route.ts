/**
 * FILE: app/api/student/profile/route.ts
 *
 * PATCH → Updates the student's name and/or password.
 *          Requires current password verification before allowing password change.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/student/profile
// Body: { name?, currentPassword?, newPassword? }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const { name, currentPassword, newPassword } = await req.json()

  // Find the user by their session ID
  const user = await User.findById((session.user as any).id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Build the update object only with changed fields
  const update: any = {}

  if (name) update.name = name

  if (currentPassword && newPassword) {
    // Verify the current password is correct before changing
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }
    // Hash the new password — never store plain text
    update.password = await bcrypt.hash(newPassword, 12)
  }

  await User.findByIdAndUpdate(user._id, update)
  return NextResponse.json({ success: true })
}
