/**
 * FILE: app/api/auth/reset-password/route.ts
 *
 * Handles password resets for ALL roles (student / teacher / admin).
 * After a successful reset:
 *   → Notifies ALL admin accounts via email with user details + timestamp.
 *
 * Frontend usage:
 *   fetch('/api/auth/reset-password', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       email: 'user@example.com',
 *     })
 *   })
 */

import { NextRequest, NextResponse }    from 'next/server'
import { getServerSession }             from 'next-auth'
import { authOptions }                  from '@/lib/auth'
import connectDB                        from '@/lib/db'
import User                             from '@/models/User'
import bcrypt                           from 'bcryptjs'
import { sendPasswordChangedEmail }     from '@/lib/email'   // ← ADD

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { currentPassword, newPassword } = await req.json()

  // ── Validation ────────────────────────────────────────────────────────────
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Current password and new password are required.' },
      { status: 400 }
    )
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters.' },
      { status: 400 }
    )
  }

  // ── Fetch user and verify current password ────────────────────────────────
  const user = await User.findById((session.user as any).id)
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    return NextResponse.json(
      { error: 'Current password is incorrect.' },
      { status: 400 }
    )
  }

  // ── Hash and save new password ────────────────────────────────────────────
  const hashed = await bcrypt.hash(newPassword, 12)
  user.password = hashed
  await user.save()

  // ── EMAIL: notify all admins ──────────────────────────────────────────────
  try {
    const admins = await User.find({ role: 'admin' })
      .select('name email')
      .lean() as any[]

    const changedAt = new Date().toISOString()

    for (const admin of admins) {
      // Don't notify an admin about their own password change twice
      // (they'll still get it but as the "admin" recipient, not separately)
      await sendPasswordChangedEmail(admin.email, {
        adminName:    admin.name,
        targetName:   user.name,
        targetEmail:  user.email,
        targetRole:   user.role as 'teacher' | 'student' | 'admin',
        changedAt,
        changedBy:    user.name,  // self-service change
      })
    }

    console.log(`[EMAIL] Password change notified to ${admins.length} admin(s) for user: ${user.email}`)
  } catch (emailErr) {
    // Never block the password change because email failed
    console.error('[EMAIL] Failed to send password change notification:', emailErr)
  }
  // ── END EMAIL ─────────────────────────────────────────────────────────────

  return NextResponse.json({ success: true, message: 'Password changed successfully.' })
}