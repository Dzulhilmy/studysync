"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ScanSearch, X } from "lucide-react";

// ── Searchable content index ──────────────────────────────────────────────────
const LANDING_INDEX = [
  {
    keywords: ["home", "hero", "top", "welcome", "studysync", "start", "main"],
    label: "Hero — Welcome to StudySync",
    section: "hero",
    icon: "🏠",
    desc: "Introduction and main call-to-action",
  },
  {
    keywords: [
      "features",
      "feature",
      "what",
      "project",
      "assignment",
      "submission",
      "announcement",
      "grade",
      "grading",
      "material",
      "file",
      "upload",
      "pdf",
      "deadline",
      "approve",
    ],
    label: "Features",
    section: "features",
    icon: "✨",
    desc: "Project management, grading, announcements, materials",
  },
  {
    keywords: [
      "project management",
      "projects",
      "create project",
      "submit",
      "submission",
    ],
    label: "Feature — Project Management",
    section: "features",
    icon: "📋",
    desc: "Create, submit and grade projects",
  },
  {
    keywords: ["grading", "grade", "score", "marks", "feedback", "result"],
    label: "Feature — Grading System",
    section: "features",
    icon: "🏆",
    desc: "Score submissions and give feedback",
  },
  {
    keywords: ["announcement", "notice", "pinned", "broadcast"],
    label: "Feature — Announcements",
    section: "features",
    icon: "📢",
    desc: "Post pinned announcements to subjects",
  },
  {
    keywords: [
      "material",
      "resource",
      "file",
      "pdf",
      "upload",
      "cloudinary",
      "attachment",
    ],
    label: "Feature — Learning Materials",
    section: "features",
    icon: "📎",
    desc: "Upload and share files with students",
  },
  {
    keywords: [
      "roles",
      "role",
      "admin",
      "teacher",
      "student",
      "who",
      "login",
      "sign in",
      "portal",
      "access",
    ],
    label: "User Roles",
    section: "roles",
    icon: "👥",
    desc: "Admin, Teacher and Student portals",
  },
  {
    keywords: ["admin", "administrator", "manage", "management"],
    label: "Role — Administrator",
    section: "roles",
    icon: "👑",
    desc: "Full system control, user management, project approval",
  },
  {
    keywords: ["teacher", "cikgu", "instructor", "educator"],
    label: "Role — Teacher",
    section: "roles",
    icon: "👨‍🏫",
    desc: "Create projects, grade submissions, post announcements",
  },
  {
    keywords: ["student", "murid", "learner", "pupil"],
    label: "Role — Student",
    section: "roles",
    icon: "🎒",
    desc: "View projects, submit work, check grades",
  },
  {
    keywords: [
      "tech",
      "stack",
      "technology",
      "nextjs",
      "next.js",
      "mongodb",
      "tailwind",
      "nextauth",
      "built with",
    ],
    label: "Technology Stack",
    section: "stack",
    icon: "⚙️",
    desc: "Next.js, MongoDB, Tailwind CSS, NextAuth",
  },
  {
    keywords: ["nextjs", "next.js", "react", "framework"],
    label: "Stack — Next.js",
    section: "stack",
    icon: "▲",
    desc: "Built with Next.js 15 App Router",
  },
  {
    keywords: ["mongodb", "database", "atlas", "db"],
    label: "Stack — MongoDB Atlas",
    section: "stack",
    icon: "🍃",
    desc: "Cloud database with Mongoose ODM",
  },
  {
    keywords: [
      "sign in",
      "login",
      "signin",
      "enter",
      "start",
      "get started",
      "credentials",
      "password",
    ],
    label: "Sign In",
    section: "cta",
    icon: "🔐",
    desc: "Log in with your school credentials",
  },
  {
    keywords: [
      "about",
      "contact",
      "school",
      "education",
      "lms",
      "learning management",
    ],
    label: "About StudySync",
    section: "hero",
    icon: "ℹ️",
    desc: "Learning management system for schools",
  },
];

