"use client"

import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock'

import { useEffect, useState } from 'react'

interface Announcement {
  _id: string; title: string; content: string
  author: { name: string }; subject: { name: string; code: string } | null
  scope: string; isPinned: boolean; readBy: string[]; createdAt: string
  fileUrl?: string; fileName?: string
}
interface Notification {
  _id: string; type: string; title: string; message: string
  link: string; isRead: boolean; createdAt: string
}

const TYPE_ICON: Record<string, string> = {
  project_approved: '✅', project_rejected: '❌', project_published: '📋',
  submission_received: '📥', submission_graded: '🏆',
  deadline_warning: '⏰', announcement_posted: '📢',
}
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function StudentAnnouncementsPage() {
  const [tab, setTab] = useState<'announcements' | 'notifications'>('announcements')
  const [announcements,  setAnnouncements]  = useState<Announcement[]>([])
  const [notifications,  setNotifications]  = useState<Notification[]>([])
  const [unreadNotifs,   setUnreadNotifs]   = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [expanded,       setExpanded]       = useState<string | null>(null)

  async function loadAnnouncements() {
    const res  = await fetch('/api/student/announcements')
    const data = await res.json()
    setAnnouncements(Array.isArray(data) ? data : [])
  }

  async function loadNotifications() {
    const res  = await fetch('/api/notifications?limit=50')
    const data = await res.json()
    if (data.notifications) {
      setNotifications(data.notifications)
      setUnreadNotifs(data.unreadCount)
    }
  }

  useEffect(() => {
    async function init() {
      await Promise.all([loadAnnouncements(), loadNotifications()])
      setLoading(false)
    }
    init()
  }, [])

  async function markRead(id: string) {
    await fetch('/api/student/announcements', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcementId: id }),
    })
    loadAnnouncements()
  }

  async function markNotifRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    setUnreadNotifs(p => Math.max(0, p - 1))
  }

  async function markAllNotifsRead() {
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadNotifs(0)
  }

  async function dismissNotif(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications(prev => {
      const n = prev.find(x => x._id === id)
      if (n && !n.isRead) setUnreadNotifs(c => Math.max(0, c - 1))
      return prev.filter(x => x._id !== id)
    })
  }

  function toggleExpand(id: string) {
    setExpanded(prev => (prev === id ? null : id))
    markRead(id)
  }

  const pinned  = announcements.filter(a => a.isPinned)
  const regular = announcements.filter(a => !a.isPinned)
  const unreadAnnouncements = announcements.filter(a => a.readBy.length === 0).length

  return (
    <div>
      <Link
        href="/student"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#63b3ed] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Dashboard
      </Link>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-[#63b3ed] text-xs font-mono tracking-[0.2em] uppercase mb-1">
            お知らせ
          </p>
          <h1
            className="text-2xl font-bold text-[#1a1209]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Announcements &amp; Notifications
          </h1>
        </div>
        <RealTimeClock accentColor="#63b3ed" />
      </div>

       {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[#f0e9d6] p-1 rounded-sm w-fit mb-6">
        {([
          { key: 'announcements', label: '📢 Announcements', badge: unreadAnnouncements },
          { key: 'notifications', label: '🔔 Notifications',  badge: unreadNotifs },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`relative px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 ${
              tab === t.key ? 'bg-[#1a2535] text-[#63b3ed]' : 'text-[#7a6a52] hover:text-[#1a1209]'
            }`}>
            {t.label}
            {t.badge > 0 && (
              <span className="min-w-[16px] h-4 px-1 bg-[#c0392b] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading...</div>
      ) : (
        <>
          {/* ══════════ ANNOUNCEMENTS TAB ══════════ */}
          {tab === 'announcements' && (
            <>
              {announcements.length === 0 ? (
                <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
                  <div className="text-4xl mb-3">📢</div>
                  <p className="text-[#7a6a52] text-sm">No announcements yet. Check back later!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...pinned, ...regular].map((a) => {
                    const isExpanded = expanded === a._id
                    const isRead = a.readBy.length > 0
                    return (
                      <div key={a._id}
                        className={`bg-white border rounded-sm shadow-[3px_3px_0_#c8b89a] transition-all ${
                          a.isPinned ? 'border-[rgba(212,168,67,0.5)]' : 'border-[#c8b89a]'
                        } ${!isRead ? 'border-l-4 border-l-[#63b3ed]' : ''}`}>
                        <button className="w-full text-left px-5 py-4 hover:bg-[#faf6ee] transition-colors"
                          onClick={() => toggleExpand(a._id)}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {a.isPinned && (
                                  <span className="text-xs font-mono text-[#d4a843] bg-[rgba(212,168,67,0.1)] border border-[rgba(212,168,67,0.3)] px-2 py-0.5 rounded-sm">📌 Pinned</span>
                                )}
                                <span className={`text-xs font-mono px-2 py-0.5 border rounded-sm ${
                                  a.scope === 'global'
                                    ? 'text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)]'
                                    : 'text-[#63b3ed] bg-[rgba(99,179,237,0.06)] border-[rgba(99,179,237,0.2)]'
                                }`}>
                                  {a.scope === 'global' ? '🌐 School-wide' : `📚 ${a.subject?.code}`}
                                </span>
                                {!isRead && <span className="text-xs font-mono text-[#63b3ed] font-bold">● New</span>}
                              </div>
                              <h3 className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{a.title}</h3>
                              <div className="flex gap-3 mt-1 text-xs text-[#7a6a52] font-mono">
                                <span>👤 {a.author?.name}</span>
                                <span>📅 {new Date(a.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className="text-[#7a6a52] text-lg shrink-0 mt-1">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-[#f0e9d6]">
                            <p className="text-sm text-[#1a1209] leading-relaxed mt-4 whitespace-pre-line">{a.content}</p>
                            {a.subject && (
                              <div className="mt-3 text-xs text-[#7a6a52] font-mono">📚 {a.subject.name} ({a.subject.code})</div>
                            )}
                            {a.fileUrl && (
                              <a href={a.fileUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 mt-3 text-xs font-mono text-[#63b3ed] border border-[rgba(99,179,237,0.3)] bg-[rgba(99,179,237,0.06)] px-3 py-1.5 rounded-sm hover:bg-[rgba(99,179,237,0.12)] transition-colors">
                                📎 {a.fileName || 'Attachment'} ↗
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ══════════ NOTIFICATIONS TAB ══════════ */}
          {tab === 'notifications' && (
            <>
              {unreadNotifs > 0 && (
                <div className="flex justify-end mb-3">
                  <button onClick={markAllNotifsRead}
                    className="text-xs font-mono text-[#63b3ed] hover:underline underline-offset-2">
                    Mark all as read
                  </button>
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-[#7a6a52] text-sm">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n._id}
                      className={`bg-white border rounded-sm shadow-[2px_2px_0_#c8b89a] transition-all flex items-start gap-4 px-5 py-4 group ${
                        !n.isRead ? 'border-l-4 border-l-[#63b3ed] border-[#c8b89a]' : 'border-[#c8b89a]'
                      }`}>
                      <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-bold text-sm ${!n.isRead ? 'text-[#1a1209]' : 'text-[#7a6a52]'}`}
                            style={{ fontFamily: 'Georgia, serif' }}>
                            {n.title}
                          </h3>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#63b3ed] shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-sm text-[#7a6a52] mt-1 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-mono text-[#a89880]">{timeAgo(n.createdAt)}</span>
                          {!n.isRead && (
                            <button onClick={() => markNotifRead(n._id)}
                              className="text-xs font-mono text-[#63b3ed] hover:underline underline-offset-2">
                              Mark read
                            </button>
                          )}
                          <a href={n.link}
                            className="text-xs font-mono text-[#1a7a6e] hover:underline underline-offset-2 ml-auto">
                            Go to page →
                          </a>
                        </div>
                      </div>
                      <button onClick={() => dismissNotif(n._id)}
                        className="text-[#c8b89a] hover:text-[#c0392b] text-sm opacity-0 group-hover:opacity-100 transition-all shrink-0 px-1">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
