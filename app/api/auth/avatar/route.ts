import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { avatarUrl?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { avatarUrl } = body

  if (avatarUrl !== null && avatarUrl !== undefined) {
    const isBase64  = typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')
    const isHttpUrl = typeof avatarUrl === 'string' && (
      avatarUrl.startsWith('https://') || avatarUrl.startsWith('http://localhost')
    )
    if (!isBase64 && !isHttpUrl) {
      return NextResponse.json({ error: 'avatarUrl must be a base64 data URI or a valid URL' }, { status: 400 })
    }
  }

  await dbConnect()

  const updated = await User.findByIdAndUpdate(
    session.user.id,
    { avatarUrl: avatarUrl ?? null },
    { new: true }
  ).select('avatarUrl').lean() as any

  if (!updated) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, avatarUrl: updated.avatarUrl ?? null })
}