function scrollToSection(section: string) {
  if (section === "hero") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (section === "cta") {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    return;
  }
  document
    .getElementById(section)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function doSearch(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const seen = new Set<string>();
  const out: typeof LANDING_INDEX = [];
  for (const item of LANDING_INDEX) {
    if (seen.has(item.label)) continue;
    const hit =
      item.keywords.some((k) => k.includes(q) || q.includes(k)) ||
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q);
    if (hit) {
      seen.add(item.label);
      out.push(item);
    }
  }
  return out.slice(0, 6);
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "rgba(212,168,67,0.28)",
          color: "#d4a843",
          borderRadius: 2,
          padding: 0,
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function LandingSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof LANDING_INDEX>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Only render portal after mount (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure input position — called on every open / scroll / resize
  const measureRect = useCallback(() => {
    if (boxRef.current) setRect(boxRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    const r = doSearch(query);
    setResults(r);
    setSel(0);
    if (r.length > 0) {
      measureRect();
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [query, measureRect]);

  useEffect(() => {
    if (!open) return;
    measureRect();
    const onResize = () => measureRect();
    const onScroll = () => measureRect();
    window.addEventListener("resize", onResize);
    // capture:true catches scroll on any ancestor including the mobile menu container
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, measureRect]);

  // Close on outside click — checks both input box and portal dropdown
  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      const inBox = boxRef.current?.contains(t);
      const inDrop = dropRef.current?.contains(t);
      if (!inBox && !inDrop) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function pick(item: (typeof LANDING_INDEX)[0]) {
    scrollToSection(item.section);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    }
    if (e.key === "Enter" && results[sel]) pick(results[sel]);
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  // Dropdown styles — anchored to the measured input rect
  const dropStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        // Never overflow the bottom of the screen
        maxHeight: `${Math.max(160, window.innerHeight - rect.bottom - 24)}px`,
        overflowY: "auto",
        background: "#1e0f06",
        border: "1px solid rgba(212,168,67,0.3)",
        borderRadius: 4,
        boxShadow: "0 20px 60px rgba(0,0,0,0.75)",
        // Portal renders at body level — no stacking context issues
        zIndex: 99999,
      }
    : {};

  return (
    <>
      {/* ── Input ── */}
      <div
        ref={boxRef}
        style={{ position: "relative", width: "100%", maxWidth: 420 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background:
              open || query
                ? "rgba(250,246,238,0.18)"
                : "rgba(250,246,238,0.10)",
            border: `1px solid ${open || query ? "rgba(212,168,67,0.65)" : "rgba(212,168,67,0.28)"}`,
            borderRadius: 4,
            padding: "8px 14px",
            transition: "border-color .2s, background .2s",
            // NOTE: NO backdropFilter here — that was breaking fixed positioning
          }}
        >
          <ScanSearch
            size={25}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => {
              measureRect();
              query && results.length > 0 && setOpen(true);
            }}
            placeholder="Search features, roles, tech..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#faf6ee",
              fontSize: 13,
              width: "100%",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: ".3px",
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                lineHeight: 1,
                color: "rgba(212,168,67,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={18}/>
            </button>
          )}
        </div>
      </div>

      {/* ── Dropdown via Portal — renders directly into <body> ── */}
      {mounted &&
        open &&
        rect &&
        createPortal(
          <div ref={dropRef} style={dropStyle}>
            {results.map((r, i) => (
              <button
                key={r.label}
                onClick={() => pick(r)}
                onMouseEnter={() => setSel(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background:
                    i === sel ? "rgba(212,168,67,0.12)" : "transparent",
                  border: "none",
                  borderBottom:
                    i < results.length - 1
                      ? "1px solid rgba(212,168,67,0.07)"
                      : "none",
                  cursor: "pointer",
                  transition: "background .12s",
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    flexShrink: 0,
                    width: 24,
                    textAlign: "center",
                  }}
                >
                  {r.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: i === sel ? "#d4a843" : "#faf6ee",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "Georgia, serif",
                      transition: "color .12s",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Highlight text={r.label} query={query} />
                  </div>
                  <div
                    style={{
                      color: "rgba(250,246,238,0.42)",
                      fontSize: 11,
                      fontFamily: "monospace",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.desc}
                  </div>
                </div>
                <span
                  style={{
                    color: "rgba(212,168,67,0.35)",
                    fontSize: 10,
                    fontFamily: "monospace",
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  scroll ↓
                </span>
              </button>
            ))}

            {/* Keyboard hint */}
            <div
              style={{
                padding: "5px 14px",
                display: "flex",
                gap: 14,
                background: "rgba(0,0,0,0.25)",
                borderTop: "1px solid rgba(212,168,67,0.07)",
              }}
            >
              {[
                ["↑↓", "navigate"],
                ["↵", "go"],
                ["esc", "close"],
              ].map(([k, l]) => (
                <span
                  key={k}
                  style={{
                    color: "rgba(250,246,238,0.28)",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                >
                  <span
                    style={{ color: "rgba(212,168,67,0.5)", marginRight: 3 }}
                  >
                    {k}
                  </span>
                  {l}
                </span>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
