/**
 * NavIcons.tsx — Anime-style SVG icon set
 * Sharp geometry, expressive silhouettes, clean structural lines.
 * Used across Admin / Teacher / Student sidebar layouts.
 */

type IconProps = { color?: string; size?: number }

// ── DASHBOARD — Torii gate (鳥居) ────────────────────────────────────────────
export function IconDashboard({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* Main top crossbar — overhangs pillars */}
      <rect x="0.5" y="3.5" width="19" height="2.2" rx="0.4" fill={color} />
      {/* Second crossbar — between pillars */}
      <rect x="3.5" y="7"   width="13" height="1.6" rx="0.3" fill={color} opacity="0.6" />
      {/* Left pillar */}
      <rect x="4"   y="7"   width="2.2" height="10" rx="0.4" fill={color} />
      {/* Right pillar */}
      <rect x="13.8" y="7"  width="2.2" height="10" rx="0.4" fill={color} />
      {/* Finial cap above centre */}
      <rect x="9"   y="1"   width="2"   height="3"  rx="0.4" fill={color} opacity="0.5" />
    </svg>
  )
}

// ── Users — two stylised silhouettes ────────────────────────────────────────
export function IconUsers({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* front person head */}
      <circle cx="8" cy="6" r="2.8" fill={color}/>
      {/* front person body */}
      <path d="M2 17 Q2 12 8 12 Q14 12 14 17" fill={color}/>
      {/* back person head */}
      <circle cx="14" cy="5.5" r="2.2" fill={color} opacity="0.45"/>
      {/* back person body */}
      <path d="M10 16.5 Q10.5 13 14 13 Q18 13 18 16.5" fill={color} opacity="0.45"/>
    </svg>
  )
}

// ── Subjects — three book spines (manga shelf) ──────────────────────────────
export function IconSubjects({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* book 1 — tall */}
      <rect x="2"  y="3" width="4" height="14" rx="0.8" fill={color}/>
      {/* book 1 spine line */}
      <rect x="2"  y="3" width="1.2" height="14" rx="0.4" fill={color} opacity="0.4"/>
      {/* book 2 — medium */}
      <rect x="7.5" y="5" width="4" height="12" rx="0.8" fill={color} opacity="0.7"/>
      <rect x="7.5" y="5" width="1.2" height="12" rx="0.4" fill={color} opacity="0.3"/>
      {/* book 3 — short */}
      <rect x="13" y="7" width="4.5" height="10" rx="0.8" fill={color} opacity="0.5"/>
      <rect x="13" y="7" width="1.2" height="10" rx="0.4" fill={color} opacity="0.2"/>
      {/* shelf */}
      <rect x="1" y="17" width="18" height="1.2" rx="0.4" fill={color} opacity="0.5"/>
    </svg>
  )
}

// ── Students / Graduate — mortarboard ───────────────────────────────────────
export function IconStudents({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* board */}
      <path d="M10 4 L19 8 L10 12 L1 8 Z" fill={color}/>
      {/* cap centre dot */}
      <circle cx="10" cy="8" r="1.5" fill={color} opacity="0.4"/>
      {/* left side of gown collar */}
      <path d="M4 9.5 Q4 15.5 10 16.5 Q16 15.5 16 9.5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {/* tassel line */}
      <line x1="19" y1="8" x2="19" y2="13" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      {/* tassel bob */}
      <circle cx="19" cy="13.5" r="1" fill={color}/>
    </svg>
  )
}

