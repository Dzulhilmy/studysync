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

  // If an image was provided, do a basic sanity check
  if (avatarUrl !== null && avatarUrl !== undefined) {
    // Must be a base64 data URL or a regular https:// URL
    const isBase64  = typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')
    const isHttpUrl = typeof avatarUrl === 'string' && avatarUrl.startsWith('https://')

    if (!isBase64 && !isHttpUrl) {
      return NextResponse.json(
        { error: 'avatarUrl must be a base64 data URI or an https:// URL' },
        { status: 400 }
      )
    }

    // Reject base64 strings larger than ~2 MB (2 MB file → ~2.7 MB base64)
    if (isBase64 && avatarUrl.length > 3_000_000) {
      return NextResponse.json(
        { error: 'Image is too large. Maximum size is 2 MB.' },
        { status: 413 }
      )
    }
  }

  await dbConnect()

  // Persist to MongoDB — null clears the avatar
  await User.findByIdAndUpdate(
    session.user.id,
    { avatarUrl: avatarUrl ?? null },
    { new: true }
  )

  return NextResponse.json({ success: true, avatarUrl: avatarUrl ?? null })
}