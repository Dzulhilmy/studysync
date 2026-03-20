/**
 * FILE: app/api/admin/reports/route.ts
 *
 * GET  /api/admin/reports          → list all generated reports
 * POST /api/admin/reports/generate → generate a new performance report snapshot
 *
 * On generate: notifies all admins in-app that a new report is ready.
 *
 * The report aggregates:
 *   - Per-subject submission rates
 *   - Per-class average grades
 *   - Number of students below the 85% pass threshold
 *   - Pending (ungraded) submissions count
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import Subject                       from '@/models/Subject'
import Project                       from '@/models/Project'
import Submission                    from '@/models/Submission'
import User                          from '@/models/User'
import { notifyAdmins }              from '@/lib/notifications'

const PASS_THRESHOLD = 0.85

// ── GET: list stored report snapshots ────────────────────────────────────────
// For now returns a fresh snapshot on every GET (extend with a Report model
// if you want persistence / history).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return generateSnapshot()
}

// ── POST /generate: generate + save + notify ─────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const snapshot = await generateSnapshot()
  const data     = await snapshot.json()

  // Notify all admins that the new report is ready
  const generatedBy = (session.user as any).name ?? 'An admin'

  await notifyAdmins({
    type:    'new_report',
    title:   '📊 New Report Available',
    message: `${generatedBy} generated a new performance report. ${data.summary.totalStudents} students · ${data.summary.totalSubmissions} submissions · ${data.summary.belowThreshold} below pass threshold.`,
    link:    '/admin/reports',
  })

  return NextResponse.json(data)
}

// ── Shared aggregation logic ──────────────────────────────────────────────────
async function generateSnapshot(): Promise<NextResponse> {
  await connectDB()

  const subjects = await Subject.find({})
    .populate('teacher', 'name')
    .lean() as any[]

  const subjectStats = await Promise.all(
    subjects.map(async (subj) => {
      const projects = await Project.find({
        subject: subj._id,
        status:  'approved',
      }).select('_id maxScore').lean() as { _id: any; maxScore: number }[]

      const totalProjects = projects.length
      if (totalProjects === 0) return null

      const projectIds = projects.map(p => p._id)

      const submissions = await Submission.find({
        project: { $in: projectIds },
        status:  { $in: ['submitted', 'graded'] },
      }).select('student status grade project').lean() as any[]

      const graded   = submissions.filter(s => s.status === 'graded')
      const pending  = submissions.filter(s => s.status === 'submitted').length

      // Avg grade across graded submissions
      const totalGrade = graded.reduce((sum, s) => sum + (s.grade ?? 0), 0)
      const avgGrade   = graded.length > 0 ? Math.round(totalGrade / graded.length) : null

      // Per-student: count unique submitters
      const uniqueSubmitters = new Set(submissions.map(s => s.student?.toString())).size

      // Students below threshold (graded but failing)
      const projectMaxMap = Object.fromEntries(projects.map(p => [p._id.toString(), p.maxScore]))
      const belowThreshold = graded.filter(s => {
        const max = projectMaxMap[s.project?.toString()] ?? 100
        return max > 0 && (s.grade ?? 0) / max < PASS_THRESHOLD
      }).length

      return {
        subject:         { _id: subj._id, name: subj.name, code: subj.code },
        teacher:         subj.teacher?.name ?? '—',
        totalProjects,
        totalSubmissions: submissions.length,
        gradedCount:      graded.length,
        pendingGrade:     pending,
        uniqueSubmitters,
        avgGrade,
        belowThreshold,
      }
    })
  )

  const stats = subjectStats.filter(Boolean) as NonNullable<(typeof subjectStats)[0]>[]

  // System-wide totals
  const totalStudents    = await User.countDocuments({ role: 'student', isActive: true })
  const totalTeachers    = await User.countDocuments({ role: 'teacher', isActive: true })
  const totalSubmissions = stats.reduce((sum, s) => sum + s.totalSubmissions, 0)
  const totalPending     = stats.reduce((sum, s) => sum + s.pendingGrade,    0)
  const belowThreshold   = stats.reduce((sum, s) => sum + s.belowThreshold,  0)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      totalStudents,
      totalTeachers,
      totalSubjects:    stats.length,
      totalSubmissions,
      pendingGrade:     totalPending,
      belowThreshold,
    },
    subjects: stats,
  })
}