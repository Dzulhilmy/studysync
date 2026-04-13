'use client'

import { JSX, useEffect, useRef, useState } from 'react'
import FileUpload from '@/components/FileUpload'
import FilePreviewButton from '@/components/FilePreviewButton'
import RealTimeClock from '@/components/RealTimeClock'
import Link from 'next/link'
import {
  IconAdd, IconClose, IconWarning, IconPending, IconApproved, IconRejected,
  IconCalendar, IconTrophy, IconSubmitted, IconRefresh, IconTrash, IconProjects,
  IconUsers, IconEye,
} from '@/components/NavIcons'
import { getDaysLeft } from '@/lib/dateUtils'

// ── Safe JSON helper ──────────────────────────────────────────────────────────
// Prevents "Unexpected end of JSON input" when the server returns an empty
// body (e.g. 204 No Content, 304, or a network error with no payload).
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => '')
  if (!text.trim()) return null
  try { return JSON.parse(text) as T } catch { return null }
}

interface Subject { _id: string; name: string; code: string }
interface Project {
  _id: string; title: string; description: string
  subject: Subject; deadline: string; maxScore: number
  status: 'pending' | 'approved' | 'rejected'; adminNote: string
  totalStudents: number; submitted: number; graded: number
  late: number
  warnUnsubmitted: boolean; daysLeft: number; unsubmitted: number
  createdAt: string
  fileUrl?: string; fileName?: string
}
interface StudentSubmission {
  _id: string
  student: { _id: string; name: string; email: string }
  status: string; isLate: boolean
  submittedAt: string | null; grade: number | null
  reviewStatus?: 'approved' | 'rejected' | null
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'text-[#8b5a2b] bg-[rgba(212,168,67,0.1)] border-[rgba(212,168,67,0.3)]',
  approved: 'text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]',
  rejected: 'text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.25)]',
}
const STATUS_ICON_COMP: Record<string, (props: { size?: number; color?: string }) => JSX.Element> = {
  pending: IconPending, approved: IconApproved, rejected: IconRejected,
}
const EMPTY = { title: '', description: '', subject: '', deadline: '', maxScore: 100, fileUrl: '', fileName: '' }

