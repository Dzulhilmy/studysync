/**
 * FILE: app/api/notifications/route.ts
 *
 * GET    /api/notifications          → fetch notifications + unread count
 * PATCH  /api/notifications          → mark one or all as read
 * DELETE /api/notifications?id=xxx   → delete a single notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import connectDB                      from '@/lib/db'
import Notification                   from '@/models/Notification'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const userId = (session.user as any).id
  const limit  = parseInt(req.nextUrl.searchParams.get('limit') ?? '30')

  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  // Use the correct field name from the schema: 'read' not 'isRead'
  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const userId         = (session.user as any).id
  const { id, markAll } = await req.json()

  if (markAll) {
    await Notification.updateMany({ recipient: userId, read: false }, { read: true })
  } else if (id) {
    await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { read: true })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const userId = (session.user as any).id
  const id     = req.nextUrl.searchParams.get('id')
  if (id) {
    await Notification.findOneAndDelete({ _id: id, recipient: userId })
  }
  return NextResponse.json({ success: true })
}