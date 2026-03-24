'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { IconClose } from '@/components/NavIcons'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Notification {
  _id:       string
  type:      string
  title:     string
  message:   string
  link:      string
  read:      boolean
  createdAt: string
}

// ── Role themes ───────────────────────────────────────────────────────────────

const THEME = {
  admin: {
    accent:      '#c0392b',
    badgeBg:     '#c0392b',
    header:      '#c0392b',
    headerText:  '#fff5f5',
    unread:      'border-l-[#c0392b]',
    hover:       'hover:bg-[rgba(192,57,43,0.05)]',
    deleteHover: 'hover:text-[#c0392b]',
  },
  teacher: {
    accent:      '#27ae60',
    badgeBg:     '#27ae60',
    header:      '#1a3a2a',
    headerText:  '#a8f0c6',
    unread:      'border-l-[#27ae60]',
    hover:       'hover:bg-[rgba(39,174,96,0.05)]',
    deleteHover: 'hover:text-[#27ae60]',
  },
  student: {
    accent:      '#63b3ed',
    badgeBg:     '#2b7ec1',
    header:      '#1a2535',
    headerText:  '#a8d4f5',
    unread:      'border-l-[#63b3ed]',
    hover:       'hover:bg-[rgba(99,179,237,0.05)]',
    deleteHover: 'hover:text-[#63b3ed]',
  },
}

// Safe getter — always returns a valid theme regardless of what role value arrives
function getTheme(role: string | undefined | null) {
  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return THEME[role]
  }
  return THEME.teacher // neutral fallback
}

// ── Type icon map ─────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  submission_graded:        '✅',
  redo_requested:           '🔄',
  new_message:              '💬',
  project_published:        '📚',
  new_submission:           '📥',
  project_approved:         '✅',
  project_rejected:         '❌',
  project_pending_approval: '🔔',
  profile_updated:          '✏️',
  new_report:               '📊',
}

function fmt(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

// ── Bell SVG ──────────────────────────────────────────────────────────────────

function BellIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  role?: string   // deliberately loose so session.user.role works directly
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const router                        = useRouter()
  const theme                         = getTheme(role)   // never undefined
  const [open,          setOpen]      = useState(false)
  const [notifications, setNotifs]    = useState<Notification[]>([])
  const [unreadCount,   setUnread]    = useState(0)
  const [loading,       setLoading]   = useState(false)
  const dropdownRef                   = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=30')
      if (!res.ok) return
      const data = await res.json()
      setNotifs(data.notifications ?? [])
      setUnread(data.unreadCount   ?? 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
    setLoading(false)
  }

  async function deleteNotif(e: React.MouseEvent, id: string, wasRead: boolean) {
    e.stopPropagation()
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifs(prev => prev.filter(n => n._id !== id))
    if (!wasRead) setUnread(prev => Math.max(0, prev - 1))
  }

  function handleClick(notif: Notification) {
    if (!notif.read) markRead(notif._id)
    setOpen(false)
    if (notif.link && notif.link !== '/') router.push(notif.link)
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-sm transition-colors hover:bg-black/5"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon size={20} color={open ? theme.accent : '#7a6a52'} />

        {/* Unread badge — only render when there's something to show */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none px-1"
            style={{ background: theme.badgeBg }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[480px] flex flex-col bg-white border border-[#c8b89a] rounded-sm z-50 overflow-hidden"
          style={{ boxShadow: '4px 4px 0 #c8b89a' }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ background: theme.header }}>
            <div className="flex items-center gap-2">
              <BellIcon size={14} color={theme.headerText} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: theme.headerText }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm font-bold text-white"
                  style={{ background: theme.badgeBg }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} disabled={loading}
                className="text-[10px] font-mono underline opacity-80 hover:opacity-100 disabled:opacity-40 transition-opacity"
                style={{ color: theme.headerText }}>
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f0e9d6]">
            {notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <BellIcon size={28} color="#c8b89a" />
                <p className="text-[#a89880] text-xs font-mono mt-2">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n._id} onClick={() => handleClick(n)}
                className={`px-4 py-3 cursor-pointer flex gap-3 items-start group transition-colors
                  border-l-2 ${n.read ? 'border-l-transparent bg-white' : `${theme.unread} bg-[#fdfcf8]`}
                  ${theme.hover}`}>

                <span className="text-base shrink-0 mt-0.5 select-none">
                  {TYPE_ICON[n.type] ?? '🔔'}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={`text-xs leading-snug ${n.read ? 'text-[#4a3828]' : 'text-[#1a1209] font-semibold'}`}>
                      {n.title}
                    </p>
                    <button onClick={e => deleteNotif(e, n._id, n.read)}
                      className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#c8b89a] ${theme.deleteHover} ml-1 mt-0.5`}>
                      <IconClose size={11} color="currentColor" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7a6a52] leading-snug mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#a89880]">{fmt(n.createdAt)}</span>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: theme.accent }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[#f0e9d6] bg-[#faf6ee] shrink-0 text-center">
              <span className="text-[10px] font-mono text-[#a89880]">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · updates every 30s
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}