// ── Projects — folder with document corner fold ──────────────────────────────
export function IconProjects({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* folder back */}
      <path d="M1 7 Q1 5.5 2.5 5.5 L7.5 5.5 L9 7 L18 7 Q19 7 19 8 L19 16.5 Q19 17.5 18 17.5 L2 17.5 Q1 17.5 1 16.5 Z" fill={color} opacity="0.25"/>
      {/* folder front face */}
      <path d="M1 8.5 L19 8.5 L19 16.5 Q19 17.5 18 17.5 L2 17.5 Q1 17.5 1 16.5 Z" fill={color} opacity="0.6"/>
      {/* document inside */}
      <rect x="6" y="10.5" width="8" height="5" rx="0.6" fill={color} opacity="0.9"/>
      {/* fold corner */}
      <path d="M12 10.5 L14 10.5 L14 12.5 Z" fill={color} opacity="0.4"/>
      {/* lines on doc */}
      <line x1="7.5" y1="13" x2="11" y2="13" stroke={color} strokeWidth="0.8" opacity="0.4"/>
      <line x1="7.5" y1="14.5" x2="10" y2="14.5" stroke={color} strokeWidth="0.8" opacity="0.4"/>
    </svg>
  )
}

// ── Reports — bar chart with upward trend line ──────────────────────────────
export function IconReports({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* bars */}
      <rect x="2"  y="12" width="3.5" height="6" rx="0.6" fill={color} opacity="0.45"/>
      <rect x="7"  y="8"  width="3.5" height="10" rx="0.6" fill={color} opacity="0.65"/>
      <rect x="12" y="5"  width="3.5" height="13" rx="0.6" fill={color} opacity="0.85"/>
      {/* trend line */}
      <polyline points="3.75,11 8.75,7 13.75,4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* trend dot */}
      <circle cx="13.75" cy="4" r="1.5" fill={color}/>
      {/* baseline */}
      <line x1="1" y1="18.5" x2="19" y2="18.5" stroke={color} strokeWidth="1" opacity="0.35"/>
    </svg>
  )
}

// ── Profile / Settings — angular gear ───────────────────────────────────────
export function IconProfile({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* outer gear ring */}
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth="1.6" fill="none"/>
      {/* inner hub */}
      <circle cx="10" cy="10" r="2.8" fill={color}/>
      {/* gear teeth — 6 teeth */}
      {[0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180
        const x1 = 10 + 7.5 * Math.cos(rad)
        const y1 = 10 + 7.5 * Math.sin(rad)
        const x2 = 10 + 9.8 * Math.cos(rad)
        const y2 = 10 + 9.8 * Math.sin(rad)
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.4" strokeLinecap="square"/>
      })}
    </svg>
  )
}

// ── Announcements — megaphone with waves ────────────────────────────────────
export function IconAnnouncements({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* cone body */}
      <path d="M2 7.5 L2 12.5 L5 12.5 L14 16 L14 4 L5 7.5 Z" fill={color} opacity="0.7"/>
      {/* speaker box */}
      <rect x="2" y="7.5" width="3" height="5" rx="0.5" fill={color}/>
      {/* stand / handle */}
      <line x1="5" y1="12.5" x2="5" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {/* sound waves */}
      <path d="M16 7 Q18 10 16 13" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M15 8.5 Q16.5 10 15 11.5" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4"/>
    </svg>
  )
}

// ── Home — angular house silhouette ─────────────────────────────────────────
export function IconHome({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* roof */}
      <path d="M10 2 L19 10 L17 10 L17 18 L3 18 L3 10 L1 10 Z" fill={color} opacity="0.25"/>
      {/* front wall */}
      <path d="M3 10 L17 10 L17 18 L3 18 Z" fill={color} opacity="0.5"/>
      {/* roof outline */}
      <path d="M10 2 L19 10 L1 10 Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
      {/* door */}
      <rect x="8" y="12" width="4" height="6" rx="0.5" fill={color} opacity="0.9"/>
      {/* window */}
      <rect x="4" y="11.5" width="2.5" height="2.5" rx="0.4" fill={color} opacity="0.6"/>
      <rect x="13.5" y="11.5" width="2.5" height="2.5" rx="0.4" fill={color} opacity="0.6"/>
    </svg>
  )
}

