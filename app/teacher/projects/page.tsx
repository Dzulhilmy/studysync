'use client'

import { useEffect, useRef, useState } from 'react'
import FileUpload from '@/components/FileUpload'
import RealTimeClock from '@/components/RealTimeClock';

interface Subject { _id: string; name: string; code: string }
interface Project {
  _id: string; title: string; description: string
  subject: Subject; deadline: string; maxScore: number
  status: 'pending' | 'approved' | 'rejected'; adminNote: string
  totalStudents: number; submitted: number; graded: number
  warnUnsubmitted: boolean; daysLeft: number; unsubmitted: number
  createdAt: string
  fileUrl?: string; fileName?: string
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'text-[#8b5a2b] bg-[rgba(212,168,67,0.1)] border-[rgba(212,168,67,0.3)]',
  approved: 'text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]',
  rejected: 'text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.25)]',
}
const STATUS_ICON: Record<string, string> = { pending: '⏳', approved: '✅', rejected: '✕' }
const EMPTY = { title: '', description: '', subject: '', deadline: '', maxScore: 100, fileUrl: '', fileName: '' }

export default function TeacherProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteRef = useRef(false)  // sync lock — prevents double-click

  async function load() {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/teacher/projects'),
        fetch('/api/teacher/subjects'),
      ])
      const pData = await pRes.json()
      const sData = await sRes.json()
      // Guard: ensure we only set arrays — if the API returns an error object, fall back to []
      setProjects(Array.isArray(pData) ? pData : [])
      setSubjects(Array.isArray(sData) ? sData : [])
    } catch (e) {
      setProjects([])
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditProject(null)
    setForm(EMPTY)
    setError('')
    setShowForm(true)
  }

  function openEdit(p: Project) {
    setEditProject(p)
    setForm({
      title: p.title, description: p.description,
      subject: p.subject?._id, maxScore: p.maxScore,
      deadline: p.deadline ? p.deadline.slice(0,10) : '',
      fileUrl: p.fileUrl ?? '', fileName: p.fileName ?? '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const url = editProject ? `/api/teacher/projects/${editProject._id}` : '/api/teacher/projects'
    const method = editProject ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, fileUrl: form.fileUrl || null, fileName: form.fileName || null }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    setShowForm(false)
    load()
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return
    if (deleteRef.current) return        // sync lock — prevents double-click
    deleteRef.current = true
    setDeletingId(id)

    try {
      const res = await fetch(`/api/teacher/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Server returned an error — show it, don't touch the list
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Delete failed (${res.status})`)
      } else {
        // Success — remove from local state immediately, NO load() re-fetch
        // (load() would bring the project back if called before server fully settles)
        setProjects(prev => prev.filter(p => p._id !== id))
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setDeletingId(null)
      deleteRef.current = false
    }
  }

  const filtered = projects.filter(p => filter === 'all' || p.status === filter)
  const counts = {
    all: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    approved: projects.filter(p => p.status === 'approved').length,
    rejected: projects.filter(p => p.status === 'rejected').length,
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[#1a7a6e] text-xs font-mono tracking-[0.2em] uppercase mb-1">プロジェクト管理</p>
          <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Project Management</h1>
        </div>
        <RealTimeClock accentColor="#1a7a6e" />
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1a3a2a] text-[#d4a843] px-4 py-2 text-sm font-semibold border border-[rgba(212,168,67,0.3)] hover:bg-[#224d38] transition-colors rounded-sm shadow-[2px_2px_0_rgba(26,18,9,0.3)]">
          ＋ New Project
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all','pending','approved','rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm border transition-all ${
              filter === f ? 'bg-[#1a3a2a] text-[#d4a843] border-[rgba(212,168,67,0.4)]'
                          : 'bg-white text-[#7a6a52] border-[#c8b89a] hover:border-[#1a7a6e]'}`}>
            {STATUS_ICON[f] ?? '📋'} {f} ({counts[f] ?? projects.length})
          </button>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1a3a2a] px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-[#d4a843] font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                {editProject ? (editProject.status === 'rejected' ? '↺ Resubmit Project' : 'Edit Project') : 'Create Project'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[rgba(250,246,238,0.4)] hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">{error}</div>}
              {editProject?.status === 'rejected' && editProject.adminNote && (
                <div className="text-[#8b5a2b] text-xs bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.25)] px-3 py-2 rounded-sm">
                  <strong>Admin note:</strong> {editProject.adminNote}
                </div>
              )}
              {[
                { label: 'Project Title', key: 'title', type: 'text', placeholder: 'e.g. Science Fair Report' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Instructions for students..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Subject</label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]">
                  <option value="">— Select subject —</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} required
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Max Score</label>
                  <input type="number" value={form.maxScore} onChange={e => setForm(p => ({ ...p, maxScore: Number(e.target.value) }))} min={1} max={1000}
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Attachment (optional)</label>
                <FileUpload
                  value={form.fileUrl ?? ''}
                  onChange={(url, name) => setForm(p => ({ ...p, fileUrl: url, fileName: name }))}
                  accentColor="#1a7a6e"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#c8b89a] text-sm text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#1a3a2a] text-[#d4a843] text-sm font-semibold rounded-sm disabled:opacity-50">
                  {submitting ? 'Saving...' : editProject ? 'Resubmit' : 'Create & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects */}
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">🗂</div>
          <p className="text-[#7a6a52] text-sm">No {filter !== 'all' ? filter : ''} projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p._id} className={`bg-white border rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] transition-all ${
              p.warnUnsubmitted ? 'border-[rgba(212,168,67,0.5)]' : 'border-[#c8b89a]'
            }`}>
              {/* Warning banner */}
              {p.warnUnsubmitted && (
                <div className="flex items-center gap-2 mb-3 text-xs text-[#8b5a2b] bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.25)] px-3 py-1.5 rounded-sm">
                  ⚠️ <strong>{p.unsubmitted} student{p.unsubmitted !== 1 ? 's' : ''}</strong> haven't submitted — only <strong>{p.daysLeft} day{p.daysLeft !== 1 ? 's' : ''}</strong> left!
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`text-xs font-mono px-2 py-0.5 border rounded-sm capitalize ${STATUS_STYLE[p.status]}`}>
                      {STATUS_ICON[p.status]} {p.status}
                    </span>
                    <span className="text-xs font-mono text-[#c0392b] bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] px-2 py-0.5 rounded-sm">
                      {p.subject?.code}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{p.title}</h3>
                  {p.description && <p className="text-xs text-[#7a6a52] mt-0.5 line-clamp-1">{p.description}</p>}
                  {p.status === 'rejected' && p.adminNote && (
                    <p className="text-xs text-[#c0392b] mt-1 bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.15)] px-2 py-1 rounded-sm">
                      💬 Admin: {p.adminNote}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#7a6a52] font-mono">
                    <span>📅 {new Date(p.deadline).toLocaleDateString()}</span>
                    <span>🏆 Max {p.maxScore}pts</span>
                    <span>📤 {p.submitted}/{p.totalStudents} submitted</span>
                    <span>✅ {p.graded} graded</span>
                  </div>
                  {/* Submission progress bar */}
                  {p.totalStudents > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-[#f0e9d6] rounded-full overflow-hidden w-full max-w-xs">
                        <div className="h-full bg-[#1a7a6e] rounded-full transition-all"
                          style={{ width: `${Math.round((p.submitted / p.totalStudents) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-[#7a6a52] font-mono mt-0.5 block">
                        {Math.round((p.submitted / p.totalStudents) * 100)}% submitted
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {(p.status === 'rejected' || p.status === 'pending') && (
                    <button onClick={() => openEdit(p)}
                      className="text-xs px-3 py-1.5 border border-[#c8b89a] hover:bg-[#f0e9d6] rounded-sm text-[#7a6a52] transition-colors">
                      {p.status === 'rejected' ? '↺ Resubmit' : 'Edit'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteProject(p._id)}
                    disabled={!!deletingId}
                    className="text-xs px-3 py-1.5 border border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)] rounded-sm text-[#c0392b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deletingId === p._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
