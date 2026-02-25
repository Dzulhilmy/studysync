'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link';
import RealTimeClock from '@/components/RealTimeClock';

interface Subject { _id: string; name: string; code: string }
interface Announcement {
  _id: string; title: string; content: string
  subject: Subject | null; scope: string
  isPinned: boolean; readBy: string[]; createdAt: string
}

const EMPTY = { title: '', content: '', subject: '', isPinned: false }

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [aRes, sRes] = await Promise.all([
      fetch('/api/teacher/announcements'),
      fetch('/api/teacher/subjects'),
    ])
    const aResData = await aRes.json()
    setAnnouncements(Array.isArray(aResData) ? aResData : [])
    const sResData = await sRes.json()
    setSubjects(Array.isArray(sResData) ? sResData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/teacher/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, subject: form.subject || null }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    setForm(EMPTY)
    setShowForm(false)
    load()
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return
    await fetch('/api/teacher/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const pinned = announcements.filter(a => a.isPinned)
  const regular = announcements.filter(a => !a.isPinned)

  return (
    <div>
      <Link
        href="/teacher"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#88d4ab] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Dashboard
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[#1a7a6e] text-xs font-mono tracking-[0.2em] uppercase mb-1">お知らせ</p>
          <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Announcements</h1>
        </div>
        <RealTimeClock accentColor="#1a7a6e" />
        <button onClick={() => { setShowForm(true); setError('') }}
          className="flex items-center gap-2 bg-[#1a3a2a] text-[#d4a843] px-4 py-2 text-sm font-semibold border border-[rgba(212,168,67,0.3)] hover:bg-[#224d38] transition-colors rounded-sm shadow-[2px_2px_0_rgba(26,18,9,0.3)]">
          ＋ New Announcement
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-lg">
            <div className="bg-[#1a3a2a] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[#d4a843] font-bold" style={{ fontFamily: 'Georgia, serif' }}>Post Announcement</h2>
              <button onClick={() => setShowForm(false)} className="text-[rgba(250,246,238,0.4)] hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">{error}</div>}
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Announcement title"
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Content</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required rows={4}
                  placeholder="Write your announcement here..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Subject (optional)</label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]">
                  <option value="">— All students (global) —</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))}
                  className="w-4 h-4 accent-[#1a7a6e]" />
                <span className="text-sm text-[#7a6a52]">📌 Pin this announcement</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c8b89a] text-sm text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#1a3a2a] text-[#d4a843] text-sm font-semibold rounded-sm disabled:opacity-50">
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-[#7a6a52] text-sm">No announcements yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pinned, ...regular].map(a => (
            <div key={a._id} className={`bg-white rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] border transition-all hover:shadow-[4px_4px_0_#c8b89a] ${
              a.isPinned ? 'border-[rgba(212,168,67,0.5)]' : 'border-[#c8b89a]'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {a.isPinned && <span className="text-xs font-mono text-[#d4a843] bg-[rgba(212,168,67,0.1)] border border-[rgba(212,168,67,0.3)] px-2 py-0.5 rounded-sm">📌 Pinned</span>}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                      a.scope === 'global'
                        ? 'text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)]'
                        : 'text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] border-[rgba(26,122,110,0.2)]'
                    }`}>
                      {a.scope === 'global' ? '🌐 Global' : `📚 ${a.subject?.code}`}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{a.title}</h3>
                  <p className="text-sm text-[#7a6a52] mt-1 leading-relaxed">{a.content}</p>
                  <div className="flex gap-3 mt-2 text-xs text-[#7a6a52] font-mono">
                    <span>📅 {new Date(a.createdAt).toLocaleDateString()}</span>
                    <span>👁 {a.readBy?.length ?? 0} read</span>
                  </div>
                </div>
                <button onClick={() => deleteAnnouncement(a._id)}
                  className="shrink-0 text-xs px-3 py-1.5 border border-[rgba(192,57,43,0.3)] text-[#c0392b] rounded-sm hover:bg-[rgba(192,57,43,0.08)] transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}