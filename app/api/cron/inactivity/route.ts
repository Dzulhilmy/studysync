/**
 * FILE: app/api/cron/inactivity/route.ts
 *
 * This route is called automatically every 3 days by Vercel Cron
 * (or any external cron service like cron-job.org).
 *
 * SETUP — add this to vercel.json at the root of your project:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/inactivity",
 *       "schedule": "0 8 * * *"
 *     }
 *   ]
 * }
 *
 * The route checks every student:
 *   - If lastLoginAt was 3, 6, 9... days ago (every 3-day interval)
 *   - AND they have at least one unsubmitted project
 *   → Send them a reminder email
 *
 * Add CRON_SECRET=any-long-random-string to your .env.local
 * and vercel environment variables for security.
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDB                      from '@/lib/db'
import User                           from '@/models/User'
import Project                        from '@/models/Project'
import Submission                     from '@/models/Submission'
import Subject                        from '@/models/Subject'
import { sendInactivityReminder }     from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // ── Security: only allow calls with the correct secret ─────────────────────
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const now          = new Date()
  const results      = { checked: 0, emailed: 0, skipped: 0, errors: 0 }

  // 1. Get all students who have a lastLoginAt field
  const students = await User.find({
    role:         'student',
    lastLoginAt:  { $exists: true, $ne: null },
  }).lean() as any[]

  for (const student of students) {
    results.checked++

    try {
      // 2. Calculate days since last login
      const lastLogin     = new Date(student.lastLoginAt)
      const msSince       = now.getTime() - lastLogin.getTime()
      const daysSince     = Math.floor(msSince / (1000 * 60 * 60 * 24))

      // Only trigger on 3-day intervals (3, 6, 9, 12...)
      if (daysSince < 3 || daysSince % 3 !== 0) {
        results.skipped++
        continue
      }

      // 3. Find all approved projects for subjects this student is enrolled in
      const enrolledSubjects = await Subject.find({
        // ⚠️  Change 'students' to your Subject field if different
        students: student._id,
      }).lean() as any[]

      if (enrolledSubjects.length === 0) {
        results.skipped++
        continue
      }

      const subjectIds = enrolledSubjects.map((s: any) => s._id)

      const approvedProjects = await Project.find({
        subject:  { $in: subjectIds },
        status:   'approved',
        deadline: { $gte: now },   // only future/active deadlines
      }).populate('subject', 'name code').lean() as any[]

      if (approvedProjects.length === 0) {
        results.skipped++
        continue
      }

      // 4. Find which ones the student has NOT submitted
      const studentSubmissions = await Submission.find({
        student: student._id,
        project: { $in: approvedProjects.map((p: any) => p._id) },
        status:  { $in: ['submitted', 'graded'] },
      }).lean() as any[]

      const submittedProjectIds = new Set(
        studentSubmissions.map((s: any) => s.project.toString())
      )

      const pendingProjects = approvedProjects.filter(
        (p: any) => !submittedProjectIds.has(p._id.toString())
      )

      if (pendingProjects.length === 0) {
        results.skipped++
        continue
      }

      // 5. Send the reminder email
      await sendInactivityReminder(student.email, {
        studentName:    student.name,
        daysSinceLogin: daysSince,
        pendingCount:   pendingProjects.length,
        pendingProjects: pendingProjects.map((p: any) => ({
          title:       p.title,
          subjectCode: p.subject?.code ?? '—',
          deadline:    p.deadline instanceof Date
            ? p.deadline.toISOString()
            : String(p.deadline),
        })),
      })

      results.emailed++
      console.log(`[CRON] Inactivity reminder sent → ${student.email} (${daysSince}d inactive, ${pendingProjects.length} pending)`)

    } catch (err) {
      results.errors++
      console.error(`[CRON] Failed for student ${student.email}:`, err)
    }
  }

  console.log('[CRON] Inactivity check complete:', results)
  return NextResponse.json({ success: true, ...results })
}