"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import NotificationBell from "@/components/Notificationbell";
import DashboardSearch from "@/components/DashboardSearch";
import IdleTimeout from "@/components/IdleTimeout";
import Avatar from "@/components/Avatar";
import {
  IconDashboard, IconSubjects, IconProjects, IconAnnouncements,
  IconStudents, IconReports, IconProfile, IconSignOut, IconMenu, IconClose,
} from "@/components/NavIcons";

const navItems = [
  { href: "/teacher",               label: "Dashboard",    Icon: IconDashboard,    jp: "ダッシュボード" },
  { href: "/teacher/subjects",      label: "Subjects",     Icon: IconSubjects,     jp: "科目管理"       },
  { href: "/teacher/projects",      label: "Projects",     Icon: IconProjects,     jp: "プロジェクト"   },
  { href: "/teacher/announcements", label: "Announcements",Icon: IconAnnouncements,jp: "お知らせ"       },
  { href: "/teacher/students",      label: "Students",     Icon: IconStudents,     jp: "学生管理"       },
  { href: "/teacher/reports",       label: "Reports",      Icon: IconReports,      jp: "monthly report" },
  { href: "/teacher/profile",       label: "Profile",      Icon: IconProfile,      jp: "profile"        },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [avatarPopup, setAvatarPopup] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  const avatarUrl = (session?.user as any)?.avatarUrl ?? null;

  return (
    <div
      className="min-h-screen flex bg-[#faf6ee]"
      style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(200,184,154,0.12) 28px)" }}
    >
      <IdleTimeout />

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Avatar popup ──────────────────────────────────────────────── */}
      {avatarPopup && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
          onClick={() => setAvatarPopup(false)}
        >
          <div
            className="bg-[#1a3a2a] border border-[rgba(26,122,110,0.3)] rounded-sm shadow-[6px_6px_0_rgba(0,0,0,0.4)] p-6 w-72 flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}
          >
            <Avatar
              src={avatarUrl}
              name={session?.user?.name}
              role="teacher"
              size={88}
            />

            <div className="text-center">
              <div className="text-[#faf6ee] font-bold text-base" style={{ fontFamily: "Georgia, serif" }}>
                {session?.user?.name}
              </div>
              <div className="text-[#88d4ab] text-[10px] font-mono tracking-widest uppercase mt-0.5">
                Teacher
              </div>
              <div className="text-[rgba(250,246,238,0.35)] text-xs font-mono mt-1">
                {session?.user?.email}
              </div>
            </div>

            <div className="flex gap-2 w-full pt-1">
              <Link
                href="/teacher/profile"
                onClick={() => setAvatarPopup(false)}
                className="flex-1 text-center text-xs py-2 border border-[rgba(212,168,67,0.3)] text-[#d4a843]
                           hover:bg-[rgba(212,168,67,0.1)] rounded-sm font-mono transition-colors"
              >
                Edit Profile
              </Link>
              <button
                onClick={() => setAvatarPopup(false)}
                className="flex-1 text-xs py-2 border border-[rgba(250,246,238,0.15)] text-[rgba(250,246,238,0.45)]
                           hover:bg-[rgba(250,246,238,0.05)] rounded-sm font-mono transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 h-full min-h-screen w-64 z-50 flex flex-col
        bg-[#1a3a2a] border-r border-[rgba(26,122,110,0.2)]
        transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:sticky lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-[rgba(26,122,110,0.15)]">
          <div className="flex items-center gap-1">
            <div className="w-12 h-12 flex-shrink-0">
              <Image src="/Image_Logo.png" alt="StudySync Crest" width={40} height={40} style={{ objectFit: "contain" }} />
            </div>
            <span style={{ fontFamily: "Noto Serif JP,serif", fontWeight: 900, fontSize: "1.18rem", color: "#faf6ee", letterSpacing: "-.01em" }}>
              Study
            </span>
            <span style={{ fontFamily: "Noto Serif JP,serif", fontWeight: 900, fontSize: "1.18rem", color: "transparent", WebkitTextStroke: "2px #d4a843", textShadow: "0 0 100px rgba(212,168,67,.12)" }}>
              Sync
            </span>
          </div>
          <div className="text-[rgba(26,122,110,0.5)] text-[10px] font-mono tracking-widest mt-2">
            Teacher Panel
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, Icon, jp }) => {
            const active = href === "/teacher" ? pathname === "/teacher" : pathname.startsWith(href);
            return (
              <Link
                key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-sm group transition-all duration-150 ${
                  active
                    ? "bg-[rgba(26,122,110,0.2)] border border-[rgba(26,122,110,0.35)]"
                    : "hover:bg-[rgba(250,246,238,0.05)] border border-transparent"
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <Icon size={18} color={active ? "#d4a843" : "rgba(250,246,238,0.5)"} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${active ? "text-[#d4a843]" : "text-[rgba(250,246,238,0.65)]"}`}
                    style={{ fontFamily: "Georgia, serif" }}>
                    {label}
                  </div>
                  
                </div>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-[#d4a843] flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom: clickable avatar row + sign out ── */}
        <div className="p-4 border-t border-[rgba(26,122,110,0.15)]">
          {/* Click avatar → popup */}
          <button
            onClick={() => setAvatarPopup(true)}
            className="w-full flex items-center gap-3 mb-3 px-2 py-2 rounded-sm
                       hover:bg-[rgba(26,122,110,0.15)] transition-colors group"
          >
            <Avatar
              src={avatarUrl}
              name={session?.user?.name}
              role="teacher"
              size={34}
            />
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[rgba(250,246,238,0.8)] text-xs font-semibold truncate">
                {session?.user?.name}
              </div>
              <div className="text-[rgba(26,122,110,0.5)] text-[10px] font-mono">Teacher</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0">
              <path d="M4 5l2 2 2-2" stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[rgba(192,57,43,0.7)] hover:text-[#c0392b]
                       hover:bg-[rgba(192,57,43,0.08)] rounded-sm transition-all text-xs font-semibold
                       border border-transparent hover:border-[rgba(192,57,43,0.2)]"
          >
            <IconSignOut size={15} color="currentColor" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#1a3a2a] border-b border-[rgba(26,122,110,0.2)]">
          <span className="text-[#faf6ee] font-bold" style={{ fontFamily: "Georgia, serif" }}>
            Study<span className="text-[#d4a843]">Sync</span>
          </span>
          <div className="flex items-center gap-3">
            <DashboardSearch role="teacher" />
            <NotificationBell />
            {/* Mobile avatar tap → popup */}
            <button onClick={() => setAvatarPopup(true)}>
              <Avatar src={avatarUrl} name={session?.user?.name} role="teacher" size={30} />
            </button>
            <button onClick={() => setMobileOpen(true)} className="p-1" aria-label="Open menu">
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
  );
}