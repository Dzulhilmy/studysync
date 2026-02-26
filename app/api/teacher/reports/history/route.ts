/**
 * FILE: app/api/teacher/reports/history/route.ts
 * Returns the teacher's own submitted reports for the sidebar history list.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Report from '@/models/Report'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const reports = await Report.find({
    teacher: (session.user as any).id,
    status: 'submitted',
  })
    .select('month year submittedAt')
    .sort({ year: -1, month: -1 })
  return NextResponse.json(reports)
}