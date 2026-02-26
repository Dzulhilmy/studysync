/**
 * createNotification — server-side utility
 *
 * Call this inside any API route after an action to fire a notification.
 *
 * Usage:
 *   import { createNotification, createBulkNotifications } from '@/lib/notifications'
 *
 *   // Single recipient
 *   await createNotification({
 *     recipient: userId,
 *     type: 'project_approved',
 *     title: 'Project Approved!',
 *     message: 'Your project "Math Quiz" has been approved.',
 *     link: '/teacher/projects',
 *   })
 *
 *   // Multiple recipients at once
 *   await createBulkNotifications(studentIds, {
 *     type: 'project_published',
 *     title: 'New Project Available',
 *     message: 'A new project has been published for your subject.',
 *     link: '/student/projects',
 *   })
 */

import connectDB from '@/lib/db'
import Notification from '@/models/Notification'
import type { NotifType } from '@/models/Notification'

interface NotifPayload {
  recipient: string
  type:      NotifType
  title:     string
  message:   string
  link:      string
}

export async function createNotification(payload: NotifPayload) {
  try {
    await connectDB()
    await Notification.create(payload)
  } catch (err) {
    // Never throw — notification failure should never break the main action
    console.error('[createNotification] failed:', err)
  }
}

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