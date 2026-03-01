/**
 * FILE: app/api/auth/reset-password/route.ts
 * POST { email, newPassword } → overwrites the user's password
 */
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  await connectDB()
  const { email, newPassword, checkOnly } = await req.json()

  if (!email)
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user)
    return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })

  // Step 1 — just verify the email exists, don't change anything
  if (checkOnly)
    return NextResponse.json({ message: 'Email verified.' })

  // Step 2 — actually reset the password
  if (!newPassword)
    return NextResponse.json({ error: 'New password is required.' }, { status: 400 })

  if (newPassword.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })

  const hashed = await bcrypt.hash(newPassword, 10)
  await User.findByIdAndUpdate(user._id, { password: hashed })

  return NextResponse.json({ message: 'Password updated successfully.' })
}