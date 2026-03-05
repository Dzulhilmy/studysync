"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LandingSearch from "../components/LandingSearch";

/* ═══════════════════════════════════════════
   SVG ICON LIBRARY
═══════════════════════════════════════════ */

function IconDashboard({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="18" width="6" height="11" rx="1.5" fill="#4a90d9" />
      <rect x="13" y="11" width="6" height="18" rx="1.5" fill="#2ecc71" />
      <rect x="23" y="5" width="6" height="24" rx="1.5" fill="#e74c3c" />
      <path
        d="M4 22 L13 14 L22 18 L29 8"
        stroke="#d4a843"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}

function IconDeadline({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 4 L30 28 H2 Z"
        fill="#f39c12"
        opacity="0.18"
        stroke="#f39c12"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="15" y="13" width="2" height="7" rx="1" fill="#e67e22" />
      <circle cx="16" cy="23" r="1.4" fill="#e67e22" />
    </svg>
  );
}

function IconDraft({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M20 5 L27 12 L12 27 L5 27 L5 20 Z"
        fill="#e8a87c"
        opacity="0.25"
        stroke="#d4845a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 5 L27 12"
        stroke="#d4845a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 7 L25 14"
        stroke="#d4845a"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="5"
        y1="27"
        x2="12"
        y2="27"
        stroke="#d4845a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 23 L15 17"
        stroke="#f0b07a"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function IconProgress({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M4 24 L11 15 L17 19 L24 9 L28 12"
        stroke="#e74c3c"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M4 24 L11 15 L17 19 L24 9 L28 12 L28 28 L4 28 Z"
        fill="#e74c3c"
        opacity="0.1"
      />
      <circle cx="11" cy="15" r="2" fill="#e74c3c" />
      <circle cx="17" cy="19" r="2" fill="#c0392b" />
      <circle cx="24" cy="9" r="2" fill="#e74c3c" />
    </svg>
  );
}

function IconAnnouncement({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M6 12 L6 20 L10 20 L10 26 L14 26 L14 20 L26 26 L26 6 Z"
        fill="#7f8c8d"
        opacity="0.2"
        stroke="#7f8c8d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M6 12 L26 6 L26 26 L6 20 Z" fill="#95a5a6" opacity="0.15" />
      <line
        x1="6"
        y1="12"
        x2="6"
        y2="20"
        stroke="#7f8c8d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 11 Q30 16 28 21"
        stroke="#bdc3c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 20 L10 26 L14 26 L14 20"
        stroke="#7f8c8d"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function IconLock({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect
        x="7"
        y="14"
        width="18"
        height="14"
        rx="2.5"
        fill="#d4a843"
        opacity="0.2"
        stroke="#d4a843"
        strokeWidth="1.8"
      />
      <path
        d="M11 14 L11 10 Q11 5 16 5 Q21 5 21 10 L21 14"
        stroke="#d4a843"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="16" cy="21" r="2.5" fill="#d4a843" />
      <line
        x1="16"
        y1="21"
        x2="16"
        y2="25"
        stroke="#d4a843"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAdmin({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <path
        d="M22 6 L26 14 L36 15 L29 22 L31 32 L22 27 L13 32 L15 22 L8 15 L18 14 Z"
        fill="#c0392b"
        opacity="0.2"
        stroke="#c0392b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="22" r="5" fill="#c0392b" opacity="0.5" />
      <circle cx="22" cy="22" r="2.5" fill="#e74c3c" />
    </svg>
  );
}

function IconTeacher({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect
        x="8"
        y="12"
        width="28"
        height="22"
        rx="2"
        fill="#16a085"
        opacity="0.15"
        stroke="#16a085"
        strokeWidth="1.5"
      />
      <line
        x1="8"
        y1="12"
        x2="8"
        y2="34"
        stroke="#16a085"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="13"
        y1="19"
        x2="30"
        y2="19"
        stroke="#1abc9c"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="13"
        y1="23"
        x2="28"
        y2="23"
        stroke="#1abc9c"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="13"
        y1="27"
        x2="24"
        y2="27"
        stroke="#1abc9c"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path d="M20 8 L24 8 L22 12 Z" fill="#16a085" opacity="0.6" />
    </svg>
  );
}

function IconStudent({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <path
        d="M8 20 L22 14 L36 20 L22 26 Z"
        fill="#3a86d4"
        opacity="0.2"
        stroke="#3a86d4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="10"
        y="10"
        width="6"
        height="4"
        rx="1"
        fill="#3a86d4"
        opacity="0.5"
      />
      <rect
        x="9"
        y="9"
        width="8"
        height="3"
        rx="1"
        fill="#5aabf0"
        opacity="0.4"
      />
      <line
        x1="36"
        y1="20"
        x2="36"
        y2="30"
        stroke="#3a86d4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 30 Q30 36 22 36 Q14 36 14 30"
        stroke="#3a86d4"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconNextjs({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3 L26 24 L2 24 Z"
        fill="#1a1209"
        stroke="#c8b89a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 20 L20 9"
        stroke="#d4a843"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function IconMongo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3 Q18 8 18 14 Q18 22 14 26 Q10 22 10 14 Q10 8 14 3 Z"
        fill="#4db33d"
        opacity="0.25"
        stroke="#4db33d"
        strokeWidth="1.5"
      />
      <line
        x1="14"
        y1="20"
        x2="14"
        y2="26"
        stroke="#4db33d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="14" cy="11" r="2.5" fill="#4db33d" opacity="0.8" />
    </svg>
  );
}

function IconTailwind({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M7 14 Q9 8 14 9 Q17 10 16 14 Q18 8 23 9 Q27 10 25 16 Q23 22 18 21 Q15 20 16 16 Q14 22 9 21 Q5 20 7 14 Z"
        fill="#38bdf8"
        opacity="0.2"
        stroke="#38bdf8"
        strokeWidth="1.5"
      />
      <path
        d="M7 14 Q9 8 14 9 Q17 10 16 14"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M16 14 Q18 8 23 9 Q27 10 25 16"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconNextAuth({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect
        x="7"
        y="13"
        width="14"
        height="11"
        rx="2"
        fill="#8e44ad"
        opacity="0.2"
        stroke="#9b59b6"
        strokeWidth="1.5"
      />
      <path
        d="M10 13 L10 9 Q10 5 14 5 Q18 5 18 9 L18 13"
        stroke="#9b59b6"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="14" cy="18.5" r="2" fill="#9b59b6" />
    </svg>
  );
}

function IconVercel({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 5 L26 23 L2 23 Z"
        fill="#1a1209"
        stroke="#c8b89a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="23" r="2" fill="#d4a843" opacity="0.7" />
    </svg>
  );
}

function IconCloudinary({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M7 18 Q4 18 4 14 Q4 10 8 10 Q8 6 14 6 Q19 6 20 10 Q24 10 24 14 Q24 18 20 18 Z"
        fill="#f97316"
        opacity="0.2"
        stroke="#f97316"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polyline
        points="11,15 14,12 17,15"
        stroke="#f97316"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="14"
        y1="12"
        x2="14"
        y2="22"
        stroke="#f97316"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEnterLibrary({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect
        x="2"
        y="4"
        width="5"
        height="13"
        rx="1"
        fill="currentColor"
        opacity="0.9"
      />
      <rect
        x="8"
        y="3"
        width="5"
        height="14"
        rx="1"
        fill="currentColor"
        opacity="0.65"
      />
      <rect
        x="14"
        y="5"
        width="4"
        height="12"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <line
        x1="2"
        y1="17"
        x2="18"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGraduate({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M2 9 L10 6 L18 9 L10 12 Z"
        fill="currentColor"
        opacity="0.9"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <line
        x1="18"
        y1="9"
        x2="18"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 12 Q6 16 10 16 Q14 16 14 12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSearch({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="10.5"
        y1="10.5"
        x2="14"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSignIn({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3 L2 3 L2 13 L6 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 5 L13 8 L9 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="13"
        y1="8"
        x2="5"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M3 7 L11 7 M8 4 L11 7 L8 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M7 3 L7 11 M4 8 L7 11 L10 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}

function Rise({
  children,
  d = 0,
  y = 40,
  style: s = {},
}: {
  children: React.ReactNode;
  d?: number;
  y?: number;
  style?: React.CSSProperties;
}) {
  const { ref, on } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : `translateY(${y}px)`,
        transition: `opacity .85s cubic-bezier(.22,1,.36,1) ${d}s, transform .85s cubic-bezier(.22,1,.36,1) ${d}s`,
        ...s,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOOK SPINES  (pure CSS art)
═══════════════════════════════════════════ */
const BOOKS = [
  { w: 22, h: 158, c: "#7a1f1f", t: "Mathematics", d: 0.0 },
  { w: 17, h: 172, c: "#1c3d6a", t: "Science", d: 0.14 },
  { w: 25, h: 144, c: "#1d5133", t: "History", d: 0.05 },
  { w: 15, h: 168, c: "#59320e", t: "Literature", d: 0.2 },
  { w: 23, h: 150, c: "#3c1e5c", t: "Geography", d: 0.09 },
  { w: 19, h: 162, c: "#194840", t: "Physics", d: 0.24 },
  { w: 27, h: 138, c: "#6a2f0e", t: "Chemistry", d: 0.07 },
  { w: 17, h: 166, c: "#491828", t: "Biology", d: 0.17 },
  { w: 21, h: 156, c: "#1b2c55", t: "English", d: 0.12 },
  { w: 15, h: 146, c: "#3e280a", t: "Computing", d: 0.22 },
  { w: 20, h: 160, c: "#193650", t: "Music", d: 0.06 },
  { w: 24, h: 142, c: "#29184c", t: "Art", d: 0.16 },
];

function Spine({ w, h, c, t, d }: (typeof BOOKS)[0]) {
  return (
    <div
      style={{
        width: w,
        height: h,
        flexShrink: 0,
        position: "relative",
        background: `linear-gradient(120deg, ${c} 0%, ${c}bb 55%, ${c}77 100%)`,
        borderRadius: "2px 1px 1px 2px",
        boxShadow: `inset -4px 0 8px rgba(0,0,0,.45), 3px 0 10px rgba(0,0,0,.6)`,
        animation: `bob 3.8s ease-in-out ${d}s infinite alternate`,
        userSelect: "none",
      }}
    >
      {/* Spine gloss */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 2,
          width: 4,
          bottom: 0,
          background:
            "linear-gradient(180deg,rgba(255,255,255,.18),transparent)",
          borderRadius: 1,
        }}
      />
      {/* Top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: "rgba(255,255,255,.1)",
          borderRadius: "2px 1px 0 0",
        }}
      />
      {/* Title */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            writingMode: "vertical-rl",
            fontSize: 7,
            fontFamily: "Georgia,serif",
            fontWeight: 600,
            color: "rgba(255,255,255,.45)",
            letterSpacing: ".12em",
            overflow: "hidden",
            maxHeight: h - 18,
          }}
        >
          {t}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DUST MOTE
═══════════════════════════════════════════ */
function Mote({
  top,
  left,
  dur,
  del,
  sz = 2.5,
}: {
  top: string;
  left: string;
  dur: number;
  del: number;
  sz?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: sz,
        height: sz,
        borderRadius: "50%",
        background: "rgba(212,168,67,.55)",
        animation: `mote ${dur}s ease-in-out ${del}s infinite alternate`,
        pointerEvents: "none",
      }}
    />
  );
}

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const ROLES = [
  {
    Icon: IconAdmin,
    role: "Administrator",
    jp: "管理者",
    accent: "#c0392b",
    glow: "rgba(192,57,43,.14)",
    border: "rgba(192,57,43,.3)",
    href: "/login",
    desc: "Full oversight of the school. Register users, approve projects, assign subjects, and monitor every corner of the platform.",
    perks: [
      "User Registration",
      "Project Approval",
      "Subject Control",
      "Platform Overview",
    ],
  },
  {
    Icon: IconTeacher,
    role: "Teacher",
    jp: "先生",
    accent: "#16a085",
    glow: "rgba(22,160,133,.14)",
    border: "rgba(22,160,133,.3)",
    href: "/login",
    desc: "Upload materials, assign projects, track student progress in real time, and post targeted announcements to your classes.",
    perks: [
      "Upload Materials",
      "Manage Projects",
      "Student Progress",
      "Announcements",
    ],
  },
  {
    Icon: IconStudent,
    role: "Student",
    jp: "学生",
    accent: "#3a86d4",
    glow: "rgba(58,134,212,.14)",
    border: "rgba(58,134,212,.3)",
    href: "/login",
    desc: "Browse your subjects, download learning materials, submit work as a draft or final, and see how classmates are progressing.",
    perks: [
      "Submit Projects",
      "Draft Mode",
      "Download Materials",
      "Classmate Progress",
    ],
  },
];

const FEATS = [
  {
    Icon: IconDashboard,
    t: "Role-Based Dashboards",
    b: "Every login reveals a personalised view — unique stats, shortcuts, and alerts built for that specific role.",
  },
  {
    Icon: IconDeadline,
    t: "5-Day Deadline Alerts",
    b: "Automatic warnings fire for teachers and students when a deadline is dangerously near and no submission exists.",
  },
  {
    Icon: IconDraft,
    t: "Draft Mode",
    b: "Students privately save progress before making an official submission. No pressure, full creative control.",
  },
  {
    Icon: IconProgress,
    t: "Progress Bars",
    b: "Submission rates per student, per subject, in one glance. Know the health of your class instantly.",
  },
  {
    Icon: IconAnnouncement,
    t: "Announcements",
    b: "Global or subject-scoped posts with read-tracking, pinning, and bold unread badge counters.",
  },
  {
    Icon: IconLock,
    t: "Secure Auth",
    b: "JWT sessions with role enforcement on every route — zero cross-role data leaks, ever.",
  },
];

const STACK = [
  { Icon: IconNextjs, n: "Next.js 14", d: "App Router + SSR" },
  { Icon: IconMongo, n: "MongoDB", d: "Mongoose ODM" },
  { Icon: IconTailwind, n: "Tailwind CSS", d: "Utility-first" },
  { Icon: IconNextAuth, n: "NextAuth.js", d: "JWT · Role sessions" },
  { Icon: IconVercel, n: "Vercel", d: "Global edge deploy" },
  { Icon: IconCloudinary, n: "Cloudinary", d: "Media & files" },
];

/* ═══════════════════════════════════════════
   PAGE
═══════════════════════════════════════════ */
export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setMounted(true);
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const solid = scrollY > 48;

  const HERO_MOTES = [
    { top: "16%", left: "8%", dur: 6, del: 0 },
    { top: "36%", left: "88%", dur: 8, del: 1.4 },
    { top: "64%", left: "4%", dur: 5, del: 2.7 },
    { top: "22%", left: "54%", dur: 7, del: 0.7 },
    { top: "78%", left: "80%", dur: 9, del: 1.1 },
    { top: "52%", left: "42%", dur: 6, del: 3.4 },
    { top: "11%", left: "76%", dur: 8, del: 0.4 },
    { top: "87%", left: "27%", dur: 6, del: 2.0 },
  ];

  return (
    <>
      {/* ─── GLOBAL CSS ────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;600;700;900&family=Share+Tech+Mono&family=Lato:wght@300;400;700&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{
          font-family:'Lato',sans-serif;
          background:#0f0904;
          color:#faf6ee;
          overflow-x:hidden;
        }

        /* Book bounce */
        @keyframes bob {
          from{transform:translateY(0)}
          to  {transform:translateY(-11px)}
        }

        /* Dust float */
        @keyframes mote {
          0%  {opacity:0;transform:translate(0,0) scale(1)}
          30% {opacity:.85}
          100%{opacity:0;transform:translate(13px,-42px) scale(.3)}
        }

        /* Hero staggered fade-up */
        @keyframes up {
          from{opacity:0;transform:translateY(26px)}
          to  {opacity:1;transform:translateY(0)}
        }

        /* Ink draw */
        @keyframes ink {
          from{stroke-dashoffset:700}
          to  {stroke-dashoffset:0}
        }

        /* Stamp */
        @keyframes stamp {
          0%  {opacity:0;transform:scale(1.6) rotate(-14deg)}
          65% {transform:scale(.95) rotate(2deg)}
          100%{opacity:1;transform:scale(1) rotate(-6deg)}
        }

        /* Shimmer pulse */
        @keyframes pulse {
          0%,100%{opacity:.38}
          50%    {opacity:.9}
        }

        /* Grow line */
        @keyframes grow {
          from{transform:scaleX(0)}
          to  {transform:scaleX(1)}
        }
        
        /* Bouncy ball — gentle idle float after entry */
        @keyframes bounce {
          0%,100% { transform: translateY(0);    animation-timing-function: cubic-bezier(.33,0,.66,0) }
          50%      { transform: translateY(-18px); animation-timing-function: cubic-bezier(.33,1,.66,1) }
        }
        @keyframes bounce2 {
          0%,100% { transform: translateY(0);    animation-timing-function: cubic-bezier(.33,0,.66,0) }
          50%      { transform: translateY(-14px); animation-timing-function: cubic-bezier(.33,1,.66,1) }
        }
        .bounce-study {
          display: block;
          animation: up .9s .3s cubic-bezier(.22,1,.36,1) both,
          bounce  2.6s 1.4s ease-in-out infinite;
        }
        .bounce-sync {
          display: block;
          animation: up .9s .3s cubic-bezier(.22,1,.36,1) both,
          bounce2 2.6s 1.85s ease-in-out infinite;
        }

        .a1{animation:up .9s .1s cubic-bezier(.22,1,.36,1) both}
        .a2{animation:up .9s .3s cubic-bezier(.22,1,.36,1) both}
        .a3{animation:up .9s .52s cubic-bezier(.22,1,.36,1) both}
        .a4{animation:up .9s .72s cubic-bezier(.22,1,.36,1) both}
        .a5{animation:up 1.1s 1.0s cubic-bezier(.22,1,.36,1) both}

        .ink-path{
          stroke-dasharray:700;
          stroke-dashoffset:700;
          animation:ink 2s 1.1s ease forwards;
        }
        .ink-path2{
          stroke-dasharray:700;
          stroke-dashoffset:700;
          animation:ink 2s 1.5s ease forwards;
        }
        .ink-path3{
          stroke-dasharray:700;
          stroke-dashoffset:700;
          animation:ink 2s 1.8s ease forwards;
        }

        .stamp-el{animation:stamp .6s 2s cubic-bezier(.3,.7,.4,1.5) both}

        /* Nav underline hover */
        .nl{
          position:relative;
          color:rgba(250,246,238,.46);
          text-decoration:none;
          font-size:.75rem;
          letter-spacing:.07em;
          font-family:'Share Tech Mono',monospace;
          transition:color .2s;
        }
        .nl::after{
          content:'';
          position:absolute;bottom:-3px;left:0;right:0;
          height:1px;background:#d4a843;
          transform:scaleX(0);transform-origin:left;
          transition:transform .22s;
        }
        .nl:hover{color:#d4a843}
        .nl:hover::after{transform:scaleX(1)}

        /* Paper lines */
        .ruled{
          background-image:repeating-linear-gradient(
            0deg,transparent,transparent 27px,
            rgba(200,184,154,.2) 28px
          );
        }

        /* Red margin rule */
        .margin-line::before{
          content:'';
          position:absolute;top:0;bottom:0;
          left:clamp(2.5rem,7vw,5.5rem);
          width:1px;
          background:rgba(192,57,43,.13);
        }

        /* Scrollbar */
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#0a0602}
        ::-webkit-scrollbar-thumb{background:rgba(212,168,67,.22);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(212,168,67,.5)}

        /* Responsive nav
           NOTE: hamburger button hides via .mobile-menu-btn — no inline display allowed on the element */
        .desktop-nav    { display: flex  !important; }
        .mobile-menu-btn{ display: none  !important; }
        .mobile-menu    { display: none  !important; }

        @media (max-width: 768px) {
          .desktop-nav    { display: none  !important; }
          .mobile-menu-btn{ display: flex  !important; }
          .mobile-menu    { display: block !important; }
        }
      `}</style>

      {/* ─── NAVBAR ──────────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 62,
          padding: "0 clamp(1.2rem,4vw,3rem)",
          display: "flex",
          alignItems: "center",
          background: solid || menuOpen ? "rgba(10,6,2,.97)" : "transparent",
          backdropFilter: solid || menuOpen ? "blur(18px)" : "none",
          borderBottom:
            solid || menuOpen
              ? "1px solid rgba(212,168,67,.1)"
              : "1px solid transparent",
          transition: "background .4s, border-color .4s",
        }}
      >
        {/* ── Logo ── */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Logo image placeholder — replace src with your actual logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* LOGO PLACEHOLDER — swap the <svg> below with <img src="/logo.png" /> */}
            <Image
              src="/Image_Logo.png"
              alt="Logo"
              width={70}
              height={70}
              style={{ objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              fontFamily: "Noto Serif JP,serif",
              fontWeight: 900,
              fontSize: "1.12rem",
              color: "#faf6ee",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              <span
                style={{
                  fontFamily: "Noto Serif JP,serif",
                  fontWeight: 900,
                  fontSize: "1.18rem",
                  color: "#faf6ee",
                  letterSpacing: "-.01em",
                }}
              >
                Study
              </span>
              <span
                style={{
                  fontFamily: "Noto Serif JP,serif",
                  display: "block",
                color: "transparent",
                WebkitTextStroke: "2px #d4a843",
                textShadow: "0 0 100px rgba(212,168,67,.12)",
                }}
              >
                Sync
              </span>
            </div>
            <span
              style={{
                fontFamily: "Share Tech Mono",
                fontSize: ".44rem",
                color: "rgba(212,168,67,.32)",
                border: "1px solid rgba(212,168,67,.16)",
                padding: "1px 4px",
              }}
            >
              LMS
            </span>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
          className="desktop-nav"
        >
          <a href="#features" className="nl">
            Features
          </a>
          <a href="#roles" className="nl">
            Roles
          </a>
          <a href="#stack" className="nl">
            Stack
          </a>
          {/* Search */}
          <div className="desktop-nav">
            <LandingSearch />
          </div>
          <Link
            href="/login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              height: "36px",
              padding: "0 1.6rem",
              background: "linear-gradient(135deg,#d4a843,#b8882a)",
              color: "#1a1209",
              fontWeight: 700,
              fontSize: ".7rem",
              letterSpacing: ".16em",
              textTransform: "uppercase",
              fontFamily: "Share Tech Mono",
              borderRadius: 3,
              boxShadow: "0 2px 18px rgba(212,168,67,.22)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "transform .2s, box-shadow .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 28px rgba(212,168,67,.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "0 2px 18px rgba(212,168,67,.22)";
            }}
          >
            Sign In
            <IconSignIn size={13} />{" "}
          </Link>
        </nav>

        {/* ── Mobile hamburger button — hidden on desktop, shown on mobile via CSS class ── */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            flexDirection: "column",
            gap: 5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: menuOpen ? "#d4a843" : "rgba(250,246,238,.7)",
              borderRadius: 2,
              transition: "all .3s",
              transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none",
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: "rgba(250,246,238,.7)",
              borderRadius: 2,
              transition: "all .3s",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: menuOpen ? "#d4a843" : "rgba(250,246,238,.7)",
              borderRadius: 2,
              transition: "all .3s",
              transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </header>

      {/* ── Mobile dropdown menu ── */}
      <div
        style={{
          position: "fixed",
          top: 62,
          left: 0,
          right: 0,
          zIndex: 99,
          background: "rgba(10,6,2,.97)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(212,168,67,.12)",
          overflow: "hidden",
          maxHeight: menuOpen ? "280px" : "0px",
          transition: "max-height .4s cubic-bezier(.22,1,.36,1)",
        }}
        className="mobile-menu"
      >
        <nav
          style={{
            padding: "1rem clamp(1.2rem,4vw,3rem) 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Search bar — mobile only */}
          <div style={{ marginBottom: "0.5rem" }}>
            <LandingSearch />
          </div>
          {[
            { href: "#features", label: "Features" },
            { href: "#roles", label: "Roles" },
            { href: "#stack", label: "Stack" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: "rgba(250,246,238,.55)",
                textDecoration: "none",
                fontFamily: "Share Tech Mono,monospace",
                fontSize: ".8rem",
                letterSpacing: ".12em",
                textTransform: "uppercase",
                padding: ".75rem 0",
                borderBottom: "1px solid rgba(212,168,67,.07)",
                transition: "color .2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#d4a843";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(250,246,238,.55)";
              }}
            >
              {item.label}
              <IconArrowRight size={14} />
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: ".75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "linear-gradient(135deg,#d4a843,#b8882a)",
              color: "#1a1209",
              fontWeight: 700,
              fontSize: ".72rem",
              letterSpacing: ".14em",
              textTransform: "uppercase",
              fontFamily: "Share Tech Mono",
              padding: ".8rem",
              borderRadius: 2,
              boxShadow: "0 2px 18px rgba(212,168,67,.22)",
              textDecoration: "none",
            }}
          >
            <IconEnterLibrary size={18} /> Sign In → Enter the Library
          </Link>
        </nav>
      </div>

      {/* ─── HERO ─────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "110px clamp(1.5rem,5vw,3rem) 60px",
          position: "relative",
          overflow: "hidden",
          background: `
          radial-gradient(ellipse 80% 65% at 50% 28%, rgba(36,18,7,.97) 0%,transparent 70%),
          radial-gradient(ellipse 100% 50% at 50% 100%, rgba(10,6,2,1) 0%,transparent 55%),
          linear-gradient(162deg,#1c1108 0%,#201408 38%,#111b27 100%)
        `,
        }}
      >
        {/* Paper lines */}
        <div
          className="ruled"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        {/* Decorative ink SVG — top right */}
        <svg
          viewBox="0 0 280 280"
          style={{
            position: "absolute",
            top: "6%",
            right: "3%",
            width: 260,
            opacity: 0.09,
            pointerEvents: "none",
          }}
        >
          <circle
            cx="140"
            cy="140"
            r="118"
            fill="none"
            stroke="#d4a843"
            strokeWidth="1.3"
            strokeDasharray="8 6"
            className="ink-path"
          />
          <circle
            cx="140"
            cy="140"
            r="84"
            fill="none"
            stroke="#d4a843"
            strokeWidth=".7"
            strokeDasharray="4 9"
            className="ink-path2"
          />
          <line
            x1="36"
            y1="140"
            x2="244"
            y2="140"
            stroke="#d4a843"
            strokeWidth=".6"
            opacity=".5"
            className="ink-path3"
          />
          <line
            x1="140"
            y1="36"
            x2="140"
            y2="244"
            stroke="#d4a843"
            strokeWidth=".6"
            opacity=".5"
            className="ink-path3"
          />
        </svg>

        {/* Small ink circle — bottom left */}
        <svg
          viewBox="0 0 160 160"
          style={{
            position: "absolute",
            bottom: "15%",
            left: "-1%",
            width: 150,
            opacity: 0.07,
            pointerEvents: "none",
          }}
        >
          <circle
            cx="80"
            cy="80"
            r="66"
            fill="none"
            stroke="#d4a843"
            strokeWidth="1"
            strokeDasharray="5 8"
            className="ink-path2"
          />
        </svg>

        {/* Dust motes */}
        {mounted && HERO_MOTES.map((m, i) => <Mote key={i} {...m} />)}

        {/* Approval stamp */}
        <div
          className="stamp-el"
          style={{
            position: "absolute",
            top: "19%",
            left: "5.5%",
            border: "2px solid rgba(192,57,43,.42)",
            color: "rgba(192,57,43,.42)",
            fontFamily: "Noto Serif JP,serif",
            padding: ".5rem .9rem",
            transform: "rotate(-7deg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>APPROVED</span>
          <span
            style={{
              fontSize: ".46rem",
              letterSpacing: ".32em",
              fontFamily: "Share Tech Mono",
            }}
          >
           2026
          </span>
        </div>

        {/* ── HERO TEXT ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 840,
          }}
        >
          <p
            className="a1"
            style={{
              fontFamily: "Share Tech Mono",
              fontSize: ".6rem",
              letterSpacing: ".46em",
              color: "rgba(212,168,67,.5)",
              textTransform: "uppercase",
              marginBottom: "1.9rem",
            }}
          >
            Secondary School Learning Platform
          </p>

          {/* Giant logotype */}
          <h1
            className="a2"
            style={{
              fontFamily: "Noto Serif JP,Georgia,serif",
              fontWeight: 900,
              fontSize: "clamp(3.8rem,13vw,9.5rem)",
              lineHeight: 0.87,
              letterSpacing: "-.025em",
              marginBottom: "1.6rem",
            }}
          >
            <Image
              src="/Image_Logo.png"
              alt="StudySync Crest"
              width={110}
              height={110}
              style={{
                objectFit:'contain', flexShrink:0,
                filter:'drop-shadow(0 0 32px rgba(212,168,67,.35))',
                width:'clamp(56px,10vw,110px)', height:'auto', marginRight:'0.12em',
                alignItems:'center', justifyContent:'center', display:'inline-flex',
              }}
            />
            <span
              className="bounce-study"
              style={{ color: "#faf6ee", display: "block" }}
            >
              Study
            </span>
            <span
              className="bounce-sync"
              style={{
                display: "block",
                color: "transparent",
                WebkitTextStroke: "2px #d4a843",
                textShadow: "0 0 100px rgba(212,168,67,.12)",
              }}
            >
              Sync
            </span>
          </h1>

          {/* Ornamental rule */}
          <div
            className="a2"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              marginBottom: "1.9rem",
            }}
          >
            <div
              style={{
                width: 90,
                height: 1,
                background: "rgba(212,168,67,.28)",
                transformOrigin: "right",
                animation: "grow 1.2s 1.1s ease both",
              }}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              style={{ opacity: 0.55, flexShrink: 0 }}
            >
              <circle cx="9" cy="9" r="2.8" fill="#d4a843" />
              <circle
                cx="9"
                cy="9"
                r="6"
                fill="none"
                stroke="#d4a843"
                strokeWidth=".8"
              />
              <circle
                cx="9"
                cy="9"
                r="8.5"
                fill="none"
                stroke="#d4a843"
                strokeWidth=".4"
                strokeDasharray="2 3"
              />
            </svg>
            <div
              style={{
                width: 90,
                height: 1,
                background: "rgba(212,168,67,.28)",
                transformOrigin: "left",
                animation: "grow 1.2s 1.1s ease both",
              }}
            />
          </div>

          <p
            className="a3"
            style={{
              color: "rgba(250,246,238,.5)",
              fontSize: "clamp(.9rem,2vw,1.07rem)",
              lineHeight: 1.9,
              maxWidth: 570,
              margin: "0 auto 2.8rem",
              fontWeight: 300,
            }}
          >
            A unified school management platform for{" "}
            <span style={{ color: "#e05040", fontWeight: 700 }}>
              administrators
            </span>
            ,{" "}
            <span style={{ color: "#1ec4b0", fontWeight: 700 }}>teachers</span>{" "}
            and{" "}
            <span style={{ color: "#5aabf0", fontWeight: 700 }}>students</span>{" "}
            — one login routes you directly to your personalised dashboard.
          </p>

          {/* CTAs */}
          <div
            className="a4"
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Primary */}
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background:
                  "linear-gradient(140deg,#d4a843 0%,#c09030 55%,#a87c28 100%)",
                color: "#1a1209",
                fontWeight: 800,
                fontSize: ".9rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontFamily: "Noto Serif JP,serif",
                padding: "1rem 3rem",
                borderRadius: 2,
                textDecoration: "none",
                boxShadow:
                  "4px 4px 0 rgba(212,168,67,.2), 0 12px 44px rgba(212,168,67,.16)",
                transition: "all .25s cubic-bezier(.22,1,.36,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-3px,-3px)";
                e.currentTarget.style.boxShadow =
                  "8px 8px 0 rgba(212,168,67,.24), 0 22px 55px rgba(212,168,67,.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "4px 4px 0 rgba(212,168,67,.2), 0 12px 44px rgba(212,168,67,.16)";
              }}
            >
              <IconEnterLibrary size={20} /> Enter the Library
            </Link>

            {/* Secondary */}
            <a
              href="#roles"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid rgba(212,168,67,.3)",
                color: "rgba(250,246,238,.56)",
                fontWeight: 400,
                fontSize: ".86rem",
                letterSpacing: ".05em",
                padding: "1rem 2rem",
                borderRadius: 2,
                textDecoration: "none",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,168,67,.65)";
                e.currentTarget.style.color = "#d4a843";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,168,67,.3)";
                e.currentTarget.style.color = "rgba(250,246,238,.56)";
              }}
            >
              Explore Roles <IconArrowDown size={14} />
            </a>
          </div>
        </div>

        {/* ── BOOKSHELF ── */}
        <div
          className="a5"
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 72,
            width: "100%",
            maxWidth: 490,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 3,
              paddingBottom: 13,
              position: "relative",
            }}
          >
            {BOOKS.map((b, i) => (
              <Spine key={i} {...b} />
            ))}
            {/* Plank */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: -30,
                right: -30,
                height: 14,
                background:
                  "linear-gradient(180deg,#4c3018 0%,#2c1a09 45%,#170d04 100%)",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06)",
                borderRadius: 1,
              }}
            />
          </div>
          {/* Ground shadow */}
          <div
            style={{
              height: 8,
              margin: "0 12px",
              background:
                "radial-gradient(ellipse at 50% 0%,rgba(0,0,0,.6) 0%,transparent 80%)",
            }}
          />
        </div>

        {/* Scroll cue */}
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
            animation: "pulse 2s infinite",
          }}
        >
          <span
            style={{
              fontFamily: "Share Tech Mono",
              fontSize: ".5rem",
              letterSpacing: ".38em",
              color: "rgba(212,168,67,.3)",
            }}
          >
            SCROLL
          </span>
          <div
            style={{
              width: 1,
              height: 38,
              background:
                "linear-gradient(180deg,rgba(212,168,67,.38),transparent)",
            }}
          />
        </div>
      </section>

      {/* ─── STATS BAND ───────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg,#d4a843,#be943a 50%,#a87e2e)",
          padding: "2.8rem clamp(1.5rem,5vw,3.5rem)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Crosshatch texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.055,
            backgroundImage:
              "repeating-linear-gradient(45deg,#1a1209 0,#1a1209 1px,transparent 0,transparent 50%)",
            backgroundSize: "10px 10px",
          }}
        />
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "1.5rem",
          }}
        >
          {[
            {
              v: "3",
              l: "User Roles",
              
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="8" cy="9" r="3.5" fill="#1a1209" opacity="0.35" />
                  <circle
                    cx="16"
                    cy="9"
                    r="3.5"
                    fill="#1a1209"
                    opacity="0.25"
                  />
                  <path
                    d="M2 19 Q2 14 8 14 Q12 14 12 16 Q12 14 16 14 Q22 14 22 19"
                    stroke="#1a1209"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </svg>
              ),
            },
            {
              v: "6",
              l: "Core Modules",
              
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="#1a1209"
                    opacity="0.35"
                  />
                  <rect
                    x="13"
                    y="3"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="#1a1209"
                    opacity="0.25"
                  />
                  <rect
                    x="3"
                    y="13"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="#1a1209"
                    opacity="0.25"
                  />
                  <rect
                    x="13"
                    y="13"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="#1a1209"
                    opacity="0.35"
                  />
                </svg>
              ),
            },
            {
              v: "∞",
              l: "Subjects",
              
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12 Q4 6 8 6 Q12 6 12 12 Q12 18 16 18 Q20 18 20 12"
                    stroke="#1a1209"
                    strokeWidth="2.2"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </svg>
              ),
            },
            {
              v: "100%",
              l: "Web-Based",
              
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="#1a1209"
                    strokeWidth="1.8"
                    opacity="0.35"
                    fill="none"
                  />
                  <ellipse
                    cx="12"
                    cy="12"
                    rx="4"
                    ry="8.5"
                    stroke="#1a1209"
                    strokeWidth="1.2"
                    opacity="0.25"
                    fill="none"
                  />
                  <line
                    x1="3.5"
                    y1="12"
                    x2="20.5"
                    y2="12"
                    stroke="#1a1209"
                    strokeWidth="1.2"
                    opacity="0.3"
                  />
                </svg>
              ),
            },
          ].map((s, i) => (
            <Rise key={i} d={i * 0.09}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "Noto Serif JP,serif",
                    fontWeight: 900,
                    fontSize: "clamp(2rem,5vw,2.8rem)",
                    color: "#1a1209",
                    lineHeight: 1,
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: ".7rem",
                    color: "rgba(26,18,9,.62)",
                    letterSpacing: ".1em",
                    marginTop: 4,
                  }}
                >
                  {s.l}
                </div>
                <div
                  style={{
                    fontFamily: "Share Tech Mono",
                    fontSize: ".55rem",
                    color: "rgba(26,18,9,.36)",
                    letterSpacing: ".22em",
                    marginTop: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    display: "flex",
                  }}
                >
                  {s.icon}
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────── */}
      <section
        id="features"
        style={{
          background: "#faf6ee",
          padding: "7rem clamp(1.5rem,5vw,3.5rem)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="ruled margin-line"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Rise style={{ textAlign: "center", marginBottom: "5rem" }}>
           
            <h2
              style={{
                fontFamily: "Noto Serif JP,serif",
                fontWeight: 900,
                fontSize: "clamp(2rem,5vw,3.2rem)",
                color: "#1a1209",
                marginTop: ".55rem",
                lineHeight: 1.15,
              }}
            >
              Everything your school needs,
              <br />
              <span style={{ color: "#c0392b" }}>in one place.</span>
            </h2>
          </Rise>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(295px,1fr))",
              gap: "1.2rem",
            }}
          >
            {FEATS.map((f, i) => (
              <Rise key={i} d={i * 0.07}>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #c8b89a",
                    borderRadius: 2,
                    padding: "1.7rem",
                    boxShadow: "3px 3px 0 #c8b89a",
                    height: "100%",
                    transition:
                      "transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translate(-3px,-3px)";
                    el.style.boxShadow = "6px 6px 0 #c8b89a";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "";
                    el.style.boxShadow = "3px 3px 0 #c8b89a";
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      marginBottom: ".9rem",
                      lineHeight: 1,
                    }}
                  >
                    <f.Icon size={32} />
                  </div>
                  <div
                    style={{
                      fontFamily: "Noto Serif JP,serif",
                      fontWeight: 700,
                      fontSize: ".97rem",
                      color: "#1a1209",
                      marginBottom: ".5rem",
                    }}
                  >
                    {f.t}
                  </div>
                  <p
                    style={{
                      fontSize: ".81rem",
                      color: "#7a6a52",
                      lineHeight: 1.8,
                    }}
                  >
                    {f.b}
                  </p>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ────────────────────────────────────── */}
      <section
        id="roles"
        style={{
          background: "linear-gradient(162deg,#190f07 0%,#0c1520 100%)",
          padding: "7rem clamp(1.5rem,5vw,3.5rem)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(212,168,67,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,67,.03) 1px,transparent 1px)",
            backgroundSize: "58px 58px",
          }}
        />

        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Rise style={{ textAlign: "center", marginBottom: "5rem" }}>
            
            <h2
              style={{
                fontFamily: "Noto Serif JP,serif",
                fontWeight: 900,
                fontSize: "clamp(2rem,5vw,3.2rem)",
                color: "#faf6ee",
                marginTop: ".55rem",
                lineHeight: 1.15,
              }}
            >
              Three roles.
              <br />
              <span style={{ color: "#d4a843" }}>One system.</span>
            </h2>
          </Rise>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(298px,1fr))",
              gap: "1.5rem",
            }}
          >
            {ROLES.map((r, i) => (
              <Rise key={i} d={i * 0.14} style={{ display: "flex" }}>
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    background: "rgba(255,255,255,.02)",
                    border: `1px solid ${r.border}`,
                    borderRadius: 2,
                    padding: "2rem",
                    boxShadow: `3px 3px 0 rgba(0,0,0,.42), 0 0 50px ${r.glow}`,
                    transition:
                      "transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(-7px)";
                    el.style.boxShadow = `5px 10px 0 rgba(0,0,0,.5), 0 0 70px ${r.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "";
                    el.style.boxShadow = `3px 3px 0 rgba(0,0,0,.42), 0 0 50px ${r.glow}`;
                  }}
                >
                  {/* Accent top bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: r.accent,
                    }}
                  />

                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      marginBottom: "1.4rem",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        flexShrink: 0,
                        borderRadius: 2,
                        background: r.glow,
                        border: `1px solid ${r.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.65rem",
                      }}
                    >
                      <r.Icon size={36} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "Noto Serif JP,serif",
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          color: "#faf6ee",
                        }}
                      >
                        {r.role}
                      </div>
                      <div
                        style={{
                          fontFamily: "Share Tech Mono",
                          fontSize: ".6rem",
                          color: r.accent,
                          letterSpacing: ".24em",
                          marginTop: 2,
                        }}
                      >
                        
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: ".81rem",
                      color: "rgba(250,246,238,.5)",
                      lineHeight: 1.84,
                      marginBottom: "1.4rem",
                    }}
                  >
                    {r.desc}
                  </p>

                  {/* Perk tags */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: "1.8rem",
                    }}
                  >
                    {r.perks.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontFamily: "Share Tech Mono",
                          fontSize: ".56rem",
                          letterSpacing: ".05em",
                          padding: ".22rem .68rem",
                          borderRadius: 1,
                          border: `1px solid ${r.border}`,
                          color: r.accent,
                          background: r.glow,
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href={r.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",

                      marginTop: "auto",
                      padding: ".72rem",
                      borderRadius: 2,
                      border: `1px solid ${r.border}`,
                      color: r.accent,
                      fontSize: ".7rem",
                      fontWeight: 700,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      fontFamily: "Share Tech Mono",
                      textDecoration: "none",

                      transition: "background .2s, transform .18s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = r.glow;
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "";
                    }}
                  >
                    <span>Sign in as {r.role}</span>
                    <IconArrowRight size={12} />
                  </Link>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STACK ────────────────────────────────────── */}
      <section
        id="stack"
        style={{
          background: "#f0e9d6",
          padding: "7rem clamp(1.5rem,5vw,3.5rem)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="ruled margin-line"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        <div
          style={{
            maxWidth: 1020,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "5rem",
              alignItems: "center",
            }}
          >
            <Rise>
              
              <h2
                style={{
                  fontFamily: "Noto Serif JP,serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.8rem,4vw,2.8rem)",
                  color: "#1a1209",
                  marginTop: ".55rem",
                  marginBottom: "1.2rem",
                  lineHeight: 1.2,
                }}
              >
                Built for speed,
                <br />
                <span style={{ color: "#c0392b" }}>built to last.</span>
              </h2>
              <p
                style={{
                  color: "#7a6a52",
                  fontSize: ".87rem",
                  lineHeight: 1.9,
                  marginBottom: "2rem",
                  fontWeight: 300,
                }}
              >
                StudySync runs on a production-grade modern stack. No
                installation needed — just a browser. Fast, secure, and deployed
                globally on edge infrastructure.
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#1a1209",
                  color: "#d4a843",
                  fontWeight: 700,
                  fontSize: ".75rem",
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  fontFamily: "Share Tech Mono",
                  padding: ".9rem 2.2rem",
                  borderRadius: 2,
                  textDecoration: "none",
                  border: "1px solid rgba(212,168,67,.28)",
                  boxShadow: "4px 4px 0 rgba(26,18,9,.16)",
                  transition: "all .25s cubic-bezier(.22,1,.36,1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-3px,-3px)";
                  e.currentTarget.style.boxShadow =
                    "7px 7px 0 rgba(26,18,9,.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow =
                    "4px 4px 0 rgba(26,18,9,.16)";
                }}
              >
                <IconGraduate size={16} /> Access Dashboard
              </Link>
            </Rise>

            <Rise d={0.18}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: ".85rem",
                }}
              >
                {STACK.map((t) => (
                  <div
                    key={t.n}
                    style={{
                      background: "#fff",
                      border: "1px solid #c8b89a",
                      borderRadius: 2,
                      padding: "1rem 1.1rem",
                      boxShadow: "2px 2px 0 #c8b89a",
                      transition: "transform .2s,box-shadow .2s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "translate(-2px,-2px)";
                      el.style.boxShadow = "4px 4px 0 #c8b89a";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "";
                      el.style.boxShadow = "2px 2px 0 #c8b89a";
                    }}
                  >
                    <div style={{ fontSize: "1.2rem", marginBottom: ".35rem" }}>
                      <t.Icon size={26} />
                    </div>
                    <div
                      style={{
                        fontFamily: "Noto Serif JP,serif",
                        fontWeight: 700,
                        fontSize: ".82rem",
                        color: "#1a1209",
                      }}
                    >
                      {t.n}
                    </div>
                    <div
                      style={{
                        fontFamily: "Share Tech Mono",
                        fontSize: ".6rem",
                        color: "#7a6a52",
                        marginTop: 2,
                      }}
                    >
                      {t.d}
                    </div>
                  </div>
                ))}
              </div>
            </Rise>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(162deg,#1a1108 0%,#0c1520 100%)",
          padding: "9rem clamp(1.5rem,5vw,3.5rem)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Giant kanji watermark */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Noto Serif JP,serif",
            fontWeight: 900,
            fontSize: "clamp(14rem,40vw,30rem)",
            color: "rgba(212,168,67,.022)",
            userSelect: "none",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          学
        </div>

        {/* Dust in CTA */}
        {mounted &&
          [
            { top: "22%", left: "13%", dur: 7, del: 0.5, sz: 3 },
            { top: "70%", left: "83%", dur: 9, del: 1.2, sz: 2 },
            { top: "42%", left: "91%", dur: 6, del: 2.0, sz: 2.5 },
            { top: "78%", left: "17%", dur: 8, del: 0.8, sz: 2 },
          ].map((m, i) => <Mote key={i} {...m} />)}

        <Rise style={{ position: "relative", zIndex: 1 }}>
          <span
            style={{
              fontFamily: "Share Tech Mono",
              fontSize: ".58rem",
              letterSpacing: ".44em",
              color: "rgba(212,168,67,.4)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "1.5rem",
            }}
          >
            Ready to begin?
          </span>
          <h2
            style={{
              fontFamily: "Noto Serif JP,serif",
              fontWeight: 900,
              fontSize: "clamp(2.5rem,8vw,5.5rem)",
              color: "#faf6ee",
              lineHeight: 1,
              marginBottom: "1.5rem",
            }}
          >
            Open the library.
            <br />
            <span style={{ color: "#d4a843" }}>Start learning.</span>
          </h2>
          <p
            style={{
              color: "rgba(250,246,238,.34)",
              fontSize: ".9rem",
              lineHeight: 1.88,
              maxWidth: 470,
              margin: "0 auto 3rem",
              fontWeight: 300,
            }}
          >
            Sign in with your school credentials. Every role lands automatically
            on its own personalised dashboard — no manual routing needed.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background:
                "linear-gradient(140deg,#d4a843 0%,#c09030 55%,#a87c28 100%)",
              color: "#1a1209",
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              fontFamily: "Noto Serif JP,serif",
              padding: "1.15rem 3.4rem",
              borderRadius: 2,
              textDecoration: "none",
              boxShadow:
                "5px 5px 0 rgba(212,168,67,.17), 0 18px 55px rgba(212,168,67,.13)",
              transition: "all .28s cubic-bezier(.22,1,.36,1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-4px,-4px)";
              e.currentTarget.style.boxShadow =
                "9px 9px 0 rgba(212,168,67,.22), 0 28px 65px rgba(212,168,67,.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "5px 5px 0 rgba(212,168,67,.17), 0 18px 55px rgba(212,168,67,.13)";
            }}
          >
            <IconEnterLibrary size={22} /> Enter StudySync
          </Link>
        </Rise>
      </section>

      {/* ─── FOOTER ───────────────────────────────────── */}
      <footer
        style={{
          background: "#080503",
          borderTop: "1px solid rgba(212,168,67,.09)",
          padding: "1.8rem clamp(1.5rem,5vw,3.5rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div
          style={{
            fontFamily: "Noto Serif JP,serif",
            fontWeight: 900,
            fontSize: "1rem",
            color: "#faf6ee",
          }}
        >
          Study<span style={{
                  fontFamily: "Noto Serif JP,serif",
                  color: "transparent",
                  WebkitTextStroke: "2px #d4a843",
                  textShadow: "0 0 100px rgba(212,168,67,.12)",
                  }}>Sync</span>
        </div>
        <div
          style={{
            fontFamily: "Share Tech Mono",
            fontSize: ".65rem",
            color: "rgba(250, 246, 238, 0.57)",
            letterSpacing: ".2em",
          }}
        >
          © 2026 STUDYSYNC · SECONDARY SCHOOL LMS
        </div>
        <Link
          href="/login"
          style={{
            fontFamily: "Share Tech Mono",
            fontSize: ".9rem",
            letterSpacing: ".16em",
            color: "rgba(212,168,67,.38)",
            textDecoration: "none",
            textTransform: "uppercase",
            transition: "color .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#d4a843";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(212,168,67,.38)";
          }}
        >
          Sign In →
        </Link>
      </footer>
    </>
  );
}
