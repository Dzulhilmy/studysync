'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock'
import DashboardSearch from '@/components/DashboardSearch'
import Avatar from '@/components/Avatar'
import {
  IconSubjects, IconSubmitted, IconApproved, IconDraft,
  IconWarning, IconEmpty,
} from '@/components/NavIcons'
import { getDaysLeft } from '@/lib/dateUtils'
import { JSX } from 'react/jsx-runtime'

interface Submission {
  _id: string; status: string; isLate: boolean; grade?: number
  project: {
    _id: string; title: string; deadline: string
    subject: { name: string; code: string }
  }
}

type IconComponent = (props: { color?: string; size?: number }) => JSX.Element

const STATUS_MAP: Record<string, { Icon: IconComponent; label: string; color: string; iconColor: string }> = {
  draft:     { Icon: IconDraft,     label: 'Draft',     color: 'text-[#8b5a2b] bg-[rgba(139,90,43,0.08)] border-[rgba(139,90,43,0.25)]',   iconColor: '#8b5a2b' },
  submitted: { Icon: IconSubmitted, label: 'Submitted', color: 'text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]', iconColor: '#1a7a6e' },
  graded:    { Icon: IconApproved,  label: 'Graded',    color: 'text-[#d4a843] bg-[rgba(212,168,67,0.08)] border-[rgba(212,168,67,0.3)]',  iconColor: '#d4a843' },
}

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [subjectCount, setSubjectCount] = useState(0)
  const [loading,      setLoading]      = useState(true)

  const avatarUrl = (session?.user as any)?.avatarUrl ?? null

  // ── Only fetch once the session is authenticated ──────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [subRes, submiRes] = await Promise.all([
          fetch('/api/student/subjects'),
          fetch('/api/student/submissions'),
        ])

        if (!subRes.ok || !submiRes.ok) return

        const subjectsRaw = await subRes.json()
        const subsRaw     = await submiRes.json()

        if (cancelled) return

        // /api/student/subjects returns an array of subject groups
        setSubjectCount((Array.isArray(subjectsRaw) ? subjectsRaw : []).length)
        setSubmissions(Array.isArray(subsRaw) ? subsRaw : [])
      } catch (e) {
        console.error('[student/dashboard]', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [status]) // re-run if auth status changes

  const submitted = submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length
  const graded    = submissions.filter((s) => s.status === 'graded').length
  const drafts    = submissions.filter((s) => s.status === 'draft').length

  const warnings = submissions.filter((s) => {
    if (s.status === 'submitted' || s.status === 'graded') return false
    if (!s.project?.deadline) return false
    const daysLeft = Math.ceil((new Date(s.project.deadline).getTime() - Date.now()) / 86400000)
    return daysLeft <= 5
  })

  const statCards = [
    { Icon: IconSubjects,  label: 'Subjects',  value: subjectCount, href: '/student/subjects', iconColor: '#63b3ed', color: 'text-[#63b3ed] border-[rgba(99,179,237,0.3)] bg-[rgba(99,179,237,0.06)]'  },
    { Icon: IconSubmitted, label: 'Submitted', value: submitted,    href: '/student/projects', iconColor: '#1a7a6e', color: 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]' },
    { Icon: IconApproved,  label: 'Graded',    value: graded,       href: '/student/projects', iconColor: '#d4a843', color: 'text-[#d4a843] border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.08)]'  },
    { Icon: IconDraft,     label: 'Drafts',    value: drafts,       href: '/student/projects', iconColor: '#8b5a2b', color: 'text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]'    },
  ]

  // Show skeleton while session is resolving
  const isResolving = status === 'loading' || (status === 'authenticated' && loading)

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/student/profile" title="Edit profile">
            <Avatar
              src={avatarUrl}
              name={session?.user?.name}
              role="student"
              size={52}
              className="hover:scale-105 transition-transform"
            />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome back, {session?.user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-[#7a6a52] text-sm mt-1">Here's your learning activity at a glance.</p>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-3">
          <RealTimeClock accentColor="#63b3ed" />
          <DashboardSearch role="student" />
        </div>
      </div>

      {/* Deadline warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {warnings.map((s) => {
            const statusInfo = getDaysLeft(s.project.deadline)
            return (
              <div key={s._id} className="flex items-start gap-3 bg-[rgba(212,168,67,0.08)] border rounded-sm px-4 py-3" style={{ borderColor: statusInfo.color }}>
                <div className="mt-0.5 flex-shrink-0">
                  <IconWarning size={20} color={statusInfo.color} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#1a1209]">{s.project.title}</span>
                  <span className="text-sm text-[#7a6a52]"> is </span>
                  <span className="text-sm font-bold" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                  <span className="text-sm text-[#7a6a52]"> and you haven't submitted yet!</span>
                  <Link href="/student/projects" className="ml-2 text-xs text-[#63b3ed] hover:underline font-semibold">
                    Submit now →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats grid */}
      {isResolving ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] animate-pulse">
              <div className="w-10 h-10 rounded-sm bg-[#f0e9d6] mb-3" />
              <div className="h-8 w-10 bg-[#f0e9d6] rounded mb-1" />
              <div className="h-3 w-20 bg-[#f0e9d6] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ Icon, label, value, href, iconColor, color }) => (
            <Link key={label} href={href}
              className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[5px_5px_0_#c8b89a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: iconColor + '18' }}>
                  <Icon size={22} color={iconColor} />
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${color}`}>view</span>
              </div>
              <div className="text-3xl font-bold text-[#1a1209] mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>{value}</div>
              <div className="text-xs text-[#7a6a52] font-semibold uppercase tracking-wider">{label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent submissions */}
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a]">
        <div className="px-5 py-3 border-b border-[#f0e9d6] flex items-center justify-between">
          <h2 className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Recent Submissions</h2>
          <Link href="/student/projects" className="text-xs text-[#63b3ed] hover:underline">View all →</Link>
        </div>

        {isResolving ? (
          <div className="divide-y divide-[#f0e9d6]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 animate-pulse">
                <div>
                  <div className="h-4 w-48 bg-[#f0e9d6] rounded mb-1.5" />
                  <div className="h-3 w-24 bg-[#f0e9d6] rounded" />
                </div>
                <div className="h-6 w-20 bg-[#f0e9d6] rounded-sm" />
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="flex justify-center mb-3">
              <IconEmpty size={40} color="#c8b89a" />
            </div>
            <p className="text-[#7a6a52] text-sm">No submissions yet. Check your subjects!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0e9d6]">
            {submissions.slice(0, 5).map((s) => {
              const st = STATUS_MAP[s.status] ?? STATUS_MAP.submitted
              return (
                <div key={s._id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#faf6ee] transition-colors">
                  <div>
                    <div className="text-sm font-semibold text-[#1a1209]">{s.project?.title}</div>
                    <div className="text-xs text-[#7a6a52] font-mono">
                      {s.project?.subject?.code} &middot;{' '}
                      {s.project?.deadline ? `Due ${new Date(s.project.deadline).toLocaleDateString('en-MY')}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.status === 'graded' && s.grade !== undefined && (
                      <span className="text-sm font-bold text-[#1a1209]">{s.grade}pts</span>
                    )}
                    <span className={`flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 border rounded-sm ${st.color}`}>
                      <st.Icon size={12} color={st.iconColor} />
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}