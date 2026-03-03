'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import NotificationBell from '@/components/Notificationbell'
import IdleTimeout from '@/components/IdleTimeout'
import {
  IconHome, IconSubjects, IconProjects, IconAnnouncements,
  IconClassmates, IconProfile, IconSignOut, IconMenu,
} from '@/components/NavIcons'

const navItems = [
  { href: '/student',               label: 'Dashboard',     Icon: IconHome,          jp: 'HOME' },
  { href: '/student/subjects',      label: 'Subjects',      Icon: IconSubjects,      jp: 'SUBJECTS' },
  { href: '/student/projects',      label: 'Projects',      Icon: IconProjects,      jp: 'PROJECTS' },
  { href: '/student/announcements', label: 'Announcements', Icon: IconAnnouncements, jp: 'NOTICES' },
  { href: '/student/classmates',    label: 'Classmates',    Icon: IconClassmates,    jp: 'CLASSMATES' },
  { href: '/student/profile',       label: 'Profile',       Icon: IconProfile,       jp: 'PROFILE' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    // callbackUrl sends NextAuth's own redirect — browser history is replaced
    // so the back button cannot return to a protected page after logout
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  return (
    <div
      className="min-h-screen flex items-stretch bg-[#faf6ee]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(200,184,154,0.12) 28px)',
      }}
    >
      <IdleTimeout />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full min-h-screen w-64 z-50 flex flex-col
          bg-[#1a2535] border-r border-[rgba(212,168,67,0.12)]
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:self-stretch
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-[rgba(212,168,67,0.1)]">
          <div className="text-[rgba(212,168,67,0.4)] text-[10px] font-mono tracking-[0.3em] uppercase mb-2">
            学生パネル
          </div>
          <div className="flex items-center gap-3">
            {/* LOGO PLACEHOLDER — replace with <img src="/logo.png" className="w-9 h-9 rounded" /> */}
            <div className="w-9 h-9 rounded-sm overflow-hidden flex-shrink-0 border border-[rgba(212,168,67,0.25)]">
              <svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" fill="#1c1108"/>
                <rect x="7"  y="21" width="22" height="4" rx="1" fill="#d4a843" opacity="0.9"/>
                <rect x="9"  y="15.5" width="18" height="4" rx="1" fill="#d4a843" opacity="0.65"/>
                <rect x="11" y="10" width="14" height="4" rx="1" fill="#d4a843" opacity="0.4"/>
                <rect x="7"  y="21" width="2.5" height="4" rx="0.5" fill="#c0392b" opacity="0.85"/>
                <rect x="9"  y="15.5" width="2.5" height="4" rx="0.5" fill="#c0392b" opacity="0.6"/>
                <rect x="11" y="10" width="2.5" height="4" rx="0.5" fill="#c0392b" opacity="0.4"/>
              </svg>
            </div>
            <div>
              <div
                className="text-[#faf6ee] text-xl font-bold"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Study<span className="text-[#d4a843]">Sync</span>
              </div>
              <div className="text-[rgba(99,179,237,0.4)] text-[10px] font-mono tracking-widest mt-0.5">
                Student Portal
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, Icon, jp }) => {
            const active =
              href === '/student'
                ? pathname === '/student'
                : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-sm group transition-all duration-150
                  ${active
                    ? 'bg-[rgba(99,179,237,0.12)] border border-[rgba(99,179,237,0.25)]'
                    : 'hover:bg-[rgba(250,246,238,0.04)] border border-transparent'
                  }
                `}
              >
                <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <Icon size={18} color={active ? '#63b3ed' : 'rgba(250,246,238,0.5)'} />
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold truncate ${
                      active ? 'text-[#63b3ed]' : 'text-[rgba(250,246,238,0.6)]'
                    }`}
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {label}
                  </div>
                  <div className="text-[10px] font-mono text-[rgba(99,179,237,0.3)] truncate">
                    {jp}
                  </div>
                </div>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-[#63b3ed] flex-shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-[rgba(212,168,67,0.1)]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-sm bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)] flex items-center justify-center text-[#63b3ed] text-sm font-bold">
              {session?.user?.name?.[0] ?? 'S'}
            </div>
            <div className="min-w-0">
              <div className="text-[rgba(250,246,238,0.8)] text-xs font-semibold truncate">
                {session?.user?.name}
              </div>
              <div className="text-[rgba(99,179,237,0.4)] text-[10px] font-mono">Student</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[rgba(192,57,43,0.7)] hover:text-[#c0392b] hover:bg-[rgba(192,57,43,0.08)] rounded-sm transition-all text-xs font-semibold border border-transparent hover:border-[rgba(192,57,43,0.2)]"
          >
            <IconSignOut size={15} color="currentColor" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#1a2535] border-b border-[rgba(99,179,237,0.15)]">
          <span className="text-[#faf6ee] font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Study<span className="text-[#d4a843]">Sync</span>
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1"
              aria-label="Open menu"
            >
              <IconMenu size={20} color="rgba(250,246,238,0.6)" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto relative">
          <div className="hidden lg:block fixed top-4 right-6 z-50">
            <NotificationBell />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}