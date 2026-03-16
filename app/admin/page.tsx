'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock'
import DashboardSearch from '@/components/DashboardSearch'
import Avatar from '@/components/Avatar'
import {
  IconUsers, IconTeacher, IconStudents, IconSubjects,
  IconProjects, IconPending, IconAdd, IconOpenBook,
  IconApproved, IconAssign,
} from '@/components/NavIcons'
import { JSX } from 'react/jsx-runtime'

interface Stats {
  users: number; teachers: number; students: number
  subjects: number; projects: number; pending: number
}

type IconComponent = (props: { color?: string; size?: number }) => JSX.Element

function StatCard({
  Icon, label, value, sub, color, iconColor,
}: {
  Icon: IconComponent; label: string; value: number
  sub?: string; color: string; iconColor: string
}) {
  return (
    <div className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[5px_5px_0_#c8b89a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: iconColor + '18' }}>
          <Icon size={22} color={iconColor} />
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${color}`}>{sub ?? 'total'}</span>
      </div>
      <div className="text-3xl font-bold text-[#1a1209] mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>{value}</div>
      <div className="text-xs text-[#7a6a52] font-semibold uppercase tracking-wider">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [stats,   setStats]   = useState<Stats>({ users: 0, teachers: 0, students: 0, subjects: 0, projects: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  const avatarUrl = (session?.user as any)?.avatarUrl ?? null

  // ── Only fetch once the session is authenticated ──────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [uRes, sRes, pRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/subjects'),
          fetch('/api/admin/projects'),
        ])

        if (!uRes.ok || !sRes.ok || !pRes.ok) return

        const users    = await uRes.json()
        const subjects = await sRes.json()
        const projects = await pRes.json()

        if (cancelled) return

        const usersArr    = Array.isArray(users)    ? users    : []
        const subjectsArr = Array.isArray(subjects) ? subjects : []
        const projectsArr = Array.isArray(projects) ? projects : []

        setStats({
          users:    usersArr.length,
          teachers: usersArr.filter((u: any) => u.role === 'teacher').length,
          students: usersArr.filter((u: any) => u.role === 'student').length,
          subjects: subjectsArr.length,
          projects: projectsArr.length,
          pending:  projectsArr.filter((p: any) => p.status === 'pending').length,
        })
      } catch (e) {
        console.error('[admin/dashboard]', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [status])

  const isResolving = status === 'loading' || (status === 'authenticated' && loading)

  const statCards = [
    { Icon: IconUsers,    label: 'Total Users',      value: stats.users,    sub: 'all roles', iconColor: '#1a7a6e', color: 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]' },
    { Icon: IconTeacher,  label: 'Teachers',         value: stats.teachers, sub: 'active',   iconColor: '#8b5a2b', color: 'text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]' },
    { Icon: IconStudents, label: 'Students',         value: stats.students, sub: 'enrolled', iconColor: '#d4a843', color: 'text-[#d4a843] border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.08)]' },
    { Icon: IconSubjects, label: 'Subjects',         value: stats.subjects, sub: 'active',   iconColor: '#1a7a6e', color: 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]' },
    { Icon: IconProjects, label: 'Projects',         value: stats.projects, sub: 'total',    iconColor: '#8b5a2b', color: 'text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]' },
    { Icon: IconPending,  label: 'Pending Approval', value: stats.pending,  sub: 'review',   iconColor: '#c0392b', color: 'text-[#c0392b] border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.06)]' },
  ]

  const quickActions = [
    { href: '/admin/users',    Icon: IconAdd,      label: 'Add User'        },
    { href: '/admin/subjects', Icon: IconOpenBook, label: 'New Subject'     },
    { href: '/admin/projects', Icon: IconApproved, label: 'Review Projects' },
    { href: '/admin/students', Icon: IconAssign,   label: 'Assign Students' },
  ]

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/admin/profile" title="Edit profile">
            <Avatar
              src={avatarUrl}
              name={session?.user?.name}
              role="admin"
              size={52}
              className="hover:scale-105 transition-transform"
            />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome back, {session?.user?.name?.split(' ')[1]} 👋
            </h1>
            <p className="text-[#7a6a52] text-sm mt-1">Here's what's happening in StudySync today.</p>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-3">
          <RealTimeClock accentColor="#d4a843" />
          <DashboardSearch role="admin" />
        </div>
      </div>

      {/* Mobile clock + search */}
      <div className="flex flex-col gap-2 mb-6 lg:hidden">
        <RealTimeClock accentColor="#d4a843" />
        <DashboardSearch role="admin" />
      </div>

      {/* Stats grid */}
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
        <h2 className="font-bold text-[#1a1209] mb-4 text-lg" style={{ fontFamily: 'Georgia, serif' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ href, Icon, label }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-2.5 p-4 border border-[#c8b89a] rounded-sm hover:bg-[#faf6ee] hover:border-[#d4a843] transition-all group text-center">
              <div className="w-10 h-10 rounded-sm bg-[rgba(212,168,67,0.08)] group-hover:bg-[rgba(212,168,67,0.15)] flex items-center justify-center transition-colors">
                <Icon size={22} color="#d4a843" />
              </div>
              <span className="text-xs font-semibold text-[#7a6a52] group-hover:text-[#1a1209]">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}