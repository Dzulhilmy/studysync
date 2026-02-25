'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock';

interface Stats { subjects: number; projects: number; pending: number; approved: number; rejected: number; announcements: number }

function StatCard({ icon, label, value, color, href }: { icon: string; label: string; value: number; color: string; href: string }) {
  return (
    <Link href={href} className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[5px_5px_0_#c8b89a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all block">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${color}`}>view</span>
      </div>
      <div className="text-3xl font-bold text-[#1a1209] mb-0.5" style={{ fontFamily: 'Georgia, serif' }}>{value}</div>
      <div className="text-xs text-[#7a6a52] font-semibold uppercase tracking-wider">{label}</div>
    </Link>
  )
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({ subjects: 0, projects: 0, pending: 0, approved: 0, rejected: 0, announcements: 0 })
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [sRes, pRes, aRes] = await Promise.all([
          fetch('/api/teacher/subjects'),
          fetch('/api/teacher/projects'),
          fetch('/api/teacher/announcements'),
        ])
        const subjectsRaw = await sRes.json()
        const projectsRaw = await pRes.json()
        const announcementsRaw = await aRes.json()

        const subjects      = Array.isArray(subjectsRaw)      ? subjectsRaw      : []
        const projects      = Array.isArray(projectsRaw)      ? projectsRaw      : []
        const announcements = Array.isArray(announcementsRaw) ? announcementsRaw : []

        setStats({
          subjects: subjects.length,
          projects: projects.length,
          pending: projects.filter((p: any) => p.status === 'pending').length,
          approved: projects.filter((p: any) => p.status === 'approved').length,
          rejected: projects.filter((p: any) => p.status === 'rejected').length,
          announcements: announcements.length,
        })

        // 5-day warning notifications
        const warns = projects.filter((p: any) => p.warnUnsubmitted)
        setNotifications(warns)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#1a7a6e] text-xs font-mono tracking-[0.2em] uppercase mb-1">先生ダッシュボード</p>
        <h1 className="text-3xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
          Welcome, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-[#7a6a52] text-sm mt-1">Here's an overview of your teaching activity.</p>
        <RealTimeClock accentColor="#1a7a6e" />
      </div>
      

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map((p: any) => (
            <div key={p._id} className="flex items-start gap-3 bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.35)] rounded-sm px-4 py-3">
              <span className="text-lg mt-0.5">⚠️</span>
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
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard icon="📚" label="My Subjects" value={stats.subjects} href="/teacher/subjects" color="text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]" />
          <StatCard icon="🗂" label="Total Projects" value={stats.projects} href="/teacher/projects" color="text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]" />
          <StatCard icon="⏳" label="Pending Approval" value={stats.pending} href="/teacher/projects" color="text-[#d4a843] border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.08)]" />
          <StatCard icon="✅" label="Approved" value={stats.approved} href="/teacher/projects" color="text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]" />
          <StatCard icon="✕" label="Rejected" value={stats.rejected} href="/teacher/projects" color="text-[#c0392b] border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.06)]" />
          <StatCard icon="📢" label="Announcements" value={stats.announcements} href="/teacher/announcements" color="text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]" />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white border border-[#c8b89a] rounded-sm p-6 shadow-[3px_3px_0_#c8b89a]">
        <h2 className="font-bold text-[#1a1209] mb-4" style={{ fontFamily: 'Georgia, serif' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/teacher/projects', icon: '➕', label: 'New Project' },
            { href: '/teacher/subjects', icon: '📖', label: 'Add Material' },
            { href: '/teacher/announcements', icon: '📢', label: 'Announce' },
            { href: '/teacher/students', icon: '📊', label: 'View Progress' },
          ].map(q => (
            <Link key={q.href} href={q.href}
              className="flex flex-col items-center gap-2 p-4 border border-[#c8b89a] rounded-sm hover:bg-[#faf6ee] hover:border-[#1a7a6e] transition-all group text-center">
              <span className="text-2xl group-hover:scale-110 transition-transform">{q.icon}</span>
              <span className="text-xs font-semibold text-[#7a6a52] group-hover:text-[#1a1209]">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}