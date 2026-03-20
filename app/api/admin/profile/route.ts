import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import User                          from '@/models/User'
import bcrypt                        from 'bcryptjs'
import { notifyAdmins }              from '@/lib/notifications'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const { name, currentPassword, newPassword } = await req.json()

  const user = await User.findById((session.user as any).id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ── Track what actually changed ───────────────────────────────────────────
  const changes: string[] = []
  const update: any = {}

  if (name && name !== user.name) {
    changes.push(`Name: "${user.name}" → "${name}"`)
    update.name = name
  }

  if (currentPassword && newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    update.password = await bcrypt.hash(newPassword, 12)
    changes.push('Password: changed')
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ success: true }) // nothing to do
  }

  await User.findByIdAndUpdate(user._id, update)

  // ── Notify other admins (non-fatal) ───────────────────────────────────────
  // Skip notifying yourself — only relevant when there are multiple admins.
  if (changes.length) {
    await notifyAdmins({
      type:    'profile_updated',
      title:   '✏️ Admin Profile Updated',
      message: `${user.name} (admin) updated their profile. Changes: ${changes.join(' · ')}`,
      link:    '/admin/users',
    })
  }

  return NextResponse.json({ success: true })
}