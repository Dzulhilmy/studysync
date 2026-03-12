'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock'
import Avatar from '@/components/Avatar'
import {
  IconClose, IconWarning, IconApproved, IconSubmitted,
  IconSave, IconPending, IconGrade, IconArrowLeft, IconInbox,
  IconTrophy, IconCalendar, IconEmpty, IconStudents,
  IconAttach, IconClock, IconRefresh,
} from '@/components/NavIcons'

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

interface StudentProgress {
  _id: string; name: string; email: string
  submitted: number; graded: number; totalProjects: number
  progressPct: number; avgGrade: number | null
  avatarUrl?: string | null
}
interface SubjectGroup {
  subject: { _id: string; name: string; code: string }
  students: StudentProgress[]
  totalProjects: number
}
interface SubmissionRow {
  project: { _id: string; title: string; maxScore: number; deadline: string }
  submission: {
    _id: string; status: string
    grade: number | null; feedback: string
    fileUrl: string; textResponse: string
    submittedAt: string | null; isLate: boolean
    currentVersion: number
    versions:       SubmissionVersion[]
    redoRequested:  boolean
    redoReason:     string
    messages:       Message[]
  } | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REDO_THRESHOLD    = 0.85   // 85% of maxScore
const PROJECTS_PER_PAGE = 10     // [NEW] pagination

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeColor(avg: number | null) {
  if (avg === null) return '#c8b89a'
  if (avg >= 80)    return '#1a7a6e'
  if (avg >= 60)    return '#d4a843'
  return                   '#c0392b'
}

function gradeLabel(avg: number | null) {
  if (avg === null) return null
  if (avg >= 80)    return 'Excellent'
  if (avg >= 60)    return 'Good'
  return                   'Needs help'
}

function daysLeft(deadline: string) {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, color: '#c0392b' }
  if (diff === 0) return { label: 'Due today',                  color: '#c0392b' }
  return                 { label: `${diff}d left`,              color: diff <= 7 ? '#d4a843' : '#7a6a52' }
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-[#f0e9d6] rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── [NEW] Per-project mini progress ──────────────────────────────────────────

function ProjectMiniProgress({
  submission,
  maxScore,
}: {
  submission: SubmissionRow['submission']
  maxScore:   number
}) {
  if (!submission) return null

  const versCount   = submission.versions?.length ?? 0
  const latestGrade = submission.grade
  const passed      = latestGrade !== null && latestGrade / maxScore >= REDO_THRESHOLD
  const pct         = passed ? 100 : latestGrade !== null ? Math.round((latestGrade / maxScore) * 100) : versCount > 0 ? 40 : 10

  const statusLabel = passed
    ? `✓ Passed — ${latestGrade}/${maxScore}`
    : latestGrade !== null
      ? `Not yet passing — ${latestGrade}/${maxScore}`
      : versCount > 0
        ? `${versCount} version${versCount > 1 ? 's' : ''} submitted, awaiting grade`
        : 'Submitted — awaiting grade'

  const barColor = passed ? '#1a7a6e' : latestGrade !== null ? '#c0392b' : '#d4a843'

  return (
    <div className="mt-2.5 pt-2.5 border-t border-[#f0e9d6]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider">Project Progress</span>
        <span className="text-[10px] font-mono font-semibold" style={{ color: barColor }}>{statusLabel}</span>
      </div>
      <ProgressBar pct={pct} color={barColor} />
    </div>
  )
}

// ── [NEW] Version grades popup (for >3 versions) ─────────────────────────────

function VersionGradesPopup({
  versions,
  maxScore,
  currentVersion,
  onClose,
}: {
  versions:       SubmissionVersion[]
  maxScore:       number
  currentVersion: number
  onClose:        () => void
}) {
  const sorted = [...versions].sort((a, b) => b.version - a.version)
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-[#c8b89a] rounded-sm shadow-[6px_6px_0_#c8b89a] w-full max-w-sm max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#1a3a2a] px-4 py-3 flex items-center justify-between shrink-0">
          <span className="text-[#d4a843] text-xs font-mono uppercase tracking-wider">
            All Versions — Grades
          </span>
          <button onClick={onClose} className="text-[rgba(250,246,238,0.4)] hover:text-white transition-colors">
            <IconClose size={13} color="currentColor" />
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {sorted.map(v => {
            const passed    = v.grade !== null && v.grade / maxScore >= REDO_THRESHOLD
            const isCurrent = v.version === currentVersion
            return (
              <div key={v.version}
                className={`flex items-center justify-between px-3 py-2 rounded-sm border ${
                  isCurrent ? 'border-[#1a7a6e] bg-[rgba(26,122,110,0.04)]' : 'border-[#e8dfc8] bg-[#fdfcf8]'
                }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isCurrent
                      ? 'text-[#1a7a6e] bg-[rgba(26,122,110,0.1)] border-[rgba(26,122,110,0.3)]'
                      : 'text-[#7a6a52] bg-[#f0e9d6] border-[#c8b89a]'
                  }`}>V{v.version}</span>
                  {isCurrent && <span className="text-[9px] font-mono text-[#1a7a6e]">Latest</span>}
                  {v.isLate   && <span className="text-[9px] font-mono text-[#c0392b]">Late</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#7a6a52]">{fmt(v.submittedAt)}</span>
                  {v.grade !== null ? (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      passed
                        ? 'text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]'
                        : 'text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.25)]'
                    }`}>
                      {v.grade}/{maxScore} {passed ? '✓' : '✗'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#c8b89a] italic">No grade yet</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── [NEW] Version chips: inline grades (≤3) or popup trigger (>3) ─────────────

function VersionChips({
  submission,
  maxScore,
  onOpenVersionsModal,
}: {
  submission:          SubmissionRow['submission']
  maxScore:            number
  onOpenVersionsModal: () => void
}) {
  const [showPopup, setShowPopup] = useState(false)
  if (!submission) return null
  const versions  = submission.versions ?? []
  const versCount = versions.length
  if (versCount === 0) return null

  const sorted = [...versions].sort((a, b) => a.version - b.version)

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {versCount <= 3 ? (
        // Show each chip with grade inline
        sorted.map(v => {
          const passed    = v.grade !== null && v.grade / maxScore >= REDO_THRESHOLD
          const hasGrade  = v.grade !== null
          const isCurrent = v.version === submission.currentVersion
          return (
            <span
              key={v.version}
              onClick={onOpenVersionsModal}
              title={`V${v.version} — ${fmt(v.submittedAt)}${hasGrade ? ` · ${v.grade}/${maxScore}` : ''}`}
              className={`cursor-pointer text-[10px] font-mono font-bold px-2 py-0.5 border rounded transition-colors flex items-center gap-1 ${
                isCurrent
                  ? 'text-[#1a7a6e] bg-[rgba(26,122,110,0.1)] border-[rgba(26,122,110,0.3)] hover:bg-[rgba(26,122,110,0.18)]'
                  : 'text-[#7a6a52] bg-[#f0e9d6] border-[#c8b89a] hover:bg-[#e8dfc8]'
              }`}
            >
              V{v.version}
              {hasGrade && (
                <span className={`ml-0.5 font-normal ${passed ? 'text-[#1a7a6e]' : 'text-[#c0392b]'}`}>
                  · {v.grade}/{maxScore} {passed ? '✓' : '✗'}
                </span>
              )}
            </span>
          )
        })
      ) : (
        // >3 versions: show first 2 + a popup trigger for the rest
        <>
          {showPopup && (
            <VersionGradesPopup
              versions={versions}
              maxScore={maxScore}
              currentVersion={submission.currentVersion}
              onClose={() => setShowPopup(false)}
            />
          )}
          {sorted.slice(0, 2).map(v => {
            const passed    = v.grade !== null && v.grade / maxScore >= REDO_THRESHOLD
            const hasGrade  = v.grade !== null
            const isCurrent = v.version === submission.currentVersion
            return (
              <span key={v.version} onClick={onOpenVersionsModal}
                className={`cursor-pointer text-[10px] font-mono font-bold px-2 py-0.5 border rounded transition-colors flex items-center gap-1 ${
                  isCurrent
                    ? 'text-[#1a7a6e] bg-[rgba(26,122,110,0.1)] border-[rgba(26,122,110,0.3)]'
                    : 'text-[#7a6a52] bg-[#f0e9d6] border-[#c8b89a]'
                }`}>
                V{v.version}
                {hasGrade && (
                  <span className={`ml-0.5 font-normal ${passed ? 'text-[#1a7a6e]' : 'text-[#c0392b]'}`}>
                    · {v.grade}/{maxScore} {passed ? '✓' : '✗'}
                  </span>
                )}
              </span>
            )
          })}
          <button
            onClick={() => setShowPopup(true)}
            title="View all versions and grades"
            className="text-[10px] font-mono font-bold px-2 py-0.5 border rounded transition-colors flex items-center gap-1 text-[#d4a843] bg-[rgba(212,168,67,0.08)] border-[rgba(212,168,67,0.35)] hover:bg-[rgba(212,168,67,0.18)]"
          >
            +{versCount - 2} more ▾
          </button>
        </>
      )}

      <button onClick={onOpenVersionsModal}
        className="text-[10px] font-mono text-[#7a6a52] hover:text-[#1a7a6e] underline transition-colors ml-0.5">
        See all versions
      </button>
    </div>
  )
}

// ── Version History Modal ─────────────────────────────────────────────────────

function VersionsModal({
  projectTitle,
  submission,
  maxScore,
  onClose,
}: {
  projectTitle: string
  submission:   SubmissionRow['submission']
  maxScore:     number
  onClose:      () => void
}) {
  if (!submission) return null
  const sorted = [...(submission.versions ?? [])].sort((a, b) => b.version - a.version)

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[6px_6px_0_#c8b89a] w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="bg-[#1a3a2a] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#d4a843] text-xs font-mono uppercase tracking-wider">Version History</div>
            <div className="text-[rgba(250,246,238,0.6)] text-sm font-bold mt-0.5 truncate max-w-[320px]"
              style={{ fontFamily: 'Georgia, serif' }}>{projectTitle}</div>
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
              className={`border rounded-sm overflow-hidden ${
                v.version === submission.currentVersion
                  ? 'border-[#1a7a6e]'
                  : 'border-[#e8dfc8] opacity-80'
              }`}>

              <div className={`px-4 py-2.5 flex items-center justify-between ${
                v.version === submission.currentVersion ? 'bg-[rgba(26,122,110,0.06)]' : 'bg-[#faf6ee]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    v.version === submission.currentVersion
                      ? 'text-[#1a7a6e] bg-[rgba(26,122,110,0.1)] border-[rgba(26,122,110,0.3)]'
                      : 'text-[#7a6a52] bg-[#f0e9d6] border-[#c8b89a]'
                  }`}>V{v.version}</span>
                  {v.version === submission.currentVersion && (
                    <span className="text-[10px] font-mono text-[#1a7a6e]">Latest</span>
                  )}
                  {v.isLate && <span className="text-[10px] font-mono text-[#c0392b]">🕐 Late</span>}
                </div>
                <div className="flex items-center gap-2">
                  {v.grade !== null && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      v.grade / maxScore >= REDO_THRESHOLD
                        ? 'text-[#1a7a6e] border-[rgba(26,122,110,0.25)] bg-[rgba(26,122,110,0.06)]'
                        : 'text-[#c0392b] border-[rgba(192,57,43,0.25)] bg-[rgba(192,57,43,0.06)]'
                    }`}>{v.grade}/{maxScore}</span>
                  )}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    v.status === 'graded'
                      ? 'text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] border-[rgba(26,122,110,0.25)]'
                      : 'text-[#8b5a2b] bg-[rgba(139,90,43,0.06)] border-[rgba(139,90,43,0.2)]'
                  }`}>
                    {v.status === 'graded' ? '✓ Graded' : '⟳ Submitted'}
                  </span>
                  <span className="text-[11px] font-mono text-[#7a6a52]">{fmt(v.submittedAt)}</span>
                </div>
              </div>

              <div className="px-4 py-3 space-y-2">
                {v.textResponse && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#7a6a52] mb-1">Student's Response</p>
                    <p className="text-xs text-[#4a3828] bg-[#fdfcf8] border border-[#e8dfc8] rounded-sm p-2 leading-relaxed">
                      {v.textResponse.length > 200 ? v.textResponse.slice(0, 200) + '…' : v.textResponse}
                    </p>
                  </div>
                )}
                {v.fileUrl && (
                  <a href={v.fileUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#1a7a6e] hover:underline">
                    <IconAttach size={11} color="currentColor" /> View submitted file
                  </a>
                )}
                {v.feedback && (
                  <div className="p-2.5 bg-[rgba(26,122,110,0.04)] border border-[rgba(26,122,110,0.15)] rounded-sm">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#1a7a6e] mb-1">Your Feedback</p>
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

// ── Messages Panel (teacher side) ────────────────────────────────────────────

function TeacherMessagesPanel({
  submissionId,
  messages: init,
  onNewMessage,
}: {
  submissionId:  string
  messages:      Message[]
  onNewMessage:  () => void
}) {
  const [messages, setMessages] = useState(init)
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMessages(init) },             [init])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/submissions/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, content: text.trim() }),
      })
      if (res.ok) {
        setMessages(await res.json())
        setText('')
        onNewMessage()
      }
    } finally { setSending(false) }
  }

  return (
    <div className="border-t border-[#f0e9d6] pt-3 mt-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[#7a6a52] mb-2">
        💬 Student Messages {messages.length > 0 && `(${messages.length})`}
      </p>
      {messages.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto mb-2 pr-0.5">
          {messages.map(m => (
            <div key={m._id}
              className={`flex ${m.senderRole === 'teacher' ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[82%] rounded-sm px-2.5 py-1.5 text-xs ${
                m.senderRole === 'teacher'
                  ? 'bg-[#1a3a2a] text-[#faf6ee] border border-[rgba(212,168,67,0.2)]'
                  : 'bg-[#f0e9d6] text-[#1a1209] border border-[#c8b89a]'
              }`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-mono font-bold uppercase ${
                    m.senderRole === 'teacher' ? 'text-[#d4a843]' : 'text-[#7a6a52]'
                  }`}>{m.senderName}</span>
                  <span className="text-[9px] font-mono opacity-50">{fmt(m.createdAt)}</span>
                </div>
                <p className="leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Reply to student…"
          className="flex-1 border border-[#c8b89a] rounded-sm px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1a7a6e]"
          style={{ color: '#1a1209' }}
        />
        <button onClick={send} disabled={sending || !text.trim()}
          className="px-3 py-1.5 text-xs rounded-sm disabled:opacity-40 transition-colors font-mono"
          style={{ background: '#1a3a2a', color: '#d4a843', border: '1px solid rgba(212,168,67,0.3)' }}>
          Send
        </button>
      </div>
    </div>
  )
}

// ── Grading Panel ─────────────────────────────────────────────────────────────

function GradingPanel({
  student, subjectId, onClose, onSaved,
}: {
  student:   StudentProgress
  subjectId: string
  onClose:   () => void
  onSaved:   (studentId: string) => void
}) {
  const [rows,           setRows]           = useState<SubmissionRow[]>([])
  const [loading,        setLoading]        = useState(true)
  const [inputs,         setInputs]         = useState<Record<string, {
    grade: string; feedback: string; saving: boolean; saved: boolean; error: string
  }>>({})
  const [openMsgSet,     setOpenMsgSet]     = useState<Set<string>>(new Set())
  const [versionFor,     setVersionFor]     = useState<SubmissionRow | null>(null)
  const [redoFor,        setRedoFor]        = useState<string | null>(null)
  const [redoReason,     setRedoReason]     = useState('')
  const [sendingRedo,    setSendingRedo]    = useState(false)
  const [belowThreshold, setBelowThreshold] = useState<Set<string>>(new Set())
  // [NEW] Pagination state
  const [currentPage,    setCurrentPage]    = useState(1)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/teacher/students/submissions?studentId=${student._id}&subjectId=${subjectId}`)
      .then(async r => {
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `HTTP ${r.status}`) }
        return r.json()
      })
      .then((data: SubmissionRow[]) => {
        setRows(Array.isArray(data) ? data : [])
        const init: typeof inputs = {}
        data.forEach(row => {
          if (row.submission) {
            init[row.submission._id] = {
              grade: row.submission.grade?.toString() ?? '',
              feedback: row.submission.feedback ?? '',
              saving: false, saved: false, error: '',
            }
          }
        })
        setInputs(init)
      })
      .catch(err => { console.error('[submissions]', err.message); setRows([]) })
      .finally(() => setLoading(false))
  }, [student._id, subjectId])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !versionFor && !redoFor) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, versionFor, redoFor])

  function setField(subId: string, field: 'grade' | 'feedback', value: string) {
    if (field === 'grade') {
      setBelowThreshold(prev => { const n = new Set(prev); n.delete(subId); return n })
    }
    setInputs(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value, saved: false, error: '' } }))
  }

  async function saveGrade(subId: string, maxScore: number) {
    const inp = inputs[subId]
    if (!inp) return
    const gradeNum = Number(inp.grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > maxScore) {
      setInputs(prev => ({ ...prev, [subId]: { ...prev[subId], error: `Grade must be 0–${maxScore}` } }))
      return
    }
    setInputs(prev => ({ ...prev, [subId]: { ...prev[subId], saving: true, error: '' } }))
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: subId, grade: gradeNum, feedback: inp.feedback }),
      })
      if (!res.ok) throw new Error()
      setInputs(prev => ({ ...prev, [subId]: { ...prev[subId], saving: false, saved: true } }))
      setRows(prev => prev.map(r =>
        r.submission?._id === subId
          ? { ...r, submission: { ...r.submission!, grade: gradeNum, feedback: inp.feedback, status: 'graded' } }
          : r
      ))
      if (gradeNum / maxScore < REDO_THRESHOLD) {
        setBelowThreshold(prev => new Set([...prev, subId]))
      }
      onSaved(student._id)
    } catch {
      setInputs(prev => ({ ...prev, [subId]: { ...prev[subId], saving: false, error: 'Failed to save. Try again.' } }))
    }
  }

  async function sendRedoRequest(subId: string) {
    setSendingRedo(true)
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: subId, requestRedo: true, redoReason }),
      })
      if (res.ok) {
        setRows(prev => prev.map(r =>
          r.submission?._id === subId
            ? { ...r, submission: { ...r.submission!, redoRequested: true, redoReason } }
            : r
        ))
        setBelowThreshold(prev => { const n = new Set(prev); n.delete(subId); return n })
        setRedoFor(null); setRedoReason('')
        onSaved(student._id)
      }
    } finally { setSendingRedo(false) }
  }

  function toggleMessages(subId: string) {
    setOpenMsgSet(prev => {
      const next = new Set(prev)
      next.has(subId) ? next.delete(subId) : next.add(subId)
      return next
    })
  }

  // [NEW] Paginate all rows
  const totalPages = Math.max(1, Math.ceil(rows.length / PROJECTS_PER_PAGE))
  const pagedRows  = rows.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE
  )
  const submitted    = pagedRows.filter(r => r.submission && r.submission.status !== 'pending' && r.submission.status !== 'draft')
  const notSubmitted = pagedRows.filter(r => !r.submission || r.submission.status === 'pending' || r.submission.status === 'draft')

  return (
    <>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" />

      {versionFor && (
        <VersionsModal
          projectTitle={versionFor.project.title}
          submission={versionFor.submission}
          maxScore={versionFor.project.maxScore}
          onClose={() => setVersionFor(null)}
        />
      )}

      {redoFor && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="bg-[#1a3a2a] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[#d4a843] text-xs font-mono uppercase tracking-wider">Request Revision</div>
                <div className="text-[rgba(250,246,238,0.5)] text-[11px] font-mono mt-0.5">Student will be notified</div>
              </div>
              <button onClick={() => { setRedoFor(null); setRedoReason('') }}
                className="text-[rgba(250,246,238,0.35)] hover:text-white">
                <IconClose size={15} color="currentColor" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                  Reason / Instructions for student
                </label>
                <textarea
                  value={redoReason}
                  onChange={e => setRedoReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. Please revise the analysis section — your conclusion needs more supporting evidence..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e] resize-none"
                  style={{ color: '#1a1209' }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setRedoFor(null); setRedoReason('') }}
                  className="flex-1 py-2 border border-[#c8b89a] text-xs text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm font-mono">
                  Cancel
                </button>
                <button onClick={() => sendRedoRequest(redoFor)} disabled={sendingRedo}
                  className="flex-1 py-2 text-xs font-semibold rounded-sm disabled:opacity-50 transition-colors"
                  style={{ background: '#1a3a2a', color: '#d4a843', border: '1px solid rgba(212,168,67,0.3)' }}>
                  {sendingRedo ? 'Sending…' : '🔄 Send Redo Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={panelRef}
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: 'min(600px, 100vw)',
          background: '#faf6ee',
          borderLeft: '2px solid #c8b89a',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          animation: 'slideIn .28s cubic-bezier(.22,1,.36,1)',
        }}>

        {/* Panel header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#c8b89a] shrink-0" style={{ background: '#1a3a2a' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={student.avatarUrl} name={student.name} role="student" size={40} />
              <div>
                <div className="font-bold text-[#faf6ee] text-sm flex items-center gap-1.5" style={{ fontFamily: 'Georgia, serif' }}>
                  <IconStudents color="currentColor" size={14} /> {student.name}
                </div>
                <div className="text-[11px] font-mono" style={{ color: 'rgba(250,246,238,0.45)' }}>
                  {student.email}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 transition-colors"
              style={{ color: 'rgba(250,246,238,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,246,238,0.35)')}>
              <IconClose size={14} color="currentColor" />
            </button>
          </div>
          <div className="flex gap-5 mt-3.5">
            {([
              ['Submitted', `${student.submitted}/${student.totalProjects}`, '#d4a843'],
              ['Graded',    `${student.graded}`,                             '#4ade80'],
              ['Avg Grade', student.avgGrade !== null ? `${student.avgGrade}` : '—', gradeColor(student.avgGrade)],
            ] as const).map(([label, value, color]) => (
              <div key={label}>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'rgba(250,246,238,0.38)' }}>{label}</div>
                <div className="text-lg font-bold" style={{ color, fontFamily: 'Georgia, serif' }}>{value}</div>
              </div>
            ))}
            {student.submitted > student.graded && (
              <div className="ml-auto self-end pb-0.5">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm flex items-center gap-1"
                  style={{ background: 'rgba(212,168,67,0.15)', color: '#d4a843', border: '1px solid rgba(212,168,67,0.3)' }}>
                  <IconWarning size={12} color="#d4a843" />
                  {student.submitted - student.graded} awaiting grade
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="text-center py-14 text-[#7a6a52] text-sm font-mono animate-pulse">Loading submissions…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-14">
              <IconEmpty size={36} color="#c8b89a" />
              <p className="text-[#7a6a52] text-sm mt-2">No projects found for this subject.</p>
            </div>
          ) : (
            <>
              {/* [NEW] Page info */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#7a6a52]">
                    Showing {(currentPage - 1) * PROJECTS_PER_PAGE + 1}–{Math.min(currentPage * PROJECTS_PER_PAGE, rows.length)} of {rows.length} projects
                  </span>
                  <span className="text-[11px] font-mono text-[#7a6a52]">Page {currentPage}/{totalPages}</span>
                </div>
              )}

              {submitted.length > 0 && (
                <section>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#7a6a52] mb-2.5">
                    Submissions ({submitted.length})
                  </p>
                  <div className="space-y-4">
                    {submitted.map(row => {
                      const sub        = row.submission!
                      const inp        = inputs[sub._id] ?? { grade: '', feedback: '', saving: false, saved: false, error: '' }
                      const dl         = daysLeft(row.project.deadline)
                      const needsGrade = sub.status !== 'graded'
                      const msgCount   = sub.messages?.length ?? 0
                      const isBelow    = belowThreshold.has(sub._id)
                      const isMsgOpen  = openMsgSet.has(sub._id)
                      const gradeRatio = inp.grade !== '' && !isNaN(Number(inp.grade))
                        ? Number(inp.grade) / row.project.maxScore : null

                      return (
                        <div key={sub._id}
                          className="bg-white rounded-sm overflow-hidden"
                          style={{
                            border:     `1px solid ${sub.redoRequested ? '#d4a843' : needsGrade ? '#1a7a6e' : '#c8b89a'}`,
                            borderLeft: `3px solid ${sub.redoRequested ? '#d4a843' : needsGrade ? '#1a7a6e' : '#c8b89a'}`,
                            boxShadow:  '2px 2px 0 #e8dfc8',
                          }}>

                          {/* ── Submission header ── */}
                          <div className="px-4 pt-3 pb-2.5 border-b border-[#f0e9d6]">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="font-semibold text-[#1a1209] text-sm leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
                                {row.project.title}
                              </div>
                              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                {sub.redoRequested && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1"
                                    style={{ border: '1px solid rgba(212,168,67,0.4)', color: '#b8882a', background: 'rgba(212,168,67,0.06)' }}>
                                    <IconRefresh size={11} color="currentColor" /> Redo Requested
                                  </span>
                                )}
                                {sub.isLate && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1"
                                    style={{ border: '1px solid rgba(192,57,43,0.3)', color: '#c0392b', background: 'rgba(192,57,43,0.05)' }}>
                                    <IconClock size={12} color="currentColor" /> Late
                                  </span>
                                )}
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1"
                                  style={{
                                    border:     `1px solid ${sub.status === 'graded' ? 'rgba(26,122,110,0.3)' : 'rgba(212,168,67,0.3)'}`,
                                    color:       sub.status === 'graded' ? '#1a7a6e' : '#b8882a',
                                    background:  sub.status === 'graded' ? 'rgba(26,122,110,0.06)' : 'rgba(212,168,67,0.06)',
                                  }}>
                                  {sub.status === 'graded'
                                    ? <><IconApproved size={11} color="currentColor" /><span>Graded</span></>
                                    : <><IconInbox    size={11} color="currentColor" /><span>Submitted</span></>
                                  }
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <span className="text-[11px] font-mono text-[#7a6a52] flex items-center gap-1">
                                <IconTrophy size={11} color="#7a6a52" /> Max: {row.project.maxScore}pts
                              </span>
                              <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: dl.color }}>
                                <IconCalendar size={11} color={dl.color} /> {dl.label} · {fmt(row.project.deadline)}
                              </span>
                              {sub.submittedAt && (
                                <span className="text-[11px] font-mono text-[#7a6a52] flex items-center gap-1">
                                  <IconSubmitted size={11} color="#7a6a52" /> {fmt(sub.submittedAt)}
                                </span>
                              )}
                            </div>

                            {/* [NEW] Version chips with per-version grades */}
                            <VersionChips
                              submission={sub}
                              maxScore={row.project.maxScore}
                              onOpenVersionsModal={() => setVersionFor(row)}
                            />

                            {/* [NEW] Per-project mini progress bar */}
                            <ProjectMiniProgress
                              submission={sub}
                              maxScore={row.project.maxScore}
                            />
                          </div>

                          {/* ── Student response + file ── */}
                          {(sub.textResponse || sub.fileUrl) && (
                            <div className="px-4 py-2.5 border-b border-[#f0e9d6] bg-[#fdfcf8]">
                              {sub.textResponse && (
                                <div className="mb-2">
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#7a6a52] mb-1">Student's Response</p>
                                  <p className="text-xs text-[#4a3828] leading-relaxed bg-white border border-[#e8dfc8] rounded-sm p-2.5">
                                    {sub.textResponse.length > 220 ? sub.textResponse.slice(0, 220) + '…' : sub.textResponse}
                                  </p>
                                </div>
                              )}
                              {sub.fileUrl && (
                                <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#1a7a6e] hover:underline">
                                  <IconAttach size={11} color="#1a7a6e" /> View submitted file
                                </a>
                              )}
                            </div>
                          )}

                          {/* ── Grade & feedback ── */}
                          <div className="px-4 py-3 space-y-3">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7a6a52]">Grade & Feedback</p>

                            <div className="flex gap-3 items-start">
                              <div className="w-28 shrink-0">
                                <label className="text-[10px] font-mono text-[#7a6a52] block mb-1">Score / {row.project.maxScore}</label>
                                <input
                                  type="number" min={0} max={row.project.maxScore}
                                  value={inp.grade}
                                  onChange={e => setField(sub._id, 'grade', e.target.value)}
                                  placeholder="—"
                                  className="w-full border border-[#c8b89a] rounded-sm px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-[#1a7a6e]"
                                  style={{ color: '#1a1209' }}
                                />
                                {gradeRatio !== null && (
                                  <div className="mt-1 space-y-0.5">
                                    <div className="text-[10px] font-mono font-bold" style={{ color: gradeColor(Number(inp.grade)) }}>
                                      {Math.round(gradeRatio * 100)}% · {gradeLabel(Number(inp.grade))}
                                    </div>
                                    {gradeRatio < REDO_THRESHOLD && (
                                      <div className="text-[10px] font-mono text-[#c0392b]">
                                        ⚠ Below {Math.round(REDO_THRESHOLD * 100)}% pass threshold
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] font-mono text-[#7a6a52] block mb-1">Feedback (optional)</label>
                                <textarea
                                  rows={3}
                                  value={inp.feedback}
                                  onChange={e => setField(sub._id, 'feedback', e.target.value)}
                                  placeholder="Write your feedback here…"
                                  className="w-full border border-[#c8b89a] rounded-sm px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:border-[#1a7a6e]"
                                  style={{ color: '#1a1209' }}
                                />
                              </div>
                            </div>

                            {inp.error && <p className="text-[11px] font-mono text-[#c0392b]">{inp.error}</p>}

                            {isBelow && !sub.redoRequested && (
                              <div className="p-3 bg-[rgba(192,57,43,0.05)] border border-[rgba(192,57,43,0.25)] rounded-sm flex items-center justify-between gap-3">
                                <p className="text-xs text-[#c0392b]">
                                  ⚠ Score is below the {Math.round(REDO_THRESHOLD * 100)}% pass threshold. Request a revision?
                                </p>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => setBelowThreshold(prev => { const n = new Set(prev); n.delete(sub._id); return n })}
                                    className="text-[11px] px-2 py-1 border border-[#c8b89a] text-[#7a6a52] hover:bg-[#f0e9d6] rounded-sm font-mono">
                                    Dismiss
                                  </button>
                                  <button
                                    onClick={() => { setRedoFor(sub._id) }}
                                    className="text-[11px] px-2 py-1 rounded-sm font-mono font-semibold text-white"
                                    style={{ background: '#c0392b', border: '1px solid rgba(192,57,43,0.4)' }}>
                                    🔄 Request Redo
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                {inp.saved && (
                                  <span className="text-[11px] font-mono text-[#1a7a6e] flex items-center gap-1">
                                    <IconApproved size={11} color="#1a7a6e" /> Saved
                                  </span>
                                )}
                                {sub.status === 'graded' && !sub.redoRequested && (
                                  <button
                                    onClick={() => setRedoFor(sub._id)}
                                    className="text-[11px] font-mono px-2.5 py-1 rounded-sm flex items-center gap-1 transition-colors"
                                    style={{ border: '1px solid rgba(212,168,67,0.35)', color: '#b8882a', background: 'rgba(212,168,67,0.06)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.14)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)' }}>
                                    <IconRefresh size={12} color="currentColor" /> Request Redo
                                  </button>
                                )}
                                {sub.redoRequested && (
                                  <span className="text-[11px] font-mono text-[#b8882a] flex items-center gap-1">
                                    <IconRefresh size={11} color="#b8882a" /> Redo requested
                                    {sub.redoReason && <span className="text-[#7a6a52]">— "{sub.redoReason.slice(0, 30)}…"</span>}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => saveGrade(sub._id, row.project.maxScore)}
                                disabled={inp.saving || inp.grade === ''}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono rounded-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                  background:  inp.saved ? 'rgba(26,122,110,0.08)' : '#1a3a2a',
                                  color:       inp.saved ? '#1a7a6e'                : '#d4a843',
                                  borderColor: inp.saved ? 'rgba(26,122,110,0.3)'  : 'rgba(212,168,67,0.3)',
                                }}>
                                {inp.saving ? (
                                  <><IconPending size={13} color="currentColor" /> Saving…</>
                                ) : inp.saved ? (
                                  <><IconApproved size={11} color="#1a7a6e" /> Saved</>
                                ) : (
                                  <><IconSave size={11} color="#d4a843" /> Save Grade</>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-[#f0e9d6]">
                              <button onClick={() => toggleMessages(sub._id)}
                                className={`text-[11px] font-mono px-2.5 py-1 rounded-sm border transition-colors flex items-center gap-1.5 ${
                                  isMsgOpen
                                    ? 'border-[rgba(26,122,110,0.35)] text-[#1a7a6e] bg-[rgba(26,122,110,0.06)]'
                                    : 'border-[#c8b89a] text-[#7a6a52] hover:border-[rgba(26,122,110,0.35)] hover:text-[#1a7a6e]'
                                }`}>
                                💬 Messages
                                {msgCount > 0 && (
                                  <span className="text-[9px] bg-[#1a7a6e] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {msgCount}
                                  </span>
                                )}
                              </button>
                            </div>

                            {isMsgOpen && (
                              <TeacherMessagesPanel
                                submissionId={sub._id}
                                messages={sub.messages ?? []}
                                onNewMessage={() => onSaved(student._id)}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {notSubmitted.length > 0 && (
                <section>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#7a6a52] mb-2.5">
                    Not Yet Submitted ({notSubmitted.length})
                  </p>
                  <div className="space-y-2">
                    {notSubmitted.map(row => {
                      const dl = daysLeft(row.project.deadline)
                      return (
                        <div key={row.project._id}
                          className="bg-white border border-[#e8dfc8] rounded-sm px-4 py-3 flex items-center justify-between opacity-60">
                          <div>
                            <div className="text-sm font-semibold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
                              {row.project.title}
                            </div>
                            <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1" style={{ color: dl.color }}>
                              <IconCalendar size={11} color={dl.color} /> {dl.label} · {fmt(row.project.deadline)}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm border border-[#c8b89a] text-[#7a6a52]">
                            Pending
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* [NEW] Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-[#e8dfc8] mt-2 shrink-0">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-1.5 text-xs font-mono rounded-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#fff', color: '#4a3828', borderColor: '#c8b89a' }}
                    onMouseEnter={e => { if (currentPage > 1) (e.currentTarget as HTMLElement).style.borderColor = '#1a7a6e' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c8b89a' }}
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="w-7 h-7 text-[11px] font-mono rounded-sm border transition-all"
                        style={{
                          background:  page === currentPage ? '#1a3a2a' : '#fff',
                          color:       page === currentPage ? '#d4a843' : '#7a6a52',
                          borderColor: page === currentPage ? 'rgba(212,168,67,0.4)' : '#c8b89a',
                        }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-1.5 text-xs font-mono rounded-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#fff', color: '#4a3828', borderColor: '#c8b89a' }}
                    onMouseEnter={e => { if (currentPage < totalPages) (e.currentTarget as HTMLElement).style.borderColor = '#1a7a6e' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c8b89a' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherStudentsPage() {
  const [data,            setData]            = useState<SubjectGroup[]>([])
  const [loading,         setLoading]         = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [search,          setSearch]          = useState('')
  const [activeStudent,   setActiveStudent]   = useState<StudentProgress | null>(null)

  function loadData() {
    fetch('/api/teacher/students')
      .then(r => r.json())
      .then(d => {
        const safe = Array.isArray(d) ? d : []
        setData(safe)
        if (safe.length > 0 && !selectedSubject) setSelectedSubject(safe[0].subject._id)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  function onGradeSaved(studentId: string) {
    fetch('/api/teacher/students')
      .then(r => r.json())
      .then((d: SubjectGroup[]) => {
        if (!Array.isArray(d)) return
        setData(d)
        const group = d.find(g => g.subject._id === selectedSubject)
        if (group) {
          const updated = group.students.find(s => s._id === studentId)
          if (updated) setActiveStudent(updated)
        }
      })
      .catch(() => {})
  }

  const currentGroup     = data.find(g => g.subject._id === selectedSubject)
  const filteredStudents = (currentGroup?.students ?? []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Link href="/teacher" suppressHydrationWarning
        className="inline-flex items-center gap-2 text-xs font-mono text-[#4a3828] hover:text-[#1a7a6e] mb-6 group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">
          <IconArrowLeft size={14} color="currentColor" />
        </span>
        Back to Dashboard
      </Link>

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
            Student Progress &amp; Grading
          </h1>
          <p className="text-[#7a6a52] text-sm mt-1">Click any student to open the grading panel.</p>
        </div>
        <RealTimeClock accentColor="#1a7a6e" />
      </div>

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading…</div>
      ) : data.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-[#7a6a52] text-sm">No subjects or students found.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-5 flex-wrap">
            {data.map(g => (
              <button key={g.subject._id}
                onClick={() => { setSelectedSubject(g.subject._id); setSearch('') }}
                className={`px-4 py-1.5 text-xs font-mono rounded-sm border transition-all ${
                  selectedSubject === g.subject._id
                    ? 'bg-[#1a3a2a] text-[#d4a843] border-[rgba(212,168,67,0.4)]'
                    : 'bg-white text-[#7a6a52] border-[#c8b89a] hover:border-[#1a7a6e]'
                }`}>
                {g.subject.code} · {g.students.length} students
              </button>
            ))}
          </div>

          {currentGroup && (
            <>
              <div className="bg-white border border-[#c8b89a] rounded-sm p-4 mb-4 shadow-[3px_3px_0_#c8b89a] flex flex-wrap gap-4 items-center">
                <div>
                  <div className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider">Subject</div>
                  <div className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{currentGroup.subject.name}</div>
                </div>
                <div className="h-8 w-px bg-[#c8b89a] hidden sm:block" />
                <div>
                  <div className="text-xs font-mono text-[#7a6a52]">Students</div>
                  <div className="font-bold text-[#1a1209]">{currentGroup.students.length}</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-[#7a6a52]">Approved Projects</div>
                  <div className="font-bold text-[#1a1209]">{currentGroup.totalProjects}</div>
                </div>
                <div className="ml-auto">
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search students…"
                    className="border border-[#c8b89a] px-3 py-1.5 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e] w-48" />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <p className="text-center py-10 text-[#7a6a52] text-sm">No students found.</p>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map(s => (
                    <div key={s._id}
                      onClick={() => setActiveStudent(s)}
                      className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[4px_4px_0_#1a7a6e] hover:border-[#1a7a6e] transition-all cursor-pointer group">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 sm:w-48 shrink-0">
                          <Avatar src={s.avatarUrl} name={s.name} role="student" size={36} />
                          <div>
                            <div className="font-semibold text-[#1a1209] text-sm group-hover:text-[#1a7a6e] transition-colors">{s.name}</div>
                            <div className="text-xs text-[#7a6a52] truncate max-w-[130px]">{s.email}</div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[#7a6a52] font-mono">Submission progress</span>
                            <span className="text-xs font-bold text-[#1a1209] font-mono">{s.submitted}/{s.totalProjects}</span>
                          </div>
                          <ProgressBar pct={s.progressPct} color={
                            s.progressPct === 100 ? '#1a7a6e' :
                            s.progressPct >= 50   ? '#d4a843' : '#c0392b'
                          } />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] font-mono text-[#7a6a52]">{s.progressPct}% submitted</span>
                            <span className="text-[10px] font-mono text-[#7a6a52]">{s.graded} graded</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-4">
                          <div className="text-center sm:w-20">
                            <div className="text-xs font-mono text-[#7a6a52] mb-1">Avg Grade</div>
                            <div className="text-xl font-bold" style={{ color: gradeColor(s.avgGrade), fontFamily: 'Georgia, serif' }}>
                              {s.avgGrade !== null ? s.avgGrade : '—'}
                            </div>
                            {s.avgGrade !== null && (
                              <div className="text-[10px] font-mono" style={{ color: gradeColor(s.avgGrade) }}>
                                {gradeLabel(s.avgGrade)}
                              </div>
                            )}
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded-sm border border-[rgba(26,122,110,0.3)] text-[#1a7a6e] bg-[rgba(26,122,110,0.05)] group-hover:bg-[rgba(26,122,110,0.12)] transition-colors shrink-0">
                            <IconGrade size={13} color="currentColor" /> Grade
                          </div>
                        </div>
                      </div>

                      {s.submitted > s.graded && (
                        <div className="mt-3 pt-3 border-t border-[#f0e9d6]">
                          <span className="text-[11px] font-mono text-[#d4a843] flex items-center gap-1.5">
                            <IconWarning size={12} color="#d4a843" />
                            {s.submitted - s.graded} submission{s.submitted - s.graded > 1 ? 's' : ''} awaiting grade
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeStudent && selectedSubject && (
        <GradingPanel
          student={activeStudent}
          subjectId={selectedSubject}
          onClose={() => setActiveStudent(null)}
          onSaved={onGradeSaved}
        />
      )}
    </div>
  )
}