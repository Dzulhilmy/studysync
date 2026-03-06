'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import RealTimeClock from '@/components/RealTimeClock'
import DashboardSearch from '@/components/DashboardSearch'
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
        {/* Icon box */}
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
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({ users: 0, teachers: 0, students: 0, subjects: 0, projects: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [uRes, sRes, pRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/subjects'),
          fetch('/api/admin/projects'),
        ])
        const users    = await uRes.json()
        const subjects = await sRes.json()
        const projects = await pRes.json()
        setStats({
          users:    users.length,
          teachers: users.filter((u: any) => u.role === 'teacher').length,
          students: users.filter((u: any) => u.role === 'student').length,
          subjects: subjects.length,
          projects: projects.length,
          pending:  projects.filter((p: any) => p.status === 'pending').length,
        })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const statCards = [
    { Icon: IconUsers,    label: 'Total Users',      value: stats.users,    sub: 'all roles', iconColor: '#1a7a6e', color: 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]' },
    { Icon: IconTeacher,  label: 'Teachers',         value: stats.teachers, sub: 'active',   iconColor: '#8b5a2b', color: 'text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]' },
    { Icon: IconStudents, label: 'Students',         value: stats.students, sub: 'enrolled', iconColor: '#d4a843', color: 'text-[#d4a843] border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.08)]' },
    { Icon: IconSubjects, label: 'Subjects',         value: stats.subjects, sub: 'active',   iconColor: '#1a7a6e', color: 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]' },
    { Icon: IconProjects, label: 'Projects',         value: stats.projects, sub: 'total',    iconColor: '#8b5a2b', color: 'text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]' },
    { Icon: IconPending,  label: 'Pending Approval', value: stats.pending,  sub: 'review',   iconColor: '#c0392b', color: 'text-[#c0392b] border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.06)]' },
  ]

  const quickActions = [
    { href: '/admin/users',    Icon: IconAdd,      label: 'Add User' },
    { href: '/admin/subjects', Icon: IconOpenBook, label: 'New Subject' },
    { href: '/admin/projects', Icon: IconApproved, label: 'Review Projects' },
    { href: '/admin/students', Icon: IconAssign,   label: 'Assign Students' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        
        <h1 className="text-3xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
          Welcome back, {session?.user?.name?.split(' ')[1]}
          <span className="ml-2 inline-flex items-center">
            {/* Waving hand SVG */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <text x="0" y="26" fontSize="26">👋</text>
            </svg>
          </span>
        </h1>
        <p className="text-[#7a6a52] text-sm mt-1">Here's what's happening in StudySync today.</p>
        <RealTimeClock accentColor="#d4a843" />
        <DashboardSearch role="admin" />
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading statistics...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white border border-[#c8b89a] rounded-sm p-6 shadow-[3px_3px_0_#c8b89a]">
        <h2 className="font-bold text-[#1a1209] mb-4 text-lg" style={{ fontFamily: 'Georgia, serif' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ href, Icon, label }) => (
            <a key={href} href={href}
              className="flex flex-col items-center gap-2.5 p-4 border border-[#c8b89a] rounded-sm hover:bg-[#faf6ee] hover:border-[#d4a843] transition-all group text-center">
              <div className="w-10 h-10 rounded-sm bg-[rgba(212,168,67,0.08)] group-hover:bg-[rgba(212,168,67,0.15)] flex items-center justify-center transition-colors">
                <Icon size={22} color="#d4a843" />
              </div>
              <span className="text-xs font-semibold text-[#7a6a52] group-hover:text-[#1a1209]">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}