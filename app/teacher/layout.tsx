'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import NotificationBell from '@/components/Notificationbell'
import DashboardSearch from '@/components/DashboardSearch'
import IdleTimeout from '@/components/IdleTimeout'
import {
  IconDashboard, IconSubjects, IconProjects, IconAnnouncements,
  IconStudents, IconReports, IconProfile, IconSignOut, IconMenu,
} from '@/components/NavIcons'

const navItems = [
  { href: '/teacher',               label: 'Dashboard',     Icon: IconDashboard,     jp: 'ダッシュボード' },
  { href: '/teacher/subjects',      label: 'Subjects',      Icon: IconSubjects,      jp: '科目管理' },
  { href: '/teacher/projects',      label: 'Projects',      Icon: IconProjects,      jp: 'プロジェクト' },
  { href: '/teacher/announcements', label: 'Announcements', Icon: IconAnnouncements, jp: 'お知らせ' },
  { href: '/teacher/students',      label: 'Students',      Icon: IconStudents,      jp: '学生管理' },
  { href: '/teacher/reports',       label: 'Reports',       Icon: IconReports,       jp: 'monthly report' },
  { href: '/teacher/profile',       label: 'Profile',       Icon: IconProfile,       jp: 'profile' },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  return (
    <div className="min-h-screen flex bg-[#faf6ee]" style={{
      backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(200,184,154,0.12) 28px)',
    }}>
      <IdleTimeout />
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-[#1a3a2a] border-r border-[rgba(26,122,110,0.2)] transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-[rgba(26,122,110,0.15)]">
          <div className="text-[rgba(212,168,67,0.4)] text-[10px] font-mono tracking-[0.3em] uppercase mb-2">
            教師パネル
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0">
              <Image
                src="/Image_Logo.png"
                alt="StudySync Crest"
                width={40}
                height={40}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/Text_Logo.png"
                alt="StudySync"
                width={80}
                height={40}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          <div className="text-[rgba(26,122,110,0.5)] text-[10px] font-mono tracking-widest mt-2">Teacher Panel</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, Icon, jp }) => {
            const active = href === '/teacher' ? pathname === '/teacher' : pathname.startsWith(href)
            const iconColor = active ? '#d4a843' : 'rgba(250,246,238,0.5)'
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-sm group transition-all duration-150 ${active ? 'bg-[rgba(26,122,110,0.2)] border border-[rgba(26,122,110,0.35)]' : 'hover:bg-[rgba(250,246,238,0.05)] border border-transparent'}`}>
                <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <Icon size={18} color={iconColor} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${active ? 'text-[#d4a843]' : 'text-[rgba(250,246,238,0.65)]'}`} style={{ fontFamily: 'Georgia, serif' }}>{label}</div>
                  <div className="text-[10px] font-mono text-[rgba(26,122,110,0.45)] truncate">{jp}</div>
                </div>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-[#d4a843] flex-shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-[rgba(26,122,110,0.15)]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-sm bg-[rgba(26,122,110,0.2)] border border-[rgba(26,122,110,0.35)] flex items-center justify-center text-sm font-bold" style={{ color: '#88d4ab' }}>
              {session?.user?.name?.[0] ?? 'T'}
            </div>
            <div className="min-w-0">
              <div className="text-[rgba(250,246,238,0.8)] text-xs font-semibold truncate">{session?.user?.name}</div>
              <div className="text-[rgba(26,122,110,0.5)] text-[10px] font-mono">Teacher</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-[rgba(192,57,43,0.7)] hover:text-[#c0392b] hover:bg-[rgba(192,57,43,0.08)] rounded-sm transition-all text-xs font-semibold border border-transparent hover:border-[rgba(192,57,43,0.2)]">
            <IconSignOut size={15} color="currentColor" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#1a3a2a] border-b border-[rgba(26,122,110,0.2)]">
          <span className="text-[#faf6ee] font-bold" style={{ fontFamily: 'Georgia, serif' }}>Study<span className="text-[#d4a843]">Sync</span></span>
          <div className="flex items-center gap-2">
            <DashboardSearch role="teacher" />
            <NotificationBell />
            <button onClick={() => setMobileOpen(true)} className="p-1" aria-label="Open menu">
              <IconMenu size={20} color="rgba(250,246,238,0.6)" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto relative">
          <div className="hidden lg:block fixed top-4 right-6 z-50"><NotificationBell /></div>
          {children}
        </main>
      </div>
    </div>
  )
}