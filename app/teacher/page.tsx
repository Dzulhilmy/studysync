'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock'
import DashboardSearch from '@/components/DashboardSearch'
import Avatar from '@/components/Avatar'
import {
  IconSubjects, IconProjects, IconPending, IconApproved,
  IconRejected, IconAnnouncements, IconWarning,
  IconAdd, IconOpenBook, IconProgress,
} from '@/components/NavIcons'
import { JSX } from 'react/jsx-runtime'

interface Stats {
  subjects: number; projects: number; pending: number
  approved: number; rejected: number; announcements: number
}

type IconComponent = (props: { color?: string; size?: number }) => JSX.Element

function StatCard({
  Icon, label, value, color, iconColor, href,
}: {
  Icon: IconComponent; label: string; value: number
  color: string; iconColor: string; href: string
}) {
  return (
    <Link href={href}
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
  )
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const [stats,         setStats]         = useState<Stats>({ subjects: 0, projects: 0, pending: 0, approved: 0, rejected: 0, announcements: 0 })
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)

  const avatarUrl = (session?.user as any)?.avatarUrl ?? null

  // ── Only fetch once the session is authenticated ──────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [sRes, pRes, aRes] = await Promise.all([
          fetch('/api/teacher/subjects'),
          fetch('/api/teacher/projects'),
          fetch('/api/teacher/announcements'),
        ])

        if (!sRes.ok || !pRes.ok || !aRes.ok) return

        const subjectsRaw      = await sRes.json()
        const projectsRaw      = await pRes.json()
        const announcementsRaw = await aRes.json()

        if (cancelled) return

        const subjects      = Array.isArray(subjectsRaw)      ? subjectsRaw      : []
        const projects      = Array.isArray(projectsRaw)      ? projectsRaw      : []
        const announcements = Array.isArray(announcementsRaw) ? announcementsRaw : []

        setStats({
          subjects:      subjects.length,
          projects:      projects.length,
          pending:       projects.filter((p: any) => p.status === 'pending').length,
          approved:      projects.filter((p: any) => p.status === 'approved').length,
          rejected:      projects.filter((p: any) => p.status === 'rejected').length,
          announcements: announcements.length,
        })
        setNotifications(projects.filter((p: any) => p.warnUnsubmitted))
      } catch (e) {
        console.error('[teacher/dashboard]', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [status])

  const isResolving = status === 'loading' || (status === 'authenticated' && loading)

  const statCards = [
    { Icon: IconSubjects,      label: 'My Subjects',      value: stats.subjects,      href: '/teacher/subjects',      iconColor: '#1a7a6e', color: 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]'   },
    { Icon: IconProjects,      label: 'Total Projects',   value: stats.projects,      href: '/teacher/projects',      iconColor: '#8b5a2b', color: 'text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]'     },
    { Icon: IconPending,       label: 'Pending Approval', value: stats.pending,       href: '/teacher/projects',      iconColor: '#d4a843', color: 'text-[#d4a843] border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.08)]'   },
    { Icon: IconApproved,      label: 'Approved',         value: stats.approved,      href: '/teacher/projects',      iconColor: '#1a7a6e', color: 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]'   },
    { Icon: IconRejected,      label: 'Rejected',         value: stats.rejected,      href: '/teacher/projects',      iconColor: '#c0392b', color: 'text-[#c0392b] border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.06)]'     },
    { Icon: IconAnnouncements, label: 'Announcements',    value: stats.announcements, href: '/teacher/announcements', iconColor: '#8b5a2b', color: 'text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]'     },
  ]

  const quickActions = [
    { href: '/teacher/projects',      Icon: IconAdd,           label: 'New Project'   },
    { href: '/teacher/subjects',      Icon: IconOpenBook,      label: 'Add Material'  },
    { href: '/teacher/announcements', Icon: IconAnnouncements, label: 'Announce'      },
    { href: '/teacher/students',      Icon: IconProgress,      label: 'View Progress' },
  ]

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/teacher/profile" title="Edit profile">
            <Avatar
              src={avatarUrl}
              name={session?.user?.name}
              role="teacher"
              size={52}
              className="hover:scale-105 transition-transform"
            />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome, {session?.user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-[#7a6a52] text-sm mt-1">Here's an overview of your teaching activity.</p>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-3">
          <RealTimeClock accentColor="#1a7a6e" />
          <DashboardSearch role="teacher" />
        </div>
      </div>

      {/* Deadline notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map((p: any) => (
            <div key={p._id} className="flex items-start gap-3 bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.35)] rounded-sm px-4 py-3">
              <div className="mt-0.5 flex-shrink-0">
                <IconWarning size={20} color="#d4a843" />
              </div>
              <div>
                <span className="text-sm font-semibold text-[#8b5a2b]">{p.title}</span>
                <span className="text-sm text-[#7a6a52]"> — {p.unsubmitted} student{p.unsubmitted !== 1 ? 's' : ''} haven't submitted with </span>
                <span className="text-sm font-bold text-[#c0392b]">{p.daysLeft} day{p.daysLeft !== 1 ? 's' : ''} left</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {isResolving ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] animate-pulse">
              <div className="w-10 h-10 rounded-sm bg-[#f0e9d6] mb-3" />
              <div className="h-8 w-10 bg-[#f0e9d6] rounded mb-1" />
              <div className="h-3 w-24 bg-[#f0e9d6] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white border border-[#c8b89a] rounded-sm p-6 shadow-[3px_3px_0_#c8b89a]">
        <h2 className="font-bold text-[#1a1209] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ href, Icon, label }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-2.5 p-4 border border-[#c8b89a] rounded-sm hover:bg-[#faf6ee] hover:border-[#1a7a6e] transition-all group text-center">
              <div className="w-10 h-10 rounded-sm bg-[rgba(26,122,110,0.08)] group-hover:bg-[rgba(26,122,110,0.15)] flex items-center justify-center transition-colors">
                <Icon size={22} color="#1a7a6e" />
              </div>
              <span className="text-xs font-semibold text-[#7a6a52] group-hover:text-[#1a1209]">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}