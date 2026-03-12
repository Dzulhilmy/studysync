/**
 * FILE: app/api/student/subjects/route.ts
 */

import { NextResponse }    from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }     from '@/lib/auth'
import connectDB           from '@/lib/db'
import Subject             from '@/models/Subject'
import Project             from '@/models/Project'
import Material            from '@/models/Material'
import Submission          from '@/models/Submission'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const studentId = (session.user as any).id

  const subjects = await Subject.find({ students: studentId })
    .populate('teacher', 'name email')
    .sort({ createdAt: -1 })

  const enriched = await Promise.all(
    subjects.map(async (subject) => {
      const projects  = await Project.find({ subject: subject._id, status: 'approved' }).sort({ deadline: 1 })
      const materials = await Material.find({ subject: subject._id }).sort({ createdAt: -1 })

      const projectsWithStatus = await Promise.all(
        projects.map(async (project) => {
          const submission = await Submission.findOne({
            project: project._id,
            student: studentId,
          }).lean() as any

          return {
            ...project.toObject(),
            submission: submission ? {
              _id:          submission._id,
              status:       submission.status,
              fileUrl:      submission.fileUrl      ?? '',
              textResponse: submission.textResponse ?? '',
              isLate:       submission.isLate       ?? false,
              submittedAt:  submission.submittedAt  ?? null,
              // Grade and feedback — always surface feedback so student can see
              // teacher's comments; grade only when gradeVisible = true
              grade:        submission.gradeVisible ? (submission.grade ?? null) : null,
              feedback:     submission.feedback     ?? '',
              gradeVisible: submission.gradeVisible ?? false,
              // ── Versioning ────────────────────────────────────────────────
              currentVersion: submission.currentVersion ?? 1,
              versions: (submission.versions ?? []).map((v: any) => ({
                version:      v.version,
                fileUrl:      v.fileUrl      ?? '',
                textResponse: v.textResponse ?? '',
                submittedAt:  v.submittedAt  ?? null,
                isLate:       v.isLate       ?? false,
                // Students don't see grades per version unless gradeVisible
                grade:        submission.gradeVisible ? (v.grade ?? null) : null,
                feedback:     v.feedback ?? '',
                status:       v.status   ?? 'submitted',
              })),
              // ── Redo ──────────────────────────────────────────────────────
              redoRequested: submission.redoRequested ?? false,
              redoReason:    submission.redoReason    ?? '',
              // ── Messages ──────────────────────────────────────────────────
              messages: (submission.messages ?? []).map((m: any) => ({
                _id:        m._id,
                senderName: m.senderName,
                senderRole: m.senderRole,
                content:    m.content,
                createdAt:  m.createdAt,
              })),
            } : null,
          }
        })
      )

      return {
        ...subject.toObject(),
        projects: projectsWithStatus,
        materials,
      }
    })
  )

  return NextResponse.json(enriched)
}