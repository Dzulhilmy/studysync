'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import RealTimeClock from '@/components/RealTimeClock';

interface Stats { users: number; teachers: number; students: number; subjects: number; projects: number; pending: number }

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[5px_5px_0_#c8b89a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${color}`}>{sub ?? 'total'}</span>
      </div>
      <div className="text-3xl font-bold text-[#1a1209] font-serif mb-0.5">{value}</div>
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
        const users = await uRes.json()
        const subjects = await sRes.json()
        const projects = await pRes.json()
        setStats({
          users: users.length,
          teachers: users.filter((u: any) => u.role === 'teacher').length,
          students: users.filter((u: any) => u.role === 'student').length,
          subjects: subjects.length,
          projects: projects.length,
          pending: projects.filter((p: any) => p.status === 'pending').length,
        })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[#c0392b] text-xs font-mono tracking-[0.2em] uppercase mb-1">管理者ダッシュボード</p>
        <h1 className="text-3xl font-bold text-[#1a1209] font-serif">Welcome back, {session?.user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-[#7a6a52] text-sm mt-1">Here's what's happening in StudySync today.</p>
        <RealTimeClock accentColor="#d4a843" />
      </div>
      

      {/* Stats grid */}
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading statistics...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard icon="👥" label="Total Users" value={stats.users} sub="all roles" color="text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]" />
          <StatCard icon="👩‍🏫" label="Teachers" value={stats.teachers} sub="active" color="text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]" />
          <StatCard icon="🧑‍🎓" label="Students" value={stats.students} sub="enrolled" color="text-[#d4a843] border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.08)]" />
          <StatCard icon="📚" label="Subjects" value={stats.subjects} sub="active" color="text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]" />
          <StatCard icon="🗂" label="Projects" value={stats.projects} sub="total" color="text-[#8b5a2b] border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.06)]" />
          <StatCard icon="⏳" label="Pending Approval" value={stats.pending} sub="review" color="text-[#c0392b] border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.06)]" />
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white border border-[#c8b89a] rounded-sm p-6 shadow-[3px_3px_0_#c8b89a]">
        <h2 className="font-serif font-bold text-[#1a1209] mb-4 text-lg">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/users', icon: '➕', label: 'Add User' },
            { href: '/admin/subjects', icon: '📖', label: 'New Subject' },
            { href: '/admin/projects', icon: '✅', label: 'Review Projects' },
            { href: '/admin/students', icon: '🔗', label: 'Assign Students' },
          ].map(q => (
            <a key={q.href} href={q.href}
              className="flex flex-col items-center gap-2 p-4 border border-[#c8b89a] rounded-sm hover:bg-[#faf6ee] hover:border-[#d4a843] transition-all group text-center">
              <span className="text-2xl group-hover:scale-110 transition-transform">{q.icon}</span>
              <span className="text-xs font-semibold text-[#7a6a52] group-hover:text-[#1a1209]">{q.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
