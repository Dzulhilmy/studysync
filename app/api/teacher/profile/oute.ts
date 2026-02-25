/**
 * FILE: app/api/teacher/profile/route.ts
 *
 * PATCH → Updates the teacher's profile.
 *          Can update: name, password (requires current password to confirm).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/teacher/profile
// Updates name and/or password for the logged-in teacher
// Body: { name?, currentPassword?, newPassword? }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  // Step 1: Must be logged in (any role can update their own profile)
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  // Step 2: Get values from request body
  const { name, currentPassword, newPassword } = await req.json()

  // Step 3: Find the user in the database using their session ID
  const user = await User.findById((session.user as any).id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Step 4: Build the update object (only include fields that were sent)
  const update: any = {}

  if (name) {
    update.name = name // update name if provided
  }

  // Step 5: Handle password change (only if both old and new passwords are given)
  if (currentPassword && newPassword) {
    // Verify the current password is correct before allowing a change
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash the new password before saving (never store plain text!)
    update.password = await bcrypt.hash(newPassword, 12)
  }

  // Step 6: Apply the update
  await User.findByIdAndUpdate(user._id, update)

  return NextResponse.json({ success: true })
}
