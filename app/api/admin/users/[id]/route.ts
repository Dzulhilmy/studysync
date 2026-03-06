/**
 * FILE: app/api/admin/users/[id]/route.ts
 *
 * FIXED for Next.js 15:
 *   params is now a Promise<{ id: string }> — you must await it.
 *
 * The pattern to fix is the same in ALL [id] dynamic routes:
 *
 *   BEFORE (Next.js 14):
 *     { params }: { params: { id: string } }
 *     params.id
 *
 *   AFTER  (Next.js 15):
 *     { params }: { params: Promise<{ id: string }> }
 *     const { id } = await params
 *
 * ── Replace your entire app/api/admin/users/[id]/route.ts with this ─────────
 * (or if your file has extra logic, just apply the two changes above)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import User                          from '@/models/User'
import bcrypt                        from 'bcryptjs'
import { sendPasswordChangedEmail }  from '@/lib/email'

// ── GET: fetch a single user ──────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ✅ Promise
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { id } = await params                         // ✅ await

  const user = await User.findById(id).select('-password').lean()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(user)
}

// ── PATCH: update user (name, email, role, or password) ──────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ✅ Promise
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { id }  = await params                        // ✅ await
  const body    = await req.json()
  const { name, email, role, newPassword } = body

  const user = await User.findById(id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const passwordChanged = !!newPassword

  // Apply updates
  if (name)        user.name  = name
  if (email)       user.email = email
  if (role)        user.role  = role
  if (newPassword) user.password = await bcrypt.hash(newPassword, 12)

  await user.save()

  // ── EMAIL: notify admins if password was reset by admin ──────────────────────
  if (passwordChanged) {
    try {
      const admins = await User.find({ role: 'admin' })
        .select('name email')
        .lean() as unknown as any[]

      const changer = await User.findById((session.user as any).id)
        .lean() as unknown as any

      for (const admin of admins) {
        await sendPasswordChangedEmail(admin.email, {
          adminName:    admin.name,
          targetName:   user.name,
          targetEmail:  user.email,
          targetRole:   user.role as 'teacher' | 'student' | 'admin',
          changedAt:    new Date().toISOString(),
          changedBy:    changer?.name ?? session.user?.name ?? 'Admin',
        })
      }
    } catch (emailErr) {
      console.error('[EMAIL] Failed to send password change notification:', emailErr)
    }
  }
  // ── END EMAIL ────────────────────────────────────────────────────────────────

  const updated = await User.findById(id).select('-password').lean()
  return NextResponse.json(updated)
}

// ── DELETE: remove a user ─────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ✅ Promise
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { id } = await params                         // ✅ await

  // Prevent admin from deleting themselves
  if (id === (session.user as any).id) {
    return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 })
  }

  await User.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}