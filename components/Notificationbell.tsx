'use client'

/**
 * NotificationBell
 *
 * Drop into any layout. Polls every 30s. Shows unread badge.
 * Clicking a notification marks it read and navigates to its link.
 *
 * Usage:
 *   import NotificationBell from '@/components/NotificationBell'
 *   <NotificationBell />
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  link: string
  isRead: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, string> = {
  project_approved:    '✅',
  project_rejected:    '❌',
  project_published:   '📋',
  submission_received: '📥',
  submission_graded:   '🏆',
  deadline_warning:    '⏰',
  announcement_posted: '📢',
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [open,          setOpen]          = useState(false)
  const [loading,       setLoading]       = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res  = await fetch('/api/notifications?limit=10')
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch { /* silent */ }
  }

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(id)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleClick(notif: Notification) {
    setOpen(false)
    // Mark as read
    if (!notif.isRead) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif._id }),
      })
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    router.push(notif.link)
  }

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    setLoading(false)
  }

  async function dismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications(prev => {
      const notif = prev.find(n => n._id === id)
      if (notif && !notif.isRead) setUnreadCount(c => Math.max(0, c - 1))
      return prev.filter(n => n._id !== id)
    })
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-sm transition-all
          hover:bg-[rgba(250,246,238,0.08)] border border-transparent hover:border-[rgba(250,246,238,0.1)]"
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="rgba(250,246,238,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1
            bg-[#c0392b] text-white text-[9px] font-bold font-mono
            flex items-center justify-center rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-11 w-80 z-[200]
          bg-[#1a1209] border border-[rgba(212,168,67,0.2)] rounded-sm
          shadow-[6px_6px_0_rgba(0,0,0,0.4)] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
            border-b border-[rgba(212,168,67,0.12)] bg-[rgba(26,18,9,0.8)]">
            <div className="flex items-center gap-2">
              <span className="text-[#d4a843] text-xs font-mono uppercase tracking-widest font-bold">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-mono bg-[#c0392b] text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-[10px] font-mono text-[rgba(212,168,67,0.6)] hover:text-[#d4a843] transition-colors disabled:opacity-40"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-[rgba(250,246,238,0.4)] text-xs font-mono">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[rgba(212,168,67,0.06)]
                    hover:bg-[rgba(212,168,67,0.06)] transition-colors group flex items-start gap-3
                    ${!n.isRead ? 'bg-[rgba(212,168,67,0.04)]' : ''}`}
                >
                  {/* Icon */}
                  <span className="text-base shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] ?? '🔔'}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-semibold truncate block ${
                        !n.isRead ? 'text-[#faf6ee]' : 'text-[rgba(250,246,238,0.6)]'
                      }`}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4a843] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[10px] text-[rgba(250,246,238,0.4)] mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[9px] font-mono text-[rgba(250,246,238,0.25)] mt-1 block">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={(e) => dismiss(e, n._id)}
                    className="text-[rgba(250,246,238,0.2)] hover:text-[rgba(192,57,43,0.8)]
                      text-xs opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5 px-1"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </button>
              ))
            )}
          </div>

          {/* Footer — view all */}
          <div className="px-4 py-2.5 border-t border-[rgba(212,168,67,0.12)] bg-[rgba(26,18,9,0.8)]">
            <button
              onClick={() => { setOpen(false); router.push('announcements') }}
              className="w-full text-[10px] font-mono text-[rgba(212,168,67,0.5)] hover:text-[#d4a843]
                transition-colors text-center uppercase tracking-widest"
            >
              View all in Announcements →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}