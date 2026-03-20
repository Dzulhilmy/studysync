/**
 * lib/notifications.ts
 * Server-side notification utility. Call from any API route.
 * Never throws — notification failure never breaks the main action.
 */

import connectDB        from '@/lib/db'
import Notification     from '@/models/Notification'
import User             from '@/models/User'
import type { NotifType } from '@/models/Notification'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotifPayload {
  recipient: string
  type:      NotifType
  title:     string
  message:   string
  link:      string
}

// ── Single notification ───────────────────────────────────────────────────────

export async function createNotification(payload: NotifPayload) {
  try {
    await connectDB()
    await Notification.create(payload)
  } catch (err) {
    console.error('[createNotification] failed:', err)
  }
}

// ── Bulk notifications (e.g. all enrolled students) ───────────────────────────

export async function createBulkNotifications(
  recipientIds: string[],
  payload: Omit<NotifPayload, 'recipient'>
) {
  if (!recipientIds.length) return
  try {
    await connectDB()
    await Notification.insertMany(
      recipientIds.map(id => ({ ...payload, recipient: id }))
    )
  } catch (err) {
    console.error('[createBulkNotifications] failed:', err)
  }
}

// ── Notify all active admins ──────────────────────────────────────────────────
// Used for: project approval requests, profile changes, new reports.
// Automatically finds all admin accounts so callers don't need to hardcode IDs.

export async function notifyAdmins(payload: Omit<NotifPayload, 'recipient'>) {
  try {
    await connectDB()
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean() as { _id: any }[]
    if (!admins.length) return
    await Notification.insertMany(
      admins.map(a => ({ ...payload, recipient: a._id.toString() }))
    )
  } catch (err) {
    console.error('[notifyAdmins] failed:', err)
  }
}