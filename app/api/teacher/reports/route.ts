/**
 * FILE: app/api/teacher/reports/route.ts
 *
 * GET  ?month=M&year=Y  → generate (or fetch cached) report data for that month
 * POST               → save/submit the report to admin
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Report from '@/models/Report'
import Project from '@/models/Project'
import Subject from '@/models/Subject'
import Submission from '@/models/Submission'
import { createNotification } from '@/lib/notifications'
import User from '@/models/User'

// ── GET: generate report data for a given month/year ──────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const teacherId = (session.user as any).id
  const params    = req.nextUrl.searchParams
  const month     = parseInt(params.get('month') ?? String(new Date().getMonth() + 1))
  const year      = parseInt(params.get('year')  ?? String(new Date().getFullYear()))

  // Date range for the selected month
  const from = new Date(year, month - 1, 1)
  const to   = new Date(year, month,     1)   // exclusive

  // Check if a submitted report already exists
  const existing = await Report.findOne({ teacher: teacherId, month, year })
  if (existing) return NextResponse.json(existing)

  // ── Fetch all subjects assigned to this teacher ──
  const subjects = await Subject.find({ teacher: teacherId })
    .populate('students', 'name email')

  // ── Fetch all approved projects this teacher created (within the month) ──
  const allProjects = await Project.find({
    createdBy: teacherId,
    status: 'approved',
  }).populate('subject', 'name code')

  // ── Build per-subject breakdown ──
  let totalSubmissions  = 0
  let gradedSubmissions = 0
  let lateSubmissions   = 0
  let gradeSum          = 0
  let gradeCount        = 0

  const subjectData = await Promise.all(subjects.map(async (subj) => {
    const subjProjects = allProjects.filter(
      p => p.subject && (p.subject as any)._id?.toString() === subj._id.toString()
    )

    const projectData = await Promise.all(subjProjects.map(async (proj) => {
      const submissions = await Submission.find({ project: proj._id })
      const graded  = submissions.filter(s => s.status === 'graded')
      const late    = submissions.filter(s => s.isLate)
      const grades  = graded.map(s => s.grade ?? 0)
      const avg     = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null
      const highest = grades.length ? Math.max(...grades) : null
      const lowest  = grades.length ? Math.min(...grades) : null

      totalSubmissions  += submissions.filter(s => s.status !== 'pending').length
      gradedSubmissions += graded.length
      lateSubmissions   += late.length
      if (avg !== null) { gradeSum += avg; gradeCount++ }

      return {
        projectId:     proj._id.toString(),
        title:         proj.title,
        deadline:      proj.deadline.toISOString(),
        maxScore:      proj.maxScore,
        status:        proj.status,
        totalStudents: subj.students.length,
        submitted:     submissions.filter(s => s.status !== 'pending').length,
        graded:        graded.length,
        late:          late.length,
        avgGrade:      avg,
        highestGrade:  highest,
        lowestGrade:   lowest,
      }
    }))

    return {
      subjectId:    subj._id.toString(),
      name:         subj.name,
      code:         subj.code,
      studentCount: subj.students.length,
      projects:     projectData,
    }
  }))

  const teacher = await User.findById(teacherId)

  const reportData = {
    teacher:      teacherId,
    month,
    year,
    status:       'draft',
    teacherName:  teacher?.name  ?? '',
    teacherEmail: teacher?.email ?? '',
    summary: {
      totalSubjects:    subjects.length,
      totalStudents:    subjects.reduce((a, s) => a + s.students.length, 0),
      totalProjects:    allProjects.length,
      approvedProjects: allProjects.length,
      totalSubmissions,
      gradedSubmissions,
      lateSubmissions,
      avgGrade: gradeCount > 0 ? Math.round(gradeSum / gradeCount) : null,
    },
    subjects: subjectData,
    remarks: '',
  }

  return NextResponse.json(reportData)
}

// ── POST: save or submit a report ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const teacherId = (session.user as any).id
  const body      = await req.json()
  const { month, year, status, remarks, summary, subjects,
          teacherName, teacherEmail } = body

  // Upsert — update if exists, create if not
  const report = await Report.findOneAndUpdate(
    { teacher: teacherId, month, year },
    {
      teacher: teacherId, month, year,
      status: status ?? 'draft',
      submittedAt: status === 'submitted' ? new Date() : undefined,
      teacherName, teacherEmail,
      summary, subjects, remarks,
    },
    { upsert: true, new: true }
  )

  // Notify all admins when teacher submits
  if (status === 'submitted') {
    const admins = await User.find({ role: 'admin', isActive: true }, '_id')
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec']
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id.toString(),
        type:      'announcement_posted' as any,
        title:     '📊 Monthly Report Submitted',
        message:   `${teacherName} submitted their ${MONTHS[month - 1]} ${year} monthly report.`,
        link:      '/admin/reports',
      })
    }
  }

  return NextResponse.json(report, { status: 201 })
}