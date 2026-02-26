/**
 * FILE: app/api/admin/reports/route.ts
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Report from '@/models/Report'

// GET /api/admin/reports            → all submitted reports
// GET /api/admin/reports?id=xxx     → single report detail
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const report = await Report.findById(id).populate('teacher', 'name email')
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(report)
  }

  const reports = await Report.find({ status: 'submitted' })
    .populate('teacher', 'name email')
    .sort({ submittedAt: -1 })
  return NextResponse.json(reports)
}