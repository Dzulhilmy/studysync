"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import IdleTimeout from "@/components/IdleTimeout";
import NotificationBell from "@/components/Notificationbell";

const navItems = [
  { href: "/student", label: "Dashboard", icon: "🏠", jp: "ホーム" },
  { href: "/student/subjects", label: "Subjects", icon: "📚", jp: "科目" },
  {
    href: "/student/projects",
    label: "Projects",
    icon: "📝",
    jp: "プロジェクト",
  },
  {
    href: "/student/announcements",
    label: "Announcements",
    icon: "📢",
    jp: "お知らせ",
  },
  {
    href: "/student/classmates",
    label: "Classmates",
    icon: "👥",
    jp: "クラスメート",
  },
  {
    href: "/student/profile",
    label: "Profile",
    icon: "⚙️",
    jp: "プロフィール",
  },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div
      className="min-h-screen flex items-stretch bg-[#faf6ee]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(200,184,154,0.12) 28px)",
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
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:self-stretch
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-[rgba(212,168,67,0.1)]">
          <div className="text-[rgba(212,168,67,0.4)] text-[10px] font-mono tracking-[0.3em] uppercase mb-2">
            学生パネル
          </div>
          {/* 1. Main Parent Wrapper: flex-col forces the items to stack vertically */}
          <div className="flex flex-col items-start gap-2">
            {/* 2. Top Row: The two logos side-by-side */}
            <div className="flex items-center gap-3">
              {/* Crest Logo */}
              <div className="w-12 h-12 flex-shrink-0">
                <Image
                  src="/Image_Logo.png"
                  alt="StudySync Crest"
                  width={40}
                  height={40}
                  style={{ objectFit: "contain" }}
                />
              </div>

              {/* Text Logo */}
              <div className="flex-shrink-0">
                <Image
                  src="/Text_Logo.png"
                  alt="StudySync"
                  width={80}
                  height={40}
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>

            {/* 3. Bottom Row: The Portal Text */}
            <div className="text-[rgba(99,179,237,0.4)] text-[10px] font-mono tracking-[0.3em] mt-0.5">
              Student Portal
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href === "/student"
                ? pathname === "/student"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-sm group transition-all duration-150
                  ${
                    active
                      ? "bg-[rgba(99,179,237,0.12)] border border-[rgba(99,179,237,0.25)]"
                      : "hover:bg-[rgba(250,246,238,0.04)] border border-transparent"
                  }
                `}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold truncate ${
                      active ? "text-[#63b3ed]" : "text-[rgba(250,246,238,0.6)]"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-[rgba(99,179,237,0.3)] truncate">
                    {item.jp}
                  </div>
                </div>
                {active && (
                  <div className="w-1 h-1 rounded-full bg-[#63b3ed]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-[rgba(212,168,67,0.1)]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-sm bg-[rgba(99,179,237,0.15)] border border-[rgba(99,179,237,0.3)] flex items-center justify-center text-[#63b3ed] text-sm font-bold">
              {session?.user?.name?.[0] ?? "S"}
            </div>
            <div className="min-w-0">
              <div className="text-[rgba(250,246,238,0.8)] text-xs font-semibold truncate">
                {session?.user?.name}
              </div>
              <div className="text-[rgba(99,179,237,0.4)] text-[10px] font-mono">
                Student
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[rgba(192,57,43,0.7)] hover:text-[#c0392b] hover:bg-[rgba(192,57,43,0.08)] rounded-sm transition-all text-xs font-semibold border border-transparent hover:border-[rgba(192,57,43,0.2)]"
          >
            <span>⏻</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#1a2535] border-b border-[rgba(99,179,237,0.15)]">
          <span
            className="text-[#faf6ee] font-bold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Study<span className="text-[#d4a843]">Sync</span>
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(true)}
              className="text-[rgba(250,246,238,0.6)] text-xl p-1"
            >
              ☰
            </button>
          </div>
        </header>

        {/* Desktop top bar with bell + clock */}
        <div className="hidden lg:flex items-center justify-end gap-3 px-8 py-2.5 border-b border-[rgba(99,179,237,0.08)]">
          <NotificationBell />
        </div>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
