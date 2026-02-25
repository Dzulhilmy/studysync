import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Material from '@/models/Material'
import Subject from '@/models/Subject'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const subjectId = req.nextUrl.searchParams.get('subject')
  const query: any = { uploadedBy: (session.user as any).id }
  if (subjectId) query.subject = subjectId
  const materials = await Material.find(query).populate('subject', 'name code').sort({ createdAt: -1 })
  return NextResponse.json(materials)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { title, type, url, linkUrl, fileUrl, topic, subject } = await req.json()
  if (!title || !url || !subject) {
    return NextResponse.json({ error: 'Title, a URL or file, and subject are required' }, { status: 400 })
  }
  const material = await Material.create({
    title,
    type:    type    || 'link',
    url,                          // primary (fileUrl if uploaded, else linkUrl)
    linkUrl: linkUrl || null,     // external URL
    fileUrl: fileUrl || null,     // Cloudinary file
    topic:   topic   || 'General',
    subject,
    uploadedBy: (session.user as any).id,
  })
  return NextResponse.json(material, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { id } = await req.json()
  await Material.findOneAndDelete({ _id: id, uploadedBy: (session.user as any).id })
  return NextResponse.json({ success: true })
}