/**
 * FILE: app/api/admin/reports/route.ts
 *
 * WHAT CHANGED:
 * - When returning reports, each project inside subjects[] now gets a
 *   students[] array built from live Submission data.
 * - This avoids any schema migration — nothing in the Report model changes.
 * - All the extra DB work is batched: one Submission query per report, not
 *   one per project.
 *
 * ASSUMPTIONS (rename if your models/fields differ):
 *   Model          → assumed import path
 *   ──────────────────────────────────────────────
 *   Submission     → @/models/Submission
 *   User           → @/models/User
 *   Subject        → @/models/Subject
 *
 *   Submission fields assumed:
 *     .student     ObjectId  ref User
 *     .project     ObjectId  ref Project
 *     .status      string    'draft' | 'submitted' | 'graded'
 *     .isLate      boolean
 *     .submittedAt Date | null
 *     .createdAt   Date      (fallback timestamp)
 *
 *   Subject fields assumed:
 *     .students[]  ObjectId[]  ref User   (enrolled students)
 *     OR
 *     .enrollments[]  ObjectId[]  ref User
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import connectDB                     from '@/lib/db'
import Report                        from '@/models/Report'
import Submission                    from '@/models/Submission'   // ← ADD
import Subject                       from '@/models/Subject'      // ← ADD
import User                          from '@/models/User'         // ← ADD (only if needed for name/email)

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudentRow {
  name:        string
  email:       string
  didSubmit:   boolean
  isLate:      boolean
  submittedAt: string | null
}

// ── Helper: attach students[] to every project in a report ────────────────────

async function enrichReportWithStudents(report: any) {
  // 1. Collect all projectIds mentioned in this report
  const projectIds: string[] = []
  const subjectIds: string[] = []

  for (const subj of report.subjects ?? []) {
    subjectIds.push(subj.subjectId?.toString())
    for (const proj of subj.projects ?? []) {
      projectIds.push(proj.projectId?.toString())
    }
  }

  if (projectIds.length === 0) return report // nothing to enrich

  // 2. Fetch all submissions for these projects in ONE query
  const submissions = await Submission.find({
    project: { $in: projectIds },
  })
    .populate('student', 'name email')   // get name + email from User
    .lean()

  // 3. Fetch enrolled students per subject in ONE query
  //    ⚠️  If your Subject model uses a different field (e.g. "enrollments")
  //        change "students" below to match.
  const subjects = await Subject.find({
    _id: { $in: subjectIds },
  })
    .populate('students', 'name email')  // ← change "students" if needed
    .lean()

  // Build a lookup: subjectId → enrolled student list
  const subjectStudentMap: Record<string, { _id: string; name: string; email: string }[]> = {}
  for (const s of subjects as any[]) {
    subjectStudentMap[s._id.toString()] = s.students ?? s.enrollments ?? []
  }

  // 4. Build a lookup: projectId → submissions[]
  const subMap: Record<string, any[]> = {}
  for (const sub of submissions as any[]) {
    const pid = sub.project?.toString()
    if (!pid) continue
    if (!subMap[pid]) subMap[pid] = []
    subMap[pid].push(sub)
  }

  // 5. Re-build the subjects array with students[] on each project
  const enrichedSubjects = (report.subjects ?? []).map((subj: any) => {
    const enrolledStudents: any[] =
      subjectStudentMap[subj.subjectId?.toString()] ?? []

    const enrichedProjects = (subj.projects ?? []).map((proj: any) => {
      const projSubs: any[] = subMap[proj.projectId?.toString()] ?? []

      const students: StudentRow[] = enrolledStudents.map((student) => {
        const sub = projSubs.find(
          (s) => s.student?._id?.toString() === student._id?.toString()
        )
        return {
          name:        student.name  ?? '—',
          email:       student.email ?? '—',
          didSubmit:   !!sub,
          isLate:      sub ? (sub.isLate ?? false) : false,
          submittedAt: sub
            ? (sub.submittedAt?.toISOString?.() ?? sub.createdAt?.toISOString?.() ?? null)
            : null,
        }
      })

      return { ...proj, students }
    })

    return { ...subj, projects: enrichedProjects }
  })

  // Return a plain object with enriched subjects
  return {
    ...(report.toObject?.() ?? report),
    subjects: enrichedSubjects,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    // Single report
    const report = await Report.findById(id).populate('teacher', 'name email')
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const enriched = await enrichReportWithStudents(report)
    return NextResponse.json(enriched)
  }

  // All submitted reports — enrich each one
  const reports = await Report.find({ status: 'submitted' })
    .populate('teacher', 'name email')
    .sort({ submittedAt: -1 })

  const enriched = await Promise.all(
    reports.map((r) => enrichReportWithStudents(r))
  )

  return NextResponse.json(enriched)
}