import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Subject from '@/models/Subject'
import Submission from '@/models/Submission'
import Project from '@/models/Project'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await dbConnect()

  // Fetch the current student's class
  const me = await User.findById(session.user.id).select('class').lean() as
    { class?: string | null } | null
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const myClass = me.class ?? null

  // ── FALLBACK: student has no class assigned ────────────────────────────────
  // Show every active student on the platform as a single "Schoolmates" group.
  // No subject grouping, no class info — just a flat leaderboard.
  if (!myClass) {
    const allActive = await User.find({
      _id:      { $ne: session.user.id },   // exclude self from list body...
      role:     'student',
      isActive: true,
    }).select('name avatarUrl').lean() as { _id: any; name: string; avatarUrl?: string | null }[]

    // Include self too so "isMe" highlight works
    const meSelf = await User.findById(session.user.id)
      .select('name avatarUrl').lean() as { _id: any; name: string; avatarUrl?: string | null } | null

    const allStudents = [
      ...(meSelf ? [{ ...meSelf, isMe: true }] : []),
      ...allActive.map(s => ({ ...s, isMe: false })),
    ]

    const classmates = allStudents.map(student => ({
      _id:          student._id.toString(),
      name:         student.name,
      avatarUrl:    student.avatarUrl ?? null,
      isMe:         (student as any).isMe ?? false,
      // No project progress for schoolmate view — not per-subject
      submitted:    0,
      totalProjects: 0,
      progressPct:  0,
    }))

    // Sort: self first, then alphabetically
    classmates.sort((a, b) => {
      if (a.isMe) return -1
      if (b.isMe) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json([{
      subject: {
        _id:     'schoolmates',
        name:    'All Schoolmates',
        code:    'ALL',
        teacher: '—',
      },
      className:          null,
      isSchoolmatesFallback: true,   // flag so frontend can adapt UI
      classmates,
      totalProjects:      0,
    }])
  }

  // ── NORMAL: student has a class ────────────────────────────────────────────
  // Show per-subject classmates filtered to the same class.
  const subjects = await Subject.find({ students: session.user.id })
    .populate('teacher', 'name')
    .lean() as any[]

  const result = []

  for (const subject of subjects) {
    const allStudentIds: string[] = (subject.students ?? []).map((id: any) => id.toString())

    // Filter enrolled students to same class
    const classmateUsers = await User.find({
      _id:   { $in: allStudentIds },
      class: myClass,
    }).select('name avatarUrl class').lean() as {
      _id: any; name: string; avatarUrl?: string | null; class?: string | null
    }[]

    // Approved projects for this subject
    const projects = await Project.find({
      subject: subject._id,
      status:  'approved',
    }).select('_id').lean() as { _id: any }[]

    const totalProjects = projects.length
    const projectIds    = projects.map(p => p._id)

    const classmates = await Promise.all(
      classmateUsers.map(async student => {
        const submissions = await Submission.find({
          student: student._id,
          project: { $in: projectIds },
          status:  { $in: ['submitted', 'graded'] },
        }).select('_id').lean()

        const submitted   = submissions.length
        const progressPct = totalProjects > 0
          ? Math.round((submitted / totalProjects) * 100)
          : 0

        return {
          _id:          student._id.toString(),
          name:         student.name,
          avatarUrl:    student.avatarUrl ?? null,
          isMe:         student._id.toString() === session.user.id,
          submitted,
          totalProjects,
          progressPct,
        }
      })
    )

    // Sort: self first, then by progress descending
    classmates.sort((a, b) => {
      if (a.isMe) return -1
      if (b.isMe) return 1
      return b.progressPct - a.progressPct
    })

    result.push({
      subject: {
        _id:     subject._id.toString(),
        name:    subject.name,
        code:    subject.code,
        teacher: subject.teacher?.name ?? '—',
      },
      className:             myClass,
      isSchoolmatesFallback: false,
      classmates,
      totalProjects,
    })
  }

  return NextResponse.json(result)
}