// ── Classmates — 3 figures ───────────────────────────────────────────────────
export function IconClassmates({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* center person */}
      <circle cx="10" cy="6" r="2.5" fill={color}/>
      <path d="M5 18 Q5 13 10 13 Q15 13 15 18" fill={color}/>
      {/* left person */}
      <circle cx="4" cy="7" r="2" fill={color} opacity="0.5"/>
      <path d="M1 17.5 Q1 13.5 4 13.5 Q6.5 13.5 7 15" stroke={color} strokeWidth="1.4" fill="none" opacity="0.5"/>
      {/* right person */}
      <circle cx="16" cy="7" r="2" fill={color} opacity="0.5"/>
      <path d="M19 17.5 Q19 13.5 16 13.5 Q13.5 13.5 13 15" stroke={color} strokeWidth="1.4" fill="none" opacity="0.5"/>
    </svg>
  )
}

// ── Sign Out — power ring with slash ────────────────────────────────────────
export function IconSignOut({ color = 'currentColor', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* ring arc */}
      <path d="M6.5 5 A7 7 0 1 0 13.5 5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* top line */}
      <line x1="10" y1="2" x2="10" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ── Hamburger menu — three lines ─────────────────────────────────────────────
export function IconMenu({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="2" y1="5"  x2="18" y2="5"  stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="2" y1="10" x2="18" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="2" y1="15" x2="18" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// ── Close X ──────────────────────────────────────────────────────────────────
export function IconClose({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="4" y1="4" x2="16" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="4" x2="4" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════
//  ACTION / UI ICONS  (buttons, arrows, status, modals)
// ════════════════════════════════════════════════════════════════════

// ── Arrow left — back button ─────────────────────────────────────────────────
export function IconArrowLeft({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <line x1="13" y1="8" x2="3" y2="8" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <polyline points="7,4 3,8 7,12" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// ── Arrow right — forward / review ───────────────────────────────────────────
export function IconArrowRight({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <line x1="3" y1="8" x2="13" y2="8" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <polyline points="9,4 13,8 9,12" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// ── Trash — delete ────────────────────────────────────────────────────────────
export function IconTrash({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Lid */}
      <line x1="2" y1="4" x2="14" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 4 L6 2.5 Q6 2 6.5 2 L9.5 2 Q10 2 10 2.5 L10 4" stroke={color} strokeWidth="1.2" fill="none"/>
      {/* Body */}
      <path d="M3.5 4.5 L4.5 14 L11.5 14 L12.5 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Lines */}
      <line x1="8" y1="7" x2="8" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="6" y1="7" x2="6.2" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="10" y1="7" x2="9.8" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

// ── Eye — view / read ─────────────────────────────────────────────────────────
export function IconEye({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M1 8 Q4 3 8 3 Q12 3 15 8 Q12 13 8 13 Q4 13 1 8 Z" stroke={color} strokeWidth="1.5" fill="none"/>
      <circle cx="8" cy="8" r="2.2" fill={color}/>
      <circle cx="8" cy="8" r="1" fill={color} opacity="0.3"/>
    </svg>
  )
}

// ── Save — floppy disk ───────────────────────────────────────────────────────
export function IconSave({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Outer shell */}
      <path d="M2 2 L11.5 2 L14 4.5 L14 14 L2 14 Z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      {/* Top label window */}
      <rect x="4.5" y="2" width="5" height="3.5" rx="0.4" fill={color} opacity="0.35"/>
      {/* Inner paper */}
      <rect x="4" y="9" width="8" height="5" rx="0.4" fill={color} opacity="0.2"/>
    </svg>
  )
}

// ── Lock — read-only / secured ───────────────────────────────────────────────
export function IconLock({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Shackle */}
      <path d="M5 7 L5 5 Q5 2 8 2 Q11 2 11 5 L11 7" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Body */}
      <rect x="3" y="7" width="10" height="7" rx="1" fill={color} opacity="0.25"/>
      <rect x="3" y="7" width="10" height="7" rx="1" stroke={color} strokeWidth="1.4" fill="none"/>
      {/* Keyhole */}
      <circle cx="8" cy="10.5" r="1.5" fill={color} opacity="0.7"/>
      <line x1="8" y1="11.5" x2="8" y2="13" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

// ── Refresh / resubmit — circular arrow ──────────────────────────────────────
export function IconRefresh({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M13 8 A5 5 0 1 1 10 3.5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <polyline points="10,1.5 10,4.5 13,4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// ── Bell — inline notification ───────────────────────────────────────────────
export function IconBell({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Bell body */}
      <path d="M8 1.5 Q11.5 1.5 12 6 L12.5 11 L3.5 11 L4 6 Q4.5 1.5 8 1.5 Z" fill={color} opacity="0.3"/>
      <path d="M8 1.5 Q11.5 1.5 12 6 L12.5 11 L3.5 11 L4 6 Q4.5 1.5 8 1.5 Z" stroke={color} strokeWidth="1.4" fill="none"/>
      {/* Clapper */}
      <path d="M6.5 11 Q6.5 13 8 13 Q9.5 13 9.5 11" stroke={color} strokeWidth="1.3" fill="none"/>
    </svg>
  )
}

// ── Check (bare) — success banner ─────────────────────────────────────────────
export function IconCheck({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <polyline points="2.5,8.5 6,12 13.5,4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Calendar — date label ────────────────────────────────────────────────────
export function IconCalendar({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="10" rx="0.8" stroke={color} strokeWidth="1.2" fill="none"/>
      <line x1="1" y1="5.5" x2="13" y2="5.5" stroke={color} strokeWidth="1.2" opacity="0.5"/>
      <line x1="4.5" y1="1" x2="4.5" y2="4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="9.5" y1="1" x2="9.5" y2="4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="3.5" y="7.5" width="2" height="2" rx="0.3" fill={color} opacity="0.5"/>
      <rect x="6.5" y="7.5" width="2" height="2" rx="0.3" fill={color} opacity="0.5"/>
    </svg>
  )
}

// ── Trophy — max score ────────────────────────────────────────────────────────
export function IconTrophy({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {/* Cup */}
      <path d="M3 2 L11 2 L10.5 7 Q10 10 7 10 Q4 10 3.5 7 Z" fill={color} opacity="0.3"/>
      <path d="M3 2 L11 2 L10.5 7 Q10 10 7 10 Q4 10 3.5 7 Z" stroke={color} strokeWidth="1.2" fill="none"/>
      {/* Handles */}
      <path d="M3 3 Q1 3 1 5.5 Q1 7 3.5 7" stroke={color} strokeWidth="1" fill="none"/>
      <path d="M11 3 Q13 3 13 5.5 Q13 7 10.5 7" stroke={color} strokeWidth="1" fill="none"/>
      {/* Stem + base */}
      <line x1="7" y1="10" x2="7" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4.5" y1="12" x2="9.5" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

// ── Comment bubble — admin note ───────────────────────────────────────────────
export function IconComment({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 2 Q1 1 2 1 L12 1 Q13 1 13 2 L13 9 Q13 10 12 10 L5 10 L2 13 L2 10 Q1 10 1 9 Z" fill={color} opacity="0.2"/>
      <path d="M1 2 Q1 1 2 1 L12 1 Q13 1 13 2 L13 9 Q13 10 12 10 L5 10 L2 13 L2 10 Q1 10 1 9 Z" stroke={color} strokeWidth="1.2" fill="none"/>
      <line x1="3.5" y1="4" x2="10.5" y2="4" stroke={color} strokeWidth="1" opacity="0.45"/>
      <line x1="3.5" y1="6.5" x2="8" y2="6.5" stroke={color} strokeWidth="1" opacity="0.45"/>
    </svg>
  )
}

// ── Clipboard — published/report ─────────────────────────────────────────────
export function IconClipboard({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="2" y="2.5" width="10" height="11" rx="0.8" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7"/>
      <path d="M5 2.5 L5 1.5 Q5 1 5.5 1 L8.5 1 Q9 1 9 1.5 L9 2.5" stroke={color} strokeWidth="1.2" fill="none"/>
      <line x1="4" y1="5.5" x2="10" y2="5.5" stroke={color} strokeWidth="1" opacity="0.45"/>
      <line x1="4" y1="7.5" x2="10" y2="7.5" stroke={color} strokeWidth="1" opacity="0.45"/>
      <line x1="4" y1="9.5" x2="7.5" y2="9.5" stroke={color} strokeWidth="1" opacity="0.45"/>
    </svg>
  )
}

// ── Inbox arrow — received/submitted ─────────────────────────────────────────
export function IconInbox({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Tray */}
      <path d="M1 10 L3.5 5 L12.5 5 L15 10 L15 14 L1 14 Z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.6"/>
      {/* Arrow down */}
      <line x1="8" y1="1" x2="8" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <polyline points="5,6.5 8,9.5 11,6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// ── Grade pencil — grade action ───────────────────────────────────────────────
export function IconGrade({ color = 'currentColor', size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {/* Pencil */}
      <path d="M2 10 L9 3 L11.5 5.5 L4.5 12.5 Z" fill={color} opacity="0.6"/>
      <path d="M2 10 L4.5 12.5 L2 13 Z" fill={color} opacity="0.9"/>
      {/* Star spark */}
      <line x1="11" y1="1" x2="11" y2="3" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="9.5" y1="2" x2="12.5" y2="2" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════
//  DASHBOARD ICONS  (stat cards, quick actions, status badges)
// ════════════════════════════════════════════════════════════════════

// ── Teacher figure — person at a board ───────────────────────────────────────
export function IconTeacher({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <circle cx="12" cy="5.5" r="3" fill={color}/>
      {/* Body */}
      <path d="M6 19 Q6 13 12 13 Q18 13 18 19" fill={color} opacity="0.8"/>
      {/* Board */}
      <rect x="2" y="10" width="7" height="5" rx="0.6" stroke={color} strokeWidth="1.4" fill="none" opacity="0.6"/>
      {/* Board line */}
      <line x1="3.5" y1="12.5" x2="7.5" y2="12.5" stroke={color} strokeWidth="1" opacity="0.5"/>
      {/* Pointer arm */}
      <line x1="9" y1="13" x2="6.5" y2="12.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
    </svg>
  )
}

// ── Hourglass — pending / in-progress ────────────────────────────────────────
export function IconPending({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top frame */}
      <path d="M5 3 L19 3 L19 4.5 L14 9 L10 9 L5 4.5 Z" fill={color} opacity="0.9"/>
      {/* Bottom frame */}
      <path d="M5 21 L19 21 L19 19.5 L14 15 L10 15 L5 19.5 Z" fill={color} opacity="0.5"/>
      {/* Top sand flow */}
      <path d="M10 9 L12 11 L14 9 Z" fill={color} opacity="0.7"/>
      {/* Bottom sand pile */}
      <path d="M9.5 15 Q12 14 14.5 15 L14 17 L10 17 Z" fill={color} opacity="0.6"/>
      {/* Side rails */}
      <line x1="5" y1="3" x2="5" y2="21" stroke={color} strokeWidth="1.2" opacity="0.3"/>
      <line x1="19" y1="3" x2="19" y2="21" stroke={color} strokeWidth="1.2" opacity="0.3"/>
    </svg>
  )
}

// ── Checkmark circle — approved / graded ─────────────────────────────────────
export function IconApproved({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Circle */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill="none" opacity="0.35"/>
      {/* Check */}
      <polyline points="7,12.5 10.5,16 17,9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── X circle — rejected ───────────────────────────────────────────────────────
export function IconRejected({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Circle */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill="none" opacity="0.35"/>
      {/* X */}
      <line x1="8" y1="8" x2="16" y2="16" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="16" y1="8" x2="8" y2="16" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

// ── Upload arrow — submitted ──────────────────────────────────────────────────
export function IconSubmitted({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Document */}
      <rect x="4" y="6" width="11" height="14" rx="1" stroke={color} strokeWidth="1.6" fill="none" opacity="0.5"/>
      {/* Fold corner */}
      <polyline points="11,6 11,10 15,10" stroke={color} strokeWidth="1.3" fill="none" opacity="0.5"/>
      {/* Upload arrow */}
      <line x1="17" y1="17" x2="17" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <polyline points="13.5,12 17,9 20.5,12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Pencil — draft / edit ────────────────────────────────────────────────────
export function IconDraft({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Pencil body */}
      <path d="M4 17 L15 6 L18 9 L7 20 Z" fill={color} opacity="0.7"/>
      {/* Tip */}
      <path d="M4 17 L7 20 L4 21 Z" fill={color} opacity="0.9"/>
      {/* Highlight stripe */}
      <line x1="13" y1="8" x2="16" y2="11" stroke={color} strokeWidth="1" opacity="0.3"/>
      {/* Eraser */}
      <path d="M15 6 L17 4 L20 7 L18 9 Z" fill={color} opacity="0.5"/>
    </svg>
  )
}

// ── Warning triangle — deadline alert ────────────────────────────────────────
export function IconWarning({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Triangle */}
      <path d="M12 3 L22 20 L2 20 Z" fill={color} opacity="0.2"/>
      <path d="M12 3 L22 20 L2 20 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      {/* Exclamation */}
      <line x1="12" y1="10" x2="12" y2="15" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="12" cy="18" r="1.1" fill={color}/>
    </svg>
  )
}

// ── Plus / Add ───────────────────────────────────────────────────────────────
export function IconAdd({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="4"  y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

// ── Open book — material / subject resource ───────────────────────────────────
export function IconOpenBook({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left page */}
      <path d="M12 6 Q7 5 3 7 L3 19 Q7 17 12 18 Z" fill={color} opacity="0.35"/>
      {/* Right page */}
      <path d="M12 6 Q17 5 21 7 L21 19 Q17 17 12 18 Z" fill={color} opacity="0.55"/>
      {/* Spine */}
      <line x1="12" y1="6" x2="12" y2="18" stroke={color} strokeWidth="1.4"/>
      {/* Left lines */}
      <line x1="5.5" y1="10" x2="10" y2="9.5" stroke={color} strokeWidth="0.9" opacity="0.45"/>
      <line x1="5.5" y1="13" x2="10" y2="12.5" stroke={color} strokeWidth="0.9" opacity="0.45"/>
      {/* Right lines */}
      <line x1="14" y1="9.5" x2="18.5" y2="10" stroke={color} strokeWidth="0.9" opacity="0.45"/>
      <line x1="14" y1="12.5" x2="18.5" y2="13" stroke={color} strokeWidth="0.9" opacity="0.45"/>
    </svg>
  )
}

// ── Progress bars — view progress / analytics ─────────────────────────────────
export function IconProgress({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bars */}
      <rect x="2"  y="14" width="4" height="7" rx="0.6" fill={color} opacity="0.4"/>
      <rect x="8"  y="10" width="4" height="11" rx="0.6" fill={color} opacity="0.6"/>
      <rect x="14" y="6"  width="4" height="15" rx="0.6" fill={color} opacity="0.8"/>
      {/* Trend line */}
      <polyline points="4,13 10,9 16,5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="16" cy="5" r="1.8" fill={color}/>
      {/* Baseline */}
      <line x1="1" y1="21.5" x2="23" y2="21.5" stroke={color} strokeWidth="1.2" opacity="0.3"/>
    </svg>
  )
}

// ── Link / chain — assign ────────────────────────────────────────────────────
export function IconAssign({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left link */}
      <path d="M9 12 Q9 8 13 8 L15 8 Q19 8 19 12 Q19 16 15 16 L13 16" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Right link */}
      <path d="M15 12 Q15 16 11 16 L9 16 Q5 16 5 12 Q5 8 9 8 L11 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Centre bar */}
      <line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ── Empty mailbox — no submissions ───────────────────────────────────────────
export function IconEmpty({ color = 'currentColor', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Box */}
      <rect x="2" y="10" width="20" height="12" rx="1.2" stroke={color} strokeWidth="1.6" fill="none" opacity="0.5"/>
      {/* Lid open */}
      <path d="M2 10 L12 4 L22 10" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Flag */}
      <line x1="18" y1="10" x2="18" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <rect x="18" y="4" width="4" height="2.5" rx="0.4" fill={color} opacity="0.5"/>
    </svg>
  )
}