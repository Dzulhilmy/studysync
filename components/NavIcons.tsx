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