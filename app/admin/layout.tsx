"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import IdleTimeout from "@/components/IdleTimeout";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "⛩", jp: "ダッシュボード" },
  { href: "/admin/users", label: "Users", icon: "👥", jp: "ユーザー管理" },
  { href: "/admin/subjects", label: "Subjects", icon: "📚", jp: "科目管理" },
  { href: "/admin/students", label: "Students", icon: "🎓", jp: "学生管理" },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: "🗂",
    jp: "プロジェクト",
  },
  { href: "/admin/profile", label: "Profile", icon: "⚙️", jp: "プロフィール" },
];

export default function AdminLayout({
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
      className="min-h-screen flex bg-[#faf6ee]"
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
        bg-[#2c1810] border-r border-[rgba(212,168,67,0.15)]
        transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-[rgba(212,168,67,0.12)]">
          <div className="text-[rgba(212,168,67,0.4)] text-[10px] font-mono tracking-[0.3em] uppercase mb-2">
            管理者パネル
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
            <div className="text-[rgba(212,168,67,0.35)] text-[10px] font-mono tracking-widest mt-0.5">
              Administrator Portal
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
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
                      ? "bg-[rgba(212,168,67,0.15)] border border-[rgba(212,168,67,0.25)]"
                      : "hover:bg-[rgba(250,246,238,0.05)] border border-transparent"
                  }
                `}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold truncate ${active ? "text-[#d4a843]" : "text-[rgba(250,246,238,0.65)]"}`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-[rgba(212,168,67,0.3)] truncate">
                    {item.jp}
                  </div>
                </div>
                {active && (
                  <div className="w-1 h-1 rounded-full bg-[#d4a843]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-[rgba(212,168,67,0.12)]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-sm bg-[rgba(212,168,67,0.15)] border border-[rgba(212,168,67,0.3)] flex items-center justify-center text-[#d4a843] text-sm font-bold">
              {session?.user?.name?.[0] ?? "A"}
            </div>
            <div className="min-w-0">
              <div className="text-[rgba(250,246,238,0.8)] text-xs font-semibold truncate">
                {session?.user?.name}
              </div>
              <div className="text-[rgba(212,168,67,0.4)] text-[10px] font-mono">
                Administrator
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
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top navbar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#2c1810] border-b border-[rgba(212,168,67,0.15)]">
          <span
            className="text-[#faf6ee] font-bold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Study<span className="text-[#d4a843]">Sync</span>
          </span>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-[rgba(250,246,238,0.6)] text-xl p-1"
          >
            ☰
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
