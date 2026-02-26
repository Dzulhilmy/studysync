import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Notification from '@/models/Notification'

// GET /api/notifications?limit=20&unread=true
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId  = (session.user as any).id
  const params  = req.nextUrl.searchParams
  const limit   = parseInt(params.get('limit') ?? '30')
  const unread  = params.get('unread') === 'true'

  const query: any = { recipient: userId }
  if (unread) query.isRead = false

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)

  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false })

  return NextResponse.json({ notifications, unreadCount })
}

// PATCH /api/notifications  — mark one or all as read
// body: { id: string }        → mark single
// body: { markAll: true }     → mark all
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId = (session.user as any).id
  const { id, markAll } = await req.json()

  if (markAll) {
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true })
  } else if (id) {
    await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { isRead: true })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/notifications?id=xxx  — delete a single notification
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