'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock'
import Avatar from '@/components/Avatar'
import {
  IconClose, IconWarning, IconApproved, IconSubmitted,
  IconSave, IconPending, IconGrade, IconArrowLeft, IconInbox,
  IconTrophy, IconCalendar, IconEmpty, IconStudents,
  IconAttach, IconClock,
} from '@/components/NavIcons'

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
  } | null
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-[#f0e9d6] rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function gradeColor(avg: number | null) {
  if (avg === null) return '#c8b89a'
  if (avg >= 80) return '#1a7a6e'
  if (avg >= 60) return '#d4a843'
  return '#c0392b'
}

function gradeLabel(avg: number | null) {
  if (avg === null) return null
  if (avg >= 80) return 'Excellent'
  if (avg >= 60) return 'Good'
  return 'Needs help'
}

function daysLeft(deadline: string) {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#c0392b' }
  if (diff === 0) return { label: 'Due today', color: '#c0392b' }
  return { label: `${diff}d left`, color: diff <= 7 ? '#d4a843' : '#7a6a52' }
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GradingPanel({
  student, subjectId, onClose, onSaved,
}: {
  student: StudentProgress
  subjectId: string
  onClose: () => void
  onSaved: (studentId: string) => void
}) {
  const [rows,    setRows]    = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [inputs,  setInputs]  = useState<Record<string, {
    grade: string; feedback: string; saving: boolean; saved: boolean; error: string
  }>>({})
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/teacher/students/submissions?studentId=${student._id}&subjectId=${subjectId}`)
      .then(async r => {
        if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.error ?? `HTTP ${r.status}`) }
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
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function setField(subId: string, field: 'grade' | 'feedback', value: string) {
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
      onSaved(student._id)
    } catch {
      setInputs(prev => ({ ...prev, [subId]: { ...prev[subId], saving: false, error: 'Failed to save. Try again.' } }))
    }
  }

  const submitted    = rows.filter(r => r.submission && r.submission.status !== 'pending')
  const notSubmitted = rows.filter(r => !r.submission || r.submission.status === 'pending')

  return (
    <>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" />
      <div ref={panelRef}
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: 'min(580px, 100vw)',
          background: '#faf6ee',
          borderLeft: '2px solid #c8b89a',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          animation: 'slideIn .28s cubic-bezier(.22,1,.36,1)',
        }}>

        {/* ── Header: Avatar + name ──────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-[#c8b89a] shrink-0" style={{ background: '#1a3a2a' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar replaces the letter box */}
              <Avatar
                src={student.avatarUrl}
                name={student.name}
                role="student"
                size={40}
              />
              <div>
                <div className="font-bold text-[#faf6ee] text-sm flex items-center gap-1.5" style={{ fontFamily: 'Georgia, serif' }}>
                  <IconStudents color="currentColor" size={14} />
                  {student.name}
                </div>
                <div className="text-[11px] font-mono" style={{ color: 'rgba(250,246,238,0.45)' }}>
                  {student.email}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="text-2xl leading-none p-1 transition-colors"
              style={{ color: 'rgba(250,246,238,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,246,238,0.35)')}>
              <IconClose size={14} color="currentColor" />
            </button>
          </div>

          {/* Mini stats */}
          <div className="flex gap-5 mt-3.5">
            {[
              ['Submitted', `${student.submitted}/${student.totalProjects}`, '#d4a843'],
              ['Graded',    `${student.graded}`,                             '#4ade80'],
              ['Avg Grade', student.avgGrade !== null ? `${student.avgGrade}` : '—', gradeColor(student.avgGrade)],
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5"
                  style={{ color: 'rgba(250,246,238,0.38)' }}>{label}</div>
                <div className="text-lg font-bold" style={{ color: color as string, fontFamily: 'Georgia, serif' }}>
                  {value}
                </div>
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
              <div className="text-3xl mb-2"><IconEmpty size={36} color="#c8b89a" /></div>
              <p className="text-[#7a6a52] text-sm">No projects found for this subject.</p>
            </div>
          ) : (
            <>
              {submitted.length > 0 && (
                <section>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#7a6a52] mb-2.5">
                    Submissions ({submitted.length})
                  </p>
                  <div className="space-y-4">
                    {submitted.map(row => {
                      const sub = row.submission!
                      const inp = inputs[sub._id] ?? { grade: '', feedback: '', saving: false, saved: false, error: '' }
                      const dl  = daysLeft(row.project.deadline)
                      const needsGrade = sub.status !== 'graded'

                      return (
                        <div key={sub._id}
                          className="bg-white rounded-sm overflow-hidden"
                          style={{
                            border:     `1px solid ${needsGrade ? '#1a7a6e' : '#c8b89a'}`,
                            borderLeft: `3px solid ${needsGrade ? '#1a7a6e' : '#c8b89a'}`,
                            boxShadow:  '2px 2px 0 #e8dfc8',
                          }}>

                          <div className="px-4 pt-3 pb-2.5 border-b border-[#f0e9d6]">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="font-semibold text-[#1a1209] text-sm leading-snug"
                                style={{ fontFamily: 'Georgia, serif' }}>
                                {row.project.title}
                              </div>
                              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                {sub.isLate && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1"
                                    style={{ border: '1px solid rgba(192,57,43,0.3)', color: '#c0392b', background: 'rgba(192,57,43,0.05)' }}>
                                    <IconClock size={12} color="currentColor" /> Late
                                  </span>
                                )}
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1"
                                  style={{
                                    border:    `1px solid ${sub.status === 'graded' ? 'rgba(26,122,110,0.3)' : 'rgba(212,168,67,0.3)'}`,
                                    color:      sub.status === 'graded' ? '#1a7a6e' : '#b8882a',
                                    background: sub.status === 'graded' ? 'rgba(26,122,110,0.06)' : 'rgba(212,168,67,0.06)',
                                  }}>
                                  {sub.status === 'graded'
                                    ? <><IconApproved size={11} color="currentColor" /><span>Graded</span></>
                                    : <><IconInbox size={11} color="currentColor" /><span>Submitted</span></>
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
                          </div>

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
                                {inp.grade !== '' && !isNaN(Number(inp.grade)) && (
                                  <div className="mt-1 text-[10px] font-mono font-bold" style={{ color: gradeColor(Number(inp.grade)) }}>
                                    {Math.round((Number(inp.grade) / row.project.maxScore) * 100)}% · {gradeLabel(Number(inp.grade))}
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

                            <div className="flex items-center justify-between pt-1">
                              {inp.saved && (
                                <span className="text-[11px] font-mono text-[#1a7a6e] flex items-center gap-1">
                                  <IconApproved size={11} color="#1a7a6e" /> Saved successfully
                                </span>
                              )}
                              <button
                                onClick={() => saveGrade(sub._id, row.project.maxScore)}
                                disabled={inp.saving || inp.grade === ''}
                                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono rounded-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                  background:  inp.saved ? 'rgba(26,122,110,0.08)' : '#1a3a2a',
                                  color:       inp.saved ? '#1a7a6e' : '#d4a843',
                                  borderColor: inp.saved ? 'rgba(26,122,110,0.3)' : 'rgba(212,168,67,0.3)',
                                }}>
                                {inp.saving ? (
                                  <><IconPending size={13} color="currentColor" /><span>Saving…</span></>
                                ) : inp.saved ? (
                                  <><IconApproved size={11} color="#1a7a6e" /><span>Saved</span></>
                                ) : (
                                  <><IconSave size={11} color="#d4a843" /><span>Save Grade</span></>
                                )}
                              </button>
                            </div>
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
            </>
          )}
        </div>
      </div>
    </>
  )
}

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
        <span suppressHydrationWarning className="text-base leading-none group-hover:-translate-x-1 transition-transform">
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

                        {/* ── Avatar replaces the letter box ── */}
                        <div className="flex items-center gap-3 sm:w-48 shrink-0">
                          <Avatar
                            src={s.avatarUrl}
                            name={s.name}
                            role="student"
                            size={36}
                          />
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