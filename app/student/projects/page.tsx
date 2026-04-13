'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock'
import {
  IconDraft, IconSubmitted, IconApproved, IconWarning,
  IconClose, IconTrash, IconSave, IconRefresh, IconCalendar, IconTrophy
} from '@/components/NavIcons'
import FileUpload from '@/components/FileUpload'
import { getDaysLeft } from '@/lib/dateUtils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubmissionVersion {
  version:      number
  fileUrl:      string
  textResponse: string
  submittedAt:  string | null
  isLate:       boolean
  grade:        number | null
  feedback:     string
  status:       string
}

interface Message {
  _id:        string
  senderName: string
  senderRole: 'teacher' | 'student'
  content:    string
  createdAt:  string
}

interface Subject { _id: string; name: string; code: string }

interface Submission {
  _id:            string
  status:         string
  fileUrl:        string
  textResponse:   string
  isLate:         boolean
  grade?:         number
  feedback?:      string
  submittedAt?:   string
  currentVersion: number
  versions:       SubmissionVersion[]
  redoRequested:  boolean
  redoReason?:    string
  messages:       Message[]
}

interface Project {
  _id:         string
  title:       string
  description: string
  deadline:    string
  maxScore:    number
  subject:     Subject
  submission:  Submission | null
}

interface SubjectGroup { _id: string; name: string; code: string; projects: Project[] }

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOverdue(deadline: string) {
  const d = new Date(deadline); d.setHours(0, 0, 0, 0)
  const t = new Date();         t.setHours(0, 0, 0, 0)
  return d < t
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Version History Modal ─────────────────────────────────────────────────────

function VersionsModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const sub = project.submission
  if (!sub) return null
  const sorted = [...(sub.versions ?? [])].sort((a, b) => b.version - a.version)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[6px_6px_0_#c8b89a] w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="bg-[#1a2535] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#63b3ed] font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>Version History</div>
            <div className="text-[rgba(250,246,238,0.45)] text-[11px] font-mono mt-0.5 truncate max-w-[320px]">{project.title}</div>
          </div>
          <button onClick={onClose} className="text-[rgba(250,246,238,0.35)] hover:text-white transition-colors">
            <IconClose size={15} color="currentColor" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sorted.length === 0 ? (
            <p className="text-center py-8 text-[#7a6a52] text-sm">No version history yet.</p>
          ) : sorted.map(v => (
            <div key={v.version}
              className={`border rounded-sm overflow-hidden ${v.version === sub.currentVersion ? 'border-[#63b3ed] bg-[rgba(99,179,237,0.03)]' : 'border-[#e8dfc8] bg-white opacity-80'}`}>
              <div className={`px-4 py-2.5 flex items-center justify-between ${v.version === sub.currentVersion ? 'bg-[rgba(99,179,237,0.08)]' : 'bg-[#faf6ee]'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${v.version === sub.currentVersion ? 'text-[#63b3ed] bg-[rgba(99,179,237,0.12)] border-[rgba(99,179,237,0.3)]' : 'text-[#7a6a52] bg-[#f0e9d6] border-[#c8b89a]'}`}>V{v.version}</span>
                  {v.version === sub.currentVersion && <span className="text-[10px] font-mono text-[#63b3ed]">Current</span>}
                  {v.isLate && <span className="text-[10px] font-mono text-[#c0392b]">🕐 Late</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${v.status === 'graded' ? 'text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] border-[rgba(26,122,110,0.25)]' : 'text-[#8b5a2b] bg-[rgba(139,90,43,0.06)] border-[rgba(139,90,43,0.2)]'}`}>
                    {v.status === 'graded' ? '✓ Graded' : '⟳ Submitted'}
                  </span>
                  <span className="text-[11px] font-mono text-[#7a6a52]">{fmt(v.submittedAt)}</span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {v.textResponse && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#7a6a52] mb-1">Your Response</p>
                    <p className="text-xs text-[#4a3828] bg-[#fdfcf8] border border-[#e8dfc8] rounded-sm p-2 leading-relaxed">
                      {v.textResponse.length > 200 ? v.textResponse.slice(0, 200) + '…' : v.textResponse}
                    </p>
                  </div>
                )}
                {v.fileUrl && (
                  <a href={v.fileUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#63b3ed] hover:underline">
                    🔗 View submitted file
                  </a>
                )}
                {v.feedback && (
                  <div className="p-2.5 bg-[rgba(26,122,110,0.04)] border border-[rgba(26,122,110,0.15)] rounded-sm">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#1a7a6e] mb-1">Teacher Feedback</p>
                    <p className="text-xs text-[#4a3828] leading-relaxed">{v.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Messages Panel ────────────────────────────────────────────────────────────

function MessagesPanel({ submissionId, messages: init, onNewMessage }: {
  submissionId: string; messages: Message[]; onNewMessage: () => void
}) {
  const [messages, setMessages] = useState(init)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMessages(init) }, [init])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/submissions/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, content: text.trim() }),
      })
      if (res.ok) { setMessages(await res.json()); setText(''); onNewMessage() }
    } finally { setSending(false) }
  }

  return (
    <div className="border-t border-[#f0e9d6] pt-3 mt-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[#7a6a52] mb-2">
        💬 Messages {messages.length > 0 && `(${messages.length})`}
      </p>
      {messages.length > 0 && (
        <div className="space-y-1.5 max-h-44 overflow-y-auto mb-2 pr-0.5">
          {messages.map(m => (
            <div key={m._id} className={`flex ${m.senderRole === 'student' ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[82%] rounded-sm px-2.5 py-1.5 text-xs ${m.senderRole === 'teacher' ? 'bg-[#f0e9d6] text-[#1a1209] border border-[#c8b89a]' : 'bg-[rgba(99,179,237,0.09)] text-[#1a1209] border border-[rgba(99,179,237,0.28)]'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-mono font-bold uppercase ${m.senderRole === 'teacher' ? 'text-[#8b5a2b]' : 'text-[#2b6cb0]'}`}>{m.senderName}</span>
                  <span className="text-[9px] font-mono text-[#a89880]">{fmt(m.createdAt)}</span>
                </div>
                <p className="leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Message your teacher…"
          className="flex-1 border border-[#c8b89a] rounded-sm px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#63b3ed]" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="px-3 py-1.5 text-xs bg-[#1a2535] text-[#63b3ed] border border-[rgba(99,179,237,0.3)] rounded-sm disabled:opacity-40 hover:bg-[#243040] transition-colors font-mono">
          Send
        </button>
      </div>
    </div>
  )
}

// ── Version Chips ─────────────────────────────────────────────────────────────

function VersionChips({ submission, onClick }: { submission: Submission; onClick: () => void }) {
  const versions = submission.versions ?? []
  if (versions.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {versions.map(v => (
        <span key={v.version} onClick={onClick} title={`V${v.version} — ${fmt(v.submittedAt)}`}
          className={`cursor-pointer text-[10px] font-mono font-bold px-2 py-0.5 border rounded transition-colors ${v.version === submission.currentVersion ? 'text-[#63b3ed] bg-[rgba(99,179,237,0.10)] border-[rgba(99,179,237,0.3)] hover:bg-[rgba(99,179,237,0.18)]' : 'text-[#7a6a52] bg-[#f0e9d6] border-[#c8b89a] hover:bg-[#e8dfc8]'}`}>
          V{v.version}
        </span>
      ))}
      <button onClick={onClick} className="text-[10px] font-mono text-[#7a6a52] hover:text-[#63b3ed] underline transition-colors">
        See all versions
      </button>
    </div>
  )
}

// ── Status badge config ───────────────────────────────────────────────────────

const LEFT_BADGE: Record<string, { label: string; style: string } | null> = {
  none:           { label: '○ Not submitted',       style: 'text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)]' },
  draft:          { label: '✎ Draft',               style: 'text-[#8b5a2b] bg-[rgba(139,90,43,0.08)] border-[rgba(139,90,43,0.25)]' },
  submitted:      null,
  graded:         null,
  redo_requested: { label: '🔄 Revision Requested', style: 'text-[#d4a843] bg-[rgba(212,168,67,0.08)] border-[rgba(212,168,67,0.35)]' },
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentProjectsPage() {
  const [subjects,       setSubjects]       = useState<SubjectGroup[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeProject,  setActiveProject]  = useState<Project | null>(null)
  const [versionProject, setVersionProject] = useState<Project | null>(null)
  const [commentProject, setCommentProject] = useState<Project | null>(null)
  const [openMsgSet,     setOpenMsgSet]     = useState<Set<string>>(new Set())
  const [formFileUrl,    setFormFileUrl]    = useState('')
  const [formText,       setFormText]       = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [savingDraft,    setSavingDraft]    = useState(false)
  const [error,          setError]          = useState('')

  async function load() {
    try {
      const res  = await fetch('/api/student/subjects')
      const data = await res.json()
      const safe = Array.isArray(data) ? data : []
      setSubjects(safe.filter((s: any) => (s.projects ?? []).length > 0))
    } catch { setSubjects([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openSubmit(project: Project) {
    setActiveProject(project)
    setFormFileUrl(project.submission?.fileUrl ?? '')
    setFormText(project.submission?.textResponse ?? '')
    setError('')
  }

  function toggleMessages(projectId: string) {
    setOpenMsgSet(prev => {
      const next = new Set(prev)
      next.has(projectId) ? next.delete(projectId) : next.add(projectId)
      return next
    })
  }

  // ── Submit handler — always POST ──────────────────────────────────────────
  // The API route handles both create and update via findOne + upsert logic.
  // There is no PATCH on this endpoint — POST covers everything.
  async function handleSubmit(isDraft: boolean) {
    if (!activeProject) return
    setError('')
    if (isDraft) setSavingDraft(true); else setSubmitting(true)

    try {
      const res = await fetch('/api/student/submissions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          projectId:    activeProject._id,
          fileUrl:      formFileUrl  || null,
          textResponse: formText     || null,
          isDraft,
        }),
      })

      // Safely parse response — server may return non-JSON on errors
      const contentType = res.headers.get('content-type') ?? ''
      const data = contentType.includes('application/json') ? await res.json() : null

      if (!res.ok) {
        setError(data?.error ?? `Server error (${res.status}). Please try again.`)
        return
      }

      setActiveProject(null)
      load()
    } catch (err) {
      console.error('[handleSubmit]', err)
      setError('Could not reach the server. Please check your connection.')
    } finally {
      setSavingDraft(false)
      setSubmitting(false)
    }
  }

  // ── Remove submission ─────────────────────────────────────────────────────
  async function handleDelete(submissionId: string) {
    if (!confirm('Remove this submission?')) return
    try {
      const res = await fetch('/api/student/submissions', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ submissionId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Could not remove submission.')
        return
      }
    } catch {
      setError('Network error. Please try again.')
      return
    }
    setActiveProject(null)
    load()
  }

  // Warning strip: redo requests + projects due within 7 days not yet submitted
  const allProjects = subjects.flatMap(s => s.projects)
  const warnings = allProjects.filter(p => {
    if (p.submission?.redoRequested) return true
    const sub = p.submission
    if (sub && (sub.status === 'submitted' || sub.status === 'graded')) return false
    const dl = getDaysLeft(p.deadline)
    return !isOverdue(p.deadline) && (dl.color === '#d4a843' || dl.color === '#c0392b')
  })

  return (
    <div>
      <Link href="/student"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#63b3ed] mb-6 group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Project Submissions</h1>
        <p className="text-[#7a6a52] text-sm mt-1">Submit your work, save drafts, or update existing submissions.</p>
      </div>
      <RealTimeClock accentColor="#63b3ed" />

      {/* ── Warning strip ── */}
      {warnings.length > 0 && (
        <div className="mt-4 mb-5 space-y-2">
          {warnings.map(p => {
            const isRedo = p.submission?.redoRequested
            const dl     = getDaysLeft(p.deadline)
            return (
              <div key={p._id}
                className={`flex items-center gap-3 rounded-sm px-4 py-2.5 border ${isRedo ? 'bg-[rgba(192,57,43,0.05)] border-[rgba(192,57,43,0.35)]' : 'bg-[rgba(212,168,67,0.07)] border-[rgba(212,168,67,0.4)]'}`}>
                <IconWarning size={17} color={isRedo ? '#c0392b' : dl.color} />
                <span className="text-sm flex-1" style={{ color: isRedo ? '#8b2020' : '#8b5a2b' }}>
                  {isRedo
                    ? <><strong>{p.title}</strong> — Teacher has requested a revision</>
                    : <><strong>{p.title}</strong> — {dl.label}!</>
                  }
                </span>
                <button onClick={() => openSubmit(p)}
                  className="shrink-0 text-xs px-3 py-1 bg-[#1a2535] text-[#63b3ed] rounded-sm border border-[rgba(99,179,237,0.3)] hover:bg-[#243040] transition-colors">
                  {isRedo ? 'Update Submission' : 'Submit now'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Submit / Edit Modal ── */}
      {activeProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="bg-[#1a2535] px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[#63b3ed] font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                  {activeProject.submission?.redoRequested
                    ? `Submit Revision — V${(activeProject.submission.currentVersion ?? 1) + 1}`
                    : activeProject.submission ? 'Update Submission' : 'Submit Project'}
                </h2>
                {activeProject.submission?.redoRequested && (
                  <p className="text-[rgba(250,246,238,0.4)] text-[11px] font-mono mt-0.5">
                    Previous version will be archived automatically
                  </p>
                )}
              </div>
              <button onClick={() => setActiveProject(null)} className="text-[rgba(250,246,238,0.4)] hover:text-white">
                <IconClose size={20} color="currentColor" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Project info */}
              <div className="p-3 bg-[#faf6ee] border border-[#c8b89a] rounded-sm">
                <div className="font-bold text-[#1a1209] text-sm" style={{ fontFamily: 'Georgia, serif' }}>{activeProject.title}</div>
                {(() => {
                  const dl = getDaysLeft(activeProject.deadline)
                  return (
                    <div className="text-xs mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono font-semibold" style={{ color: dl.color }}>
                        <IconCalendar size={12} color={dl.color} />
                        {dl.label} · {new Date(activeProject.deadline).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 text-[#7a6a52]">
                        <IconTrophy size={12} color="#7a6a52" /> {activeProject.maxScore}pts max
                      </span>
                    </div>
                  )
                })()}
                {activeProject.description && <p className="text-xs text-[#7a6a52] mt-1">{activeProject.description}</p>}
              </div>

              {/* Redo reason */}
              {activeProject.submission?.redoRequested && (
                <div className="p-3 bg-[rgba(192,57,43,0.05)] border border-[rgba(192,57,43,0.25)] rounded-sm">
                  <div className="text-xs font-mono text-[#c0392b] uppercase tracking-wider mb-1">🔄 Revision Requested by Teacher</div>
                  <p className="text-sm text-[#1a1209]">
                    {activeProject.submission.redoReason || 'Your teacher has requested you revise and resubmit this project.'}
                  </p>
                </div>
              )}

              {/* Previous feedback */}
              {activeProject.submission?.feedback && (
                <div className="p-3 bg-[rgba(26,122,110,0.05)] border border-[rgba(26,122,110,0.2)] rounded-sm">
                  <div className="text-xs font-mono text-[#1a7a6e] uppercase tracking-wider mb-1">Previous Teacher Feedback</div>
                  <p className="text-sm text-[#1a1209]">{activeProject.submission.feedback}</p>
                </div>
              )}

              {error && (
                <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1.5">Attach File</label>
                <FileUpload value={formFileUrl} onChange={url => setFormFileUrl(url)}
                  accentColor="#63b3ed" inputId="submission-file-upload" />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#e8dfc8]" />
                <span className="text-[10px] font-mono text-[#a89880] uppercase tracking-widest">or paste a link</span>
                <div className="flex-1 h-px bg-[#e8dfc8]" />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Google Drive / OneDrive Link</label>
                <input value={formFileUrl} onChange={e => setFormFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#63b3ed]" />
                <p className="text-xs text-[#7a6a52] mt-1">Paste a Google Drive, OneDrive, or any shareable link.</p>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Notes / Text Response (optional)</label>
                <textarea value={formText} onChange={e => setFormText(e.target.value)} rows={3}
                  placeholder="Add any notes for your teacher..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#63b3ed] resize-none" />
              </div>
            </div>

            <div className="shrink-0 px-6 pb-5 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {/* Remove button — only for non-graded, non-redo submissions */}
                {activeProject.submission &&
                  activeProject.submission.status !== 'graded' &&
                  !activeProject.submission.redoRequested && (
                  <button onClick={() => handleDelete(activeProject.submission!._id)}
                    className="text-xs px-3 py-2 border border-[rgba(192,57,43,0.3)] text-[#c0392b] rounded-sm hover:bg-[rgba(192,57,43,0.08)] transition-colors flex items-center gap-1">
                    <IconTrash size={13} color="currentColor" /> Remove
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  {/* Save Draft — hidden when redo is pending (must submit, not save draft) */}
                  {!activeProject.submission?.redoRequested && (
                    <button onClick={() => handleSubmit(true)} disabled={savingDraft || submitting}
                      className="text-xs px-4 py-2 border border-[#c8b89a] text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm disabled:opacity-50 transition-colors flex items-center gap-1">
                      {savingDraft ? 'Saving…' : <><IconSave size={13} color="currentColor" /> Save Draft</>}
                    </button>
                  )}
                  <button onClick={() => handleSubmit(false)}
                    disabled={submitting || savingDraft || (!formFileUrl && !formText)}
                    className="text-xs px-4 py-2 bg-[#1a2535] text-[#63b3ed] border border-[rgba(99,179,237,0.3)] rounded-sm hover:bg-[#243040] disabled:opacity-50 transition-colors font-semibold">
                    {submitting
                      ? 'Submitting…'
                      : activeProject.submission?.redoRequested ? '📤 Submit Revision' : '📤 Submit'}
                  </button>
                </div>
              </div>
              {!activeProject.submission?.redoRequested && (
                <p className="text-xs text-[#7a6a52] text-center">
                  Draft = saved privately. Submit = sent to teacher for grading.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Versions Modal ── */}
      {versionProject && <VersionsModal project={versionProject} onClose={() => setVersionProject(null)} />}

      {/* ── Teacher Feedback Modal ── */}
      {commentProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-sm">
            <div className="bg-[#1a2535] px-5 py-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-[#63b3ed] font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>Teacher Feedback</h2>
                <p className="text-[rgba(250,246,238,0.4)] text-[10px] font-mono mt-0.5 truncate max-w-[220px]">{commentProject.title}</p>
              </div>
              <button onClick={() => setCommentProject(null)}
                className="text-[rgba(250,246,238,0.4)] hover:text-white p-1 rounded-sm transition-colors">
                <IconClose size={16} color="currentColor" />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-[rgba(26,122,110,0.06)] border border-[rgba(26,122,110,0.2)] rounded-sm p-4">
                <p className="text-sm text-[#1a1209] leading-relaxed">{commentProject.submission?.feedback}</p>
              </div>
              <button onClick={() => setCommentProject(null)}
                className="mt-4 w-full py-2 border border-[#c8b89a] text-xs text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm transition-colors font-mono">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Project list ── */}
      {loading ? (
        <div className="mt-5 text-[#7a6a52] text-sm font-mono animate-pulse">Loading projects...</div>
      ) : subjects.length === 0 ? (
        <div className="mt-5 bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-[#7a6a52] text-sm">No projects assigned yet. Check back later!</p>
        </div>
      ) : subjects.map(subject => (
        <div key={subject._id} className="mt-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono text-[#c0392b] bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] px-2 py-0.5 rounded-sm">
              {subject.code}
            </span>
            <span className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{subject.name}</span>
          </div>

          <div className="space-y-3">
            {subject.projects.map(project => {
              const sub       = project.submission
              const subStatus = sub?.redoRequested ? 'redo_requested' : (sub?.status ?? 'none')
              const dl        = getDaysLeft(project.deadline)
              const overdue   = isOverdue(project.deadline)
              const leftBadge = LEFT_BADGE[subStatus]
              const msgCount  = sub?.messages?.length ?? 0
              const versCount = sub?.versions?.length ?? 0
              const isOpen    = openMsgSet.has(project._id)

              return (
                <div key={project._id}
                  className={`bg-white border rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] transition-all hover:shadow-[4px_4px_0_#c8b89a] ${
                    sub?.redoRequested ? 'border-[rgba(212,168,67,0.55)]' :
                    overdue && !sub   ? 'border-[rgba(192,57,43,0.4)]'   :
                    'border-[#c8b89a]'
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">

                      {/* Status badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {leftBadge && (
                          <span className={`text-xs font-mono px-2 py-0.5 border rounded-sm ${leftBadge.style}`}>
                            {leftBadge.label}
                          </span>
                        )}
                        {sub?.isLate && (
                          <span className="text-xs font-mono px-2 py-0.5 border rounded-sm text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)] flex items-center gap-1">
                            🕐 Late
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{project.title}</h3>
                      {project.description && <p className="text-xs text-[#7a6a52] mt-0.5 line-clamp-1">{project.description}</p>}

                      {/* Redo reason */}
                      {sub?.redoRequested && sub.redoReason && (
                        <div className="mt-2 px-2.5 py-2 bg-[rgba(212,168,67,0.06)] border border-[rgba(212,168,67,0.3)] rounded-sm">
                          <p className="text-xs text-[#8b5a2b]">
                            <span className="font-bold">Teacher's note: </span>{sub.redoReason}
                          </p>
                        </div>
                      )}

                      {/* Deadline */}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono items-center">
                        <span className="flex items-center gap-1 font-semibold" style={{ color: dl.color }}>
                          <IconCalendar size={12} color={dl.color} />
                          {dl.label}
                          <span className="font-normal text-[#7a6a52] ml-0.5">
                            · {new Date(project.deadline).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-[#7a6a52]">
                          <IconTrophy size={12} color="#7a6a52" /> {project.maxScore}pts
                        </span>
                      </div>

                      {/* Version chips */}
                      {versCount > 0 && sub && <VersionChips submission={sub} onClick={() => setVersionProject(project)} />}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {sub?.feedback && (
                          <button onClick={() => setCommentProject(project)}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-[rgba(26,122,110,0.3)] text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] hover:bg-[rgba(26,122,110,0.12)] rounded-sm transition-colors font-mono">
                            💬 Teacher feedback
                          </button>
                        )}
                        {sub?.fileUrl && (
                          <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#63b3ed] hover:underline font-mono">
                            🔗 Submitted file
                          </a>
                        )}
                        {sub && (
                          <button onClick={() => toggleMessages(project._id)}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border rounded-sm transition-colors font-mono ${isOpen ? 'border-[rgba(99,179,237,0.4)] text-[#63b3ed] bg-[rgba(99,179,237,0.09)]' : 'border-[#c8b89a] text-[#7a6a52] hover:border-[rgba(99,179,237,0.4)] hover:text-[#63b3ed]'}`}>
                            💬 Messages
                            {msgCount > 0 && (
                              <span className="ml-0.5 text-[10px] bg-[#63b3ed] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                {msgCount}
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {sub && isOpen && (
                        <MessagesPanel submissionId={sub._id} messages={sub.messages ?? []} onNewMessage={load} />
                      )}
                    </div>

                    {/* Right-side buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {subStatus === 'graded' && !sub?.redoRequested ? (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[rgba(26,122,110,0.3)] text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] rounded-sm font-mono">
                          ✓ Graded
                        </span>
                      ) : (
                        <button onClick={() => openSubmit(project)}
                          className={`text-xs px-4 py-2 rounded-sm border font-semibold flex items-center gap-1.5 transition-colors ${
                            sub?.redoRequested
                              ? 'bg-[#c0392b] text-white border-[rgba(192,57,43,0.5)] hover:bg-[#a93226]'
                              : 'bg-[#1a2535] text-[#63b3ed] border-[rgba(99,179,237,0.3)] hover:bg-[#243040]'
                          }`}>
                          {sub?.redoRequested
                            ? <><IconRefresh size={13} color="currentColor" /> Update Submission</>
                            : sub
                              ? sub.status === 'draft'
                                ? <><IconDraft size={13} color="currentColor" /> Edit Draft</>
                                : <><IconRefresh size={13} color="currentColor" /> Update</>
                              : <><IconSubmitted size={13} color="currentColor" /> Submit</>
                          }
                        </button>
                      )}
                      {versCount > 0 && (
                        <button onClick={() => setVersionProject(project)}
                          className="text-xs px-4 py-1.5 border border-[#c8b89a] text-[#7a6a52] hover:bg-[#f0e9d6] rounded-sm transition-colors font-mono text-center">
                          📋 See Versions ({versCount})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}