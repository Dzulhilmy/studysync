/**
 * FILE: app/api/auth/avatar/route.ts
 *
 * Handles avatar upload using UploadThing (same as your existing setup).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import User                          from '@/models/User'
import { UTApi }                     from 'uploadthing/server'

const utapi = new UTApi()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate type + size (max 2 MB)
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 2 MB.' }, { status: 400 })
  }

  // Upload to UploadThing
  const response = await utapi.uploadFiles(file)

  if (response.error) {
    console.error('[AVATAR] UploadThing error:', response.error)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  const avatarUrl = response.data.url

  // Delete old avatar from UploadThing storage if one exists
  const user = await User.findById((session.user as any).id)
  if (user?.avatarUrl) {
    try {
      // UploadThing URLs look like: https://utfs.io/f/FILE_KEY
      const oldKey = user.avatarUrl.split('/').pop()
      if (oldKey) await utapi.deleteFiles(oldKey)
    } catch {
      // Non-critical — don't block the upload if delete fails
    }
  }

  // Save new avatar URL to user document
  await User.findByIdAndUpdate((session.user as any).id, { avatarUrl })

  return NextResponse.json({ avatarUrl })
}

// DELETE — remove avatar and revert to initials/icon fallback
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const user = await User.findById((session.user as any).id)

  // Delete file from UploadThing storage
  if (user?.avatarUrl) {
    try {
      const fileKey = user.avatarUrl.split('/').pop()
      if (fileKey) await utapi.deleteFiles(fileKey)
    } catch {
      // Non-critical
    }
  }

  await User.findByIdAndUpdate((session.user as any).id, { avatarUrl: null })
  return NextResponse.json({ success: true })
}