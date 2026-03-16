'use client'

import { useState } from 'react'

// ── Role colour config ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    bg:    '#1a3a2a',
    ring:  'rgba(192,57,43,0.5)',
    text:  '#d4a843',
    label: '#c0392b',
  },
  teacher: {
    bg:    '#1a2535',
    ring:  'rgba(99,179,237,0.5)',
    text:  '#63b3ed',
    label: '#63b3ed',
  },
  student: {
    bg:    '#2c1810',
    ring:  'rgba(212,168,67,0.4)',
    text:  '#d4a843',
    label: '#d4a843',
  },
  default: {
    bg:    '#2a2420',
    ring:  'rgba(200,184,154,0.4)',
    text:  '#c8b89a',
    label: '#a89880',
  },
}

// ── Fallback SVG user icon ────────────────────────────────────────────────────
function UserIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size * 0.55}
      height={size * 0.55}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

// ── Avatar component ──────────────────────────────────────────────────────────

interface AvatarProps {
  /** URL of the user's uploaded image — can be any external domain */
  src?:         string | null
  /** User's display name — used to generate initials fallback */
  name?:        string | null
  /** Role controls ring colour and initial background */
  role?:        'admin' | 'teacher' | 'student'
  /** Diameter in px — default 40 */
  size?:        number
  /** Show a coloured role indicator dot */
  showRoleDot?: boolean
  /** Extra Tailwind classes on the outer wrapper */
  className?:   string
}

export default function Avatar({
  src,
  name,
  role        = 'default' as any,
  size        = 40,
  showRoleDot = false,
  className   = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.default

  // Derive initials from name
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : null

  const fontSize  = Math.max(10, Math.round(size * 0.36))
  const dotSize   = Math.max(8,  Math.round(size * 0.22))
  const ringWidth = size >= 48 ? 2 : 1.5

  // Show the image only when we have a URL and it hasn't errored.
  // Using a plain <img> instead of next/image so ANY external hostname
  // works without needing to be listed in next.config.js.
  const showImage = !!src && !imgError

  return (
    <div
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Main circle */}
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: showImage ? 'transparent' : cfg.bg,
          boxShadow:  `0 0 0 ${ringWidth}px ${cfg.ring}, 2px 2px 0 rgba(0,0,0,0.25)`,
        }}
      >
        {showImage ? (
          // ── plain <img> — works with any hostname, no next.config.js changes needed ──
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src!}
            alt={name ?? 'User avatar'}
            width={size}
            height={size}
            className="object-cover w-full h-full"
            onError={() => setImgError(true)}
          />
        ) : initials ? (
          // Initials fallback
          <span
            className="font-bold select-none leading-none"
            style={{
              fontFamily:    'Georgia, serif',
              fontSize:      fontSize,
              color:         cfg.text,
              letterSpacing: '0.03em',
            }}
          >
            {initials}
          </span>
        ) : (
          // Icon fallback — when no image AND no name
          <UserIcon size={size} color={cfg.text} />
        )}
      </div>

      {/* Role indicator dot */}
      {showRoleDot && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width:       dotSize,
            height:      dotSize,
            background:  cfg.label,
            borderColor: '#faf6ee',
          }}
        />
      )}
    </div>
  )
}

// ── AvatarWithLabel ───────────────────────────────────────────────────────────

/**
 * Larger avatar with name + role label beside it — for profile headers / sidebars
 */
export function AvatarWithLabel({
  src, name, role, email, size = 48,
}: AvatarProps & { email?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={src} name={name} role={role} size={size} showRoleDot />
      <div className="min-w-0">
        <div
          className="font-bold text-[#1a1209] truncate text-sm"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {name ?? 'Unknown User'}
        </div>
        {email && (
          <div className="text-[10px] font-mono text-[#7a6a52] truncate">{email}</div>
        )}
        {role && (
          <div
            className="text-[10px] font-mono uppercase tracking-wider mt-0.5"
            style={{ color: (ROLE_CONFIG[role] ?? ROLE_CONFIG.default).label }}
          >
            {role}
          </div>
        )}
      </div>
    </div>
  )
}