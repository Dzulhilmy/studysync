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

  // Fetch the current student (need their class field)
  const me = await User.findById(session.user.id).select('class').lean() as { class?: string | null } | null
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const myClass = me.class ?? null

  // Find all subjects this student is enrolled in
  const subjects = await Subject.find({ students: session.user.id })
    .populate('teacher', 'name')
    .lean() as any[]

  const result = []

  for (const subject of subjects) {
    // Get ALL enrolled students for this subject
    const allStudentIds: string[] = (subject.students ?? []).map((id: any) => id.toString())

    // [NEW] Filter to only students in the same class as the current student.
    // If the student has no class assigned yet, fall back to showing all enrolled students.
    let classmateIds = allStudentIds
    if (myClass) {
      const classmateUsers = await User.find({
        _id: { $in: allStudentIds },
        class: myClass,
      }).select('_id').lean() as { _id: any }[]

      classmateIds = classmateUsers.map((u) => u._id.toString())
    }

    // Fetch full user records for the filtered classmates
    const students = await User.find({ _id: { $in: classmateIds } })
      .select('name avatarUrl class')
      .lean() as { _id: any; name: string; avatarUrl?: string | null; class?: string | null }[]

    // Fetch approved projects for this subject
    const projects = await Project.find({
      subject: subject._id,
      status: 'approved',
    }).select('_id').lean() as { _id: any }[]

    const totalProjects = projects.length
    const projectIds = projects.map((p) => p._id)

    // Build progress for each classmate
    const classmates = await Promise.all(
      students.map(async (student) => {
        const submissions = await Submission.find({
          student: student._id,
          project: { $in: projectIds },
          status: { $in: ['submitted', 'graded'] },
        }).select('_id').lean()

        const submitted    = submissions.length
        const progressPct  = totalProjects > 0 ? Math.round((submitted / totalProjects) * 100) : 0

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

    // Sort: current student first, then by progress descending
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
      // [NEW] expose the class name so the frontend can display it in the info bar
      className:     myClass ?? null,
      classmates,
      totalProjects,
    })
  }

  return NextResponse.json(result)
}