// ── Submission Monitor Modal ──────────────────────────────────────────────────
function SubmissionMonitorModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [subs,        setSubs]        = useState<StudentSubmission[]>([])
  const [loading,     setLoading]     = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [noteMap,     setNoteMap]     = useState<Record<string, string>>({})
  const [saving,      setSaving]      = useState<string | null>(null)
  const [tab,         setTab]         = useState<'all' | 'submitted' | 'late' | 'pending'>('all')

  useEffect(() => {
    fetch(`/api/teacher/projects/${project._id}/submissions`)
      .then(r => safeJson<StudentSubmission[]>(r))
      .then(d => setSubs(Array.isArray(d) ? d : []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false))
  }, [project._id])

  async function handleReview(subId: string, decision: 'approved' | 'rejected') {
    setSaving(subId)
    try {
      const res = await fetch(`/api/teacher/submissions/${subId}/review`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: noteMap[subId] ?? '' }),
      })
      if (res.ok) {
        setSubs(p => p.map(s => s._id === subId ? { ...s, reviewStatus: decision } : s))
        setReviewingId(null)
      }
    } finally { setSaving(null) }
  }

  const submitted    = subs.filter(s => s.submittedAt)
  const late         = subs.filter(s => s.isLate && s.submittedAt)
  const notSubmitted = subs.filter(s => !s.submittedAt)
  const onTime       = subs.filter(s => s.submittedAt && !s.isLate)
  const displayed    = tab === 'submitted' ? submitted
                     : tab === 'late'      ? late
                     : tab === 'pending'   ? notSubmitted
                     : subs

  const REVIEW_COLOR: Record<string, string> = {
    approved: 'text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]',
    rejected: 'text-[#c0392b] bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.2)]',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="bg-[#1a3a2a] px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[#d4a843] font-bold text-base" style={{ fontFamily: 'Georgia,serif' }}>Student Submissions</h2>
            <p className="text-[rgba(250,246,238,0.45)] text-xs font-mono mt-0.5">{project.title}</p>
          </div>
          <button onClick={onClose} className="text-[rgba(250,246,238,0.4)] hover:text-white p-1 rounded-sm transition-colors mt-0.5">
            <IconClose size={16} color="currentColor" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="px-5 py-3 border-b border-[#f0e9d6] bg-[#faf6ee] flex flex-wrap gap-3 items-center shrink-0">
          {([
            { label: 'On Time',       value: onTime.length,       color: '#1a7a6e', t: 'submitted' },
            { label: 'Late',          value: late.length,         color: '#d4a843', t: 'late'      },
            { label: 'Not Submitted', value: notSubmitted.length, color: '#c0392b', t: 'pending'   },
            { label: 'Total',         value: subs.length,         color: '#1a1209', t: 'all'       },
          ] as const).map(s => (
            <button key={s.label} onClick={() => setTab(s.t as any)}
              className={`flex flex-col items-center px-3 py-1.5 rounded-sm border transition-all ${tab === s.t ? 'border-[#c8b89a] bg-white shadow-[1px_1px_0_#c8b89a]' : 'border-transparent'}`}>
              <span className="text-lg font-bold" style={{ color: s.color, fontFamily: 'Georgia,serif' }}>{s.value}</span>
              <span className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider whitespace-nowrap">{s.label}</span>
            </button>
          ))}
          {subs.length > 0 && (
            <div className="ml-auto self-center w-36">
              <div className="flex h-2 rounded-full overflow-hidden bg-[#f0e9d6]">
                <div className="bg-[#1a7a6e]" style={{ width: `${(onTime.length / subs.length) * 100}%` }} />
                <div className="bg-[#d4a843]" style={{ width: `${(late.length / subs.length) * 100}%` }} />
              </div>
              <div className="text-[10px] font-mono text-[#7a6a52] mt-0.5 text-right">
                {Math.round((submitted.length / subs.length) * 100)}% submitted
              </div>
            </div>
          )}
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f0e9d6]">
          {loading ? (
            <div className="p-10 text-center text-[#7a6a52] text-sm font-mono animate-pulse">Loading…</div>
          ) : displayed.length === 0 ? (
            <div className="p-10 text-center text-[#7a6a52] text-sm">No students in this category.</div>
          ) : displayed.map(s => (
            <div key={s._id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#1a3a2a] flex items-center justify-center text-xs font-bold text-[#d4a843] shrink-0">
                    {s.student.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1a1209]">{s.student.name}</div>
                    <div className="text-xs text-[#7a6a52] font-mono">{s.student.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {!s.submittedAt ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 border rounded-sm text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)]">Not submitted</span>
                  ) : (
                    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm ${s.isLate ? 'text-[#8b5a2b] bg-[rgba(212,168,67,0.08)] border-[rgba(212,168,67,0.3)]' : 'text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] border-[rgba(26,122,110,0.25)]'}`}>
                      {s.isLate ? 'Late' : 'On time'}
                    </span>
                  )}
                  {s.reviewStatus && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm flex items-center gap-1 capitalize ${REVIEW_COLOR[s.reviewStatus]}`}>
                      {s.reviewStatus === 'approved' ? <IconApproved size={10} color="currentColor" /> : <IconRejected size={10} color="currentColor" />}
                      {s.reviewStatus}
                    </span>
                  )}
                  {s.submittedAt && !s.reviewStatus && (
                    reviewingId === s._id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleReview(s._id, 'rejected')} disabled={saving === s._id}
                          className="text-[11px] px-2.5 py-1 border border-[rgba(192,57,43,0.35)] text-[#c0392b] hover:bg-[rgba(192,57,43,0.08)] rounded-sm disabled:opacity-40 flex items-center gap-1">
                          <IconRejected size={11} color="currentColor" />Reject
                        </button>
                        <button onClick={() => handleReview(s._id, 'approved')} disabled={saving === s._id}
                          className="text-[11px] px-2.5 py-1 bg-[#1a3a2a] text-[#d4a843] border border-[rgba(212,168,67,0.3)] hover:bg-[#224d38] rounded-sm disabled:opacity-40 flex items-center gap-1">
                          <IconApproved size={11} color="currentColor" />Approve
                        </button>
                        <button onClick={() => setReviewingId(null)} className="p-1 text-[#7a6a52] hover:text-[#1a1209]">
                          <IconClose size={12} color="currentColor" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setReviewingId(s._id)}
                        className="text-[11px] px-2.5 py-1 border border-[#c8b89a] text-[#7a6a52] hover:bg-[#f0e9d6] rounded-sm flex items-center gap-1">
                        <IconEye size={11} color="currentColor" />Review
                      </button>
                    )
                  )}
                  {s.reviewStatus && (
                    <button onClick={() => setReviewingId(prev => prev === s._id ? null : s._id)}
                      className="text-[10px] px-2 py-1 border border-[#c8b89a] text-[#7a6a52] hover:bg-[#f0e9d6] rounded-sm">Change</button>
                  )}
                </div>
              </div>
              {reviewingId === s._id && (
                <div className="mt-2">
                  <input value={noteMap[s._id] ?? ''} onChange={e => setNoteMap(p => ({ ...p, [s._id]: e.target.value }))}
                    placeholder="Optional note to student…"
                    className="w-full text-xs border border-[#c8b89a] px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#1a7a6e]" />
                </div>
              )}
              {s.submittedAt && (
                <div className="text-[10px] font-mono text-[#a89880] mt-1">
                  Submitted {new Date(s.submittedAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Popup ──────────────────────────────────────────────────────
function DeleteConfirmPopup({
  project, onConfirm, onCancel, deleting,
}: {
  project: Project; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={() => !deleting && onCancel()}>
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[6px_6px_0_#c8b89a] w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="bg-[#c0392b] px-5 py-4 flex items-center justify-between">
          <span className="text-white text-xs font-mono font-bold uppercase tracking-wider">⚠ Delete Project</span>
          <button onClick={() => !deleting && onCancel()} className="text-white/60 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-6">
          <p className="text-sm text-[#1a1209] mb-1">
            Delete <span className="font-bold">"{project.title}"</span>?
          </p>
          <p className="text-xs text-[#7a6a52] font-mono mb-4">{project.subject?.code} · {project.subject?.name}</p>
          <p className="text-xs text-[#c0392b] bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm mb-5">
            This cannot be undone. All associated submissions will also be removed.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={deleting}
              className="flex-1 py-2 border border-[#c8b89a] text-sm text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm font-mono transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={deleting}
              className="flex-1 py-2 text-sm font-semibold rounded-sm transition-colors disabled:opacity-50"
              style={{ background: '#c0392b', color: '#fff', border: '1px solid rgba(192,57,43,0.4)' }}>
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherProjectsPage() {
  const [projects,       setProjects]       = useState<Project[]>([])
  const [subjects,       setSubjects]       = useState<Subject[]>([])
  const [loading,        setLoading]        = useState(true)
  const [filter,         setFilter]         = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [showForm,       setShowForm]       = useState(false)
  const [editProject,    setEditProject]    = useState<Project | null>(null)
  const [form,           setForm]           = useState(EMPTY)
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState('')
  const [deleteTarget,   setDeleteTarget]   = useState<Project | null>(null)
  const [deleting,       setDeleting]       = useState(false)
  const [monitorProject, setMonitorProject] = useState<Project | null>(null)

  async function load() {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/teacher/projects'),
        fetch('/api/teacher/subjects'),
      ])
      // Use safeJson so empty or non-JSON responses don't crash the page
      const pData = await safeJson<Project[]>(pRes)
      const sData = await safeJson<Subject[]>(sRes)
      setProjects(Array.isArray(pData) ? pData : [])
      setSubjects(Array.isArray(sData) ? sData : [])
    } catch {
      setProjects([]); setSubjects([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditProject(null); setForm(EMPTY); setError(''); setShowForm(true) }

  function openEdit(p: Project) {
    setEditProject(p)
    setForm({
      title:       p.title,
      description: p.description,
      subject:     p.subject?._id ?? '',
      maxScore:    p.maxScore,
      deadline:    p.deadline ? p.deadline.slice(0, 10) : '',
      fileUrl:     p.fileUrl  ?? '',
      fileName:    p.fileName ?? '',
    })
    setError(''); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true)
    const url    = editProject ? `/api/teacher/projects/${editProject._id}` : '/api/teacher/projects'
    const method = editProject ? 'PATCH' : 'POST'
    try {
      const res  = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileUrl: form.fileUrl || null, fileName: form.fileName || null }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        setError(data?.error ?? `Request failed (${res.status})`)
        return
      }
      setShowForm(false); load()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/teacher/projects/${deleteTarget._id}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects(prev => prev.filter(p => p._id !== deleteTarget._id))
      } else {
        const data = await safeJson(res)
        setError(data?.error ?? `Delete failed (${res.status})`)
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = projects.filter(p => filter === 'all' || p.status === filter)
  const counts = {
    all:      projects.length,
    pending:  projects.filter(p => p.status === 'pending').length,
    approved: projects.filter(p => p.status === 'approved').length,
    rejected: projects.filter(p => p.status === 'rejected').length,
  }

  return (
    <div>
      <Link href="/teacher" suppressHydrationWarning
        className="inline-flex items-center gap-2 text-xs font-mono text-[#4a3828] hover:text-[#1a7a6e] mb-6 group transition-colors">
        <span suppressHydrationWarning className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Project Management</h1>
        </div>
        <RealTimeClock accentColor="#1a7a6e" />
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1a3a2a] text-[#d4a843] px-4 py-2 text-sm font-semibold border border-[rgba(212,168,67,0.3)] hover:bg-[#224d38] transition-colors rounded-sm shadow-[2px_2px_0_rgba(26,18,9,0.3)]">
          <IconAdd size={14} color="#d4a843" /> New Project
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm border transition-all ${
              filter === f ? 'bg-[#1a3a2a] text-[#d4a843] border-[rgba(212,168,67,0.4)]'
                          : 'bg-white text-[#7a6a52] border-[#c8b89a] hover:border-[#1a7a6e]'}`}>
            {STATUS_ICON_COMP[f] ? (() => { const IC = STATUS_ICON_COMP[f]; return <IC size={12} color="currentColor" /> })() : '📋'} {f} ({counts[f] ?? projects.length})
          </button>
        ))}
      </div>

      {/* Global error banner */}
      {error && (
        <div className="mb-4 text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-3 text-[#c0392b] hover:opacity-60 text-base leading-none">×</button>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1a3a2a] px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-[#d4a843] font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                {editProject ? (editProject.status === 'rejected' ? '↺ Resubmit Project' : 'Edit Project') : 'Create Project'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[rgba(250,246,238,0.4)] hover:text-white text-xl">
                <IconClose size={16} color="currentColor" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">{error}</div>
              )}
              {editProject?.status === 'rejected' && editProject.adminNote && (
                <div className="text-[#8b5a2b] text-xs bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.25)] px-3 py-2 rounded-sm">
                  <strong>Admin note:</strong> {editProject.adminNote}
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Project Title</label>
                <input type="text" placeholder="e.g. Science Fair Report" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]" />
              </div>
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
                <FileUpload value={form.fileUrl ?? ''} onChange={(url, name) => setForm(p => ({ ...p, fileUrl: url, fileName: name }))} accentColor="#1a7a6e" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-[#c8b89a] text-sm text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 bg-[#1a3a2a] text-[#d4a843] text-sm font-semibold rounded-sm disabled:opacity-50">
                  {submitting ? 'Saving…' : editProject ? 'Resubmit' : 'Create & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm popup */}
      {deleteTarget && (
        <DeleteConfirmPopup
          project={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* Submission monitor modal */}
      {monitorProject && <SubmissionMonitorModal project={monitorProject} onClose={() => setMonitorProject(null)} />}

      {/* Projects */}
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading projects…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3"><IconProjects size={40} color="#c8b89a" /></div>
          <p className="text-[#7a6a52] text-sm">No {filter !== 'all' ? filter : ''} projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const lateCount = p.late ?? 0
            const onTime    = Math.max(0, p.submitted - lateCount)
            const notSub    = p.totalStudents - p.submitted
            return (
              <div key={p._id} className={`bg-white border rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] transition-all ${
                p.warnUnsubmitted ? 'border-[rgba(212,168,67,0.5)]' : 'border-[#c8b89a]'}`}>

                {p.warnUnsubmitted && (
                  <div className="flex items-center gap-2 mb-3 text-xs bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.25)] px-3 py-1.5 rounded-sm"
                    style={{ color: getDaysLeft(p.deadline).color }}>
                    <IconWarning size={14} color={getDaysLeft(p.deadline).color} />
                    <strong className="text-[#8b5a2b]">{p.unsubmitted} student{p.unsubmitted !== 1 ? 's' : ''}</strong>
                    <span className="text-[#8b5a2b]"> haven't submitted — </span>
                    <strong>{getDaysLeft(p.deadline).label}</strong>!
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-xs font-mono px-2 py-0.5 border rounded-sm capitalize flex items-center gap-1 ${STATUS_STYLE[p.status]}`}>
                        {STATUS_ICON_COMP[p.status] && (() => { const IC = STATUS_ICON_COMP[p.status]; return <IC size={12} color="currentColor" /> })()}
                        {p.status}
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
                      <span className="flex items-center gap-1"><IconCalendar size={12} color="#7a6a52" /> {new Date(p.deadline).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><IconTrophy size={12} color="#7a6a52" /> Max {p.maxScore}pts</span>
                      <span className="flex items-center gap-1"><IconSubmitted size={12} color="#7a6a52" /> {p.submitted}/{p.totalStudents} submitted</span>
                      <span className="flex items-center gap-1"><IconRefresh size={12} color="#7a6a52" /> {p.graded} graded</span>
                    </div>

                    {/* Project reference attachment */}
                    {p.fileUrl && (
                      <div className="mt-2">
                        <FilePreviewButton
                          url={p.fileUrl}
                          fileName={p.fileName || undefined}
                          label="document"
                          accentColor="#1a7a6e"
                          compact
                        />
                      </div>
                    )}

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

                    {p.status === 'approved' && p.totalStudents > 0 && (
                      <div className="mt-3 p-3 bg-[#faf6ee] border border-[#e8dfc8] rounded-sm">
                        <div className="flex items-center gap-4 mb-2 flex-wrap text-xs font-mono">
                          <span className="flex items-center gap-1.5 text-[#1a7a6e]"><span className="w-2 h-2 rounded-full bg-[#1a7a6e] inline-block" />{onTime} on time</span>
                          <span className="flex items-center gap-1.5 text-[#8b5a2b]"><span className="w-2 h-2 rounded-full bg-[#d4a843] inline-block" />{lateCount} late</span>
                          <span className="flex items-center gap-1.5 text-[#c0392b]"><span className="w-2 h-2 rounded-full bg-[#c0392b] inline-block" />{notSub} not submitted</span>
                          <span className="text-[#7a6a52] ml-auto">{p.graded} graded</span>
                        </div>
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-[#f0e9d6]">
                          <div className="bg-[#1a7a6e]" style={{ width: `${(onTime / p.totalStudents) * 100}%` }} />
                          <div className="bg-[#d4a843]" style={{ width: `${(lateCount / p.totalStudents) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {p.status === 'approved' && p.submitted > 0 && (
                      <button onClick={() => setMonitorProject(p)}
                        className="text-xs px-3 py-1.5 bg-[#1a3a2a] text-[#d4a843] border border-[rgba(212,168,67,0.3)] hover:bg-[#224d38] rounded-sm transition-colors flex items-center gap-1.5">
                        <IconUsers size={12} color="currentColor" /> Submissions
                      </button>
                    )}
                    {(p.status === 'rejected' || p.status === 'pending') && (
                      <button onClick={() => openEdit(p)}
                        className="text-xs px-3 py-1.5 border border-[#c8b89a] hover:bg-[#f0e9d6] rounded-sm text-[#7a6a52] transition-colors flex items-center gap-1">
                        {p.status === 'rejected' ? <><IconRefresh size={12} color="currentColor" /> Resubmit</> : 'Edit'}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(p)}
                      disabled={deleting}
                      className="text-xs px-3 py-1.5 border border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)] rounded-sm text-[#c0392b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}