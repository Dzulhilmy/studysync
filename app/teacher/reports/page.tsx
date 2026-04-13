'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import RealTimeClock from '@/components/RealTimeClock'
import Link from 'next/link'
import {
  IconApproved, IconEye, IconSubmitted, IconPending, IconLock, IconArrowLeft,
} from '@/components/NavIcons'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

const WEEKS = [
  { label: 'Week 1', range: '1st – 7th' },
  { label: 'Week 2', range: '8th – 14th' },
  { label: 'Week 3', range: '15th – 21st' },
  { label: 'Week 4', range: '22nd – End' },
]

interface ReportData {
  _id?: string
  month: number; year: number; status: string
  teacherName: string; teacherEmail: string
  remarks: string
  week?: number
  summary: {
    totalSubjects: number; totalStudents: number
    totalProjects: number; approvedProjects: number
    totalSubmissions: number; gradedSubmissions: number
    lateSubmissions: number; avgGrade: number | null
  }
  subjects: {
    subjectId: string; name: string; code: string; studentCount: number
    projects: {
      projectId: string; title: string; deadline: string
      maxScore: number; totalStudents: number
      submitted: number; graded: number; late: number
      avgGrade: number | null; highestGrade: number | null; lowestGrade: number | null
    }[]
  }[]
}

// ── Full-document detail modal ─────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: ReportData; onClose: () => void }) {
  const weekLabel = report.week ? WEEKS[report.week - 1]?.label : null
  const periodLabel = weekLabel
    ? `${weekLabel} · ${MONTHS[report.month - 1]} ${report.year}`
    : `${MONTHS[report.month - 1]} ${report.year}`

  const subRate = report.summary.totalSubmissions > 0
    ? Math.round((report.summary.gradedSubmissions / report.summary.totalSubmissions) * 100)
    : 0
  const lateRate = report.summary.totalSubmissions > 0
    ? Math.round((report.summary.lateSubmissions / report.summary.totalSubmissions) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-[#c8b89a] rounded-sm shadow-[8px_8px_0_#c8b89a] w-full max-w-4xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="bg-[#1a3a2a] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[#d4a843] font-bold text-base" style={{ fontFamily: 'Georgia, serif' }}>
              Weekly Teaching Report
            </h2>
            <p className="text-[rgba(250,246,238,0.5)] text-[11px] font-mono mt-0.5">
              {periodLabel} · {report.teacherName}
            </p>
          </div>
          <button onClick={onClose}
            className="text-[rgba(250,246,238,0.4)] hover:text-white transition-colors p-1.5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Modal body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Teacher info row */}
          <div className="grid grid-cols-3 gap-4 bg-[#faf7f2] border border-[#e8dfc8] p-4">
            {[{ label: 'Teacher', value: report.teacherName },
              { label: 'Email', value: report.teacherEmail },
              { label: 'Report Period', value: periodLabel }].map(c => (
              <div key={c.label}>
                <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mb-1">{c.label}</div>
                <div className="text-sm font-semibold text-[#1a1209]">{c.value}</div>
              </div>
            ))}
          </div>

          {/* KPI grid */}
          <div>
            <p className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mb-3">Summary Overview</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: '📚', num: report.summary.totalSubjects,    label: 'Subjects Taught' },
                { icon: '👥', num: report.summary.totalStudents,    label: 'Total Students'  },
                { icon: '📋', num: report.summary.totalProjects,    label: 'Active Projects' },
                { icon: '🏆', num: report.summary.avgGrade != null ? `${report.summary.avgGrade}` : '—', label: 'Avg Grade (pts)' },
              ].map(k => (
                <div key={k.label} className="bg-[#faf7f2] border border-[#e8dfc8] p-4 text-center relative overflow-hidden">
                  <div className="text-xl mb-1">{k.icon}</div>
                  <div className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{k.num}</div>
                  <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mt-0.5">{k.label}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg,#d4a843,transparent)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Metrics bars */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Submission Rate',  val: report.summary.totalSubmissions, pct: subRate,  note: `${subRate}% graded`,           color: '#1a5c54' },
              { label: 'Late Submissions', val: report.summary.lateSubmissions,  pct: lateRate, note: `${lateRate}% of total`,       color: lateRate > 20 ? '#8b2020' : '#1a5c54' },
              { label: 'Graded Work',      val: report.summary.gradedSubmissions, pct: subRate, note: `of ${report.summary.totalSubmissions}`, color: '#1a5c54' },
            ].map(m => (
              <div key={m.label} className="bg-[#f5f0e8] border border-[#e8dfc8] p-3">
                <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mb-2">{m.label}</div>
                <div className="h-1.5 bg-[#d4c4a8] rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
                <span className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: m.color }}>{m.val}</span>
                <span className="text-[10px] font-mono text-[#7a6a52] ml-1">{m.note}</span>
              </div>
            ))}
          </div>

          {/* Subject & project breakdown */}
          <div>
            <p className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mb-3">Subject &amp; Project Breakdown</p>
            <div className="space-y-4">
              {report.subjects.map(subj => (
                <div key={subj.subjectId} className="border border-[#e8dfc8] overflow-hidden">
                  <div className="bg-[#1a1209] text-white px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#d4a843] tracking-widest">{subj.code}</span>
                      <span className="text-sm font-bold ml-2" style={{ fontFamily: 'Georgia, serif' }}>{subj.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">{subj.studentCount} students enrolled</span>
                  </div>
                  {subj.projects.length === 0 ? (
                    <div className="px-4 py-3 bg-[#faf7f2]">
                      <span className="text-[10px] font-mono text-[#a89880] uppercase tracking-wider">No projects recorded this period</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#f5f0e8]">
                            {['Project Title','Deadline','Max','Submitted','Graded','Late','Avg Grade','High','Low'].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-mono text-[#7a6a52] uppercase tracking-wider border-b border-[#e8dfc8] whitespace-nowrap text-[10px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {subj.projects.map((p, i) => {
                            const submitPct = p.totalStudents > 0 ? Math.round((p.submitted / p.totalStudents) * 100) : 0
                            return (
                              <tr key={p.projectId} className={i % 2 === 0 ? 'bg-white' : 'bg-[#faf7f2]'}>
                                <td className="px-3 py-2 font-semibold text-[#1a1209] max-w-[160px] truncate border-b border-[#f0e9d6]">{p.title}</td>
                                <td className="px-3 py-2 font-mono text-[#7a6a52] whitespace-nowrap border-b border-[#f0e9d6]">{new Date(p.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className="px-3 py-2 font-mono text-[#7a6a52] border-b border-[#f0e9d6]">{p.maxScore}</td>
                                <td className="px-3 py-2 border-b border-[#f0e9d6]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-10 h-1 bg-[#d4c4a8] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#1a5c54] rounded-full" style={{ width: `${submitPct}%` }} />
                                    </div>
                                    <span className="font-mono text-[#7a6a52]">{p.submitted}/{p.totalStudents}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 font-mono font-bold text-[#1a7a6e] border-b border-[#f0e9d6]">{p.graded}</td>
                                <td className={`px-3 py-2 font-mono border-b border-[#f0e9d6] ${p.late > 0 ? 'text-[#c0392b]' : 'text-[#7a6a52]'}`}>{p.late}</td>
                                <td className="px-3 py-2 font-mono font-bold text-[#8b5a2b] border-b border-[#f0e9d6]">{p.avgGrade ?? '—'}</td>
                                <td className="px-3 py-2 font-mono text-[#7a6a52] border-b border-[#f0e9d6]">{p.highestGrade ?? '—'}</td>
                                <td className="px-3 py-2 font-mono text-[#7a6a52] border-b border-[#f0e9d6]">{p.lowestGrade ?? '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <p className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mb-2">Remarks &amp; Observations</p>
            <div className="bg-[#faf7f2] border border-[#e8dfc8] p-4 min-h-[60px]">
              {report.remarks
                ? <p className="text-sm text-[#1a1209] leading-relaxed italic">{report.remarks}</p>
                : <p className="text-[10px] font-mono text-[#c8b89a] uppercase tracking-wider">— No remarks provided —</p>
              }
            </div>
          </div>

          {/* Signature strip */}
          <div className="grid grid-cols-3 gap-8 pt-2">
            {[{ label: 'Prepared by', name: report.teacherName },
              { label: 'Verified by', name: '' },
              { label: 'Acknowledged by', name: '' }].map(s => (
              <div key={s.label} className="border-t border-[#1a1209] pt-2">
                <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider">{s.label}</div>
                <div className="text-sm text-[#1a1209] mt-1 italic">{s.name || <span className="opacity-0">_</span>}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3 border-t border-[#e8dfc8] flex items-center justify-between shrink-0 bg-[#faf7f2]">
          <span className="text-[11px] font-mono text-[#7a6a52]">StudySync · Weekly Teaching Report · {periodLabel.toUpperCase()}</span>
          <button onClick={onClose}
            className="text-xs px-4 py-1.5 border border-[#c8b89a] text-[#7a6a52] hover:bg-white rounded-sm font-mono transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeacherReportsPage() {
  const { data: session } = useSession()
  const now   = new Date()
  const [month,      setMonth]      = useState(now.getMonth() + 1)
  const [year,       setYear]       = useState(now.getFullYear())
  const [week,       setWeek]       = useState(1)
  const [report,     setReport]     = useState<ReportData | null>(null)
  const [remarks,    setRemarks]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')
  const [printingId, setPrintingId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const [history, setHistory] = useState<{ _id: string; month: number; year: number; week?: number; submittedAt: string }[]>([])

  async function loadHistory() {
    try {
      const res  = await fetch('/api/teacher/reports/history')
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
  }

  async function generateReport(m = month, y = year, w = week) {
    setLoading(true)
    setError('')
    setReport(null)
    setSubmitted(false)
    setShowDetail(false)
    try {
      const res = await fetch(`/api/teacher/reports?month=${m}&year=${y}`)
      if (!res.ok) throw new Error('Failed to generate report')
      const data = await res.json()
      setReport({ ...data, week: w })
      setRemarks(data.remarks ?? '')
      if (data.status === 'submitted') setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [])

  // Click history item → update selectors + auto-load
  function loadFromHistory(m: number, y: number, w?: number) {
    setMonth(m)
    setYear(y)
    if (w) setWeek(w)
    generateReport(m, y, w ?? week)
    setTimeout(() => {
      document.getElementById('report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  async function handleSubmit() {
    if (!report) return
    const weekLabel = WEEKS[week - 1]?.label ?? `Week ${week}`
    if (!confirm(`Submit ${weekLabel} · ${MONTHS[month - 1]} ${year} report to admin? This cannot be undone.`)) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/teacher/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, week, remarks, status: 'submitted' }),
      })
      if (!res.ok) throw new Error('Submit failed')
      setSubmitted(true)
      setReport(prev => prev ? { ...prev, week, remarks, status: 'submitted' } : prev)
      await loadHistory()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Open print page — works for draft and submitted
  function openPrint(r: ReportData, currentRemarks?: string) {
    const printData = { ...r, remarks: currentRemarks ?? r.remarks }
    const encoded   = encodeURIComponent(JSON.stringify(printData))
    window.open(`/teacher/reports/print?data=${encoded}`, '_blank')
  }

  function handlePrint() {
    if (!report) return
    openPrint(report, remarks)
  }

  // Print directly from history sidebar — fetches quietly in background
  async function printFromHistory(id: string, m: number, y: number) {
    setPrintingId(id)
    try {
      const res = await fetch(`/api/teacher/reports?month=${m}&year=${y}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      openPrint(data)
    } catch {
      alert('Could not load report. Please click the report first to load it, then print.')
    } finally {
      setPrintingId(null)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const weekLabel = WEEKS[week - 1]?.label ?? `Week ${week}`

  return (
    <div>
      {/* Detail modal */}
      {showDetail && report && (
        <ReportDetailModal report={{ ...report, week }} onClose={() => setShowDetail(false)} />
      )}

      <Link
        href="/teacher"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#88d4ab] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform"><IconArrowLeft size={14} color="currentColor" /></span>
        Back to Dashboard
      </Link>

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
            Weekly Reports
          </h1>
          <p className="text-[#7a6a52] text-sm mt-1">
            Generate, preview, print and submit your weekly teaching report.
          </p>
        </div>
        <RealTimeClock accentColor="#1a7a6e" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Month selector + history ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Selector card */}
          <div className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a]">
            <h2 className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-4">Select Period</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Week</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {WEEKS.map((w, i) => (
                    <button key={i} onClick={() => setWeek(i + 1)}
                      className={`py-1.5 px-2 text-xs font-mono rounded-sm border transition-all text-left ${
                        week === i + 1
                          ? 'bg-[#1a3a2a] text-[#d4a843] border-[rgba(212,168,67,0.4)]'
                          : 'bg-white text-[#7a6a52] border-[#c8b89a] hover:border-[#d4a843] hover:text-[#1a1209]'
                      }`}>
                      <div className="font-bold">{w.label}</div>
                      <div className="text-[9px] opacity-70">{w.range}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Month</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]">
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={() => generateReport(month, year, week)} disabled={loading}
                className="w-full py-2.5 bg-[#1a3a2a] text-[#d4a843] font-semibold text-sm rounded-sm hover:bg-[#224d38] disabled:opacity-50 transition-colors border border-[rgba(212,168,67,0.3)]">
                {loading ? '⏳ Generating...' : '📊 Generate Report'}
              </button>
            </div>
          </div>

          {/* Past submitted reports */}
          {history.length > 0 && (
            <div className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a]">
              <h2 className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-3">Submitted Reports</h2>
              <div className="space-y-2">
                {history.map(r => {
                  const isActive = r.month === month && r.year === year && !!report
                  const hWeekLabel = r.week ? WEEKS[r.week - 1]?.label : null
                  return (
                    <div key={r._id}
                      className="rounded-sm overflow-hidden border transition-all"
                      style={{ borderColor: isActive ? 'rgba(26,122,110,0.4)' : '#c8b89a' }}>

                      {/* Clickable info row */}
                      <button onClick={() => loadFromHistory(r.month, r.year, r.week)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#faf6ee] transition-colors"
                        style={{ background: isActive ? 'rgba(26,122,110,0.04)' : 'white' }}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-[#1a1209]">
                            {hWeekLabel && <span className="text-[10px] font-mono bg-[#1a3a2a] text-[#d4a843] px-1.5 py-0.5 mr-1.5">{hWeekLabel}</span>}
                            {MONTHS[r.month - 1]} {r.year}
                          </div>
                          {isActive && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm"
                              style={{ background: 'rgba(26,122,110,0.1)', color: '#1a7a6e', border: '1px solid rgba(26,122,110,0.2)' }}>
                              Loaded
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-[#7a6a52] mt-0.5">
                          <IconApproved size={12} color="currentColor" /> {new Date(r.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </button>

                      {/* View + View Details + Print buttons */}
                      <div className="flex border-t border-[#f0e9d6]"
                        style={{ background: isActive ? 'rgba(26,122,110,0.02)' : 'white' }}>
                        <button
                          onClick={() => loadFromHistory(r.month, r.year, r.week)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-mono text-[#7a6a52] hover:text-[#1a7a6e] hover:bg-[#f0faf8] transition-all border-r border-[#f0e9d6]">
                          <IconEye size={12} color="currentColor" /> View
                        </button>
                        <button
                          onClick={() => printFromHistory(r._id, r.month, r.year)}
                          disabled={printingId === r._id}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-mono text-[#7a6a52] hover:text-[#b8882a] hover:bg-[#fdf8ee] transition-all disabled:opacity-50 border-r border-[#f0e9d6]">
                          {printingId === r._id ? '⏳' : '🖨️'} Print
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Report preview ── */}
        <div className="lg:col-span-2" id="report-preview">
          {error && (
            <div className="mb-4 px-4 py-3 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#c0392b] text-sm rounded-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-white border border-[#c8b89a] rounded-sm p-16 text-center shadow-[3px_3px_0_#c8b89a]">
              <div className="text-4xl mb-3 animate-bounce">📊</div>
              <p className="text-[#7a6a52] text-sm font-mono animate-pulse">Generating report…</p>
            </div>
          )}

          {!report && !loading && (
            <div className="bg-white border border-[#c8b89a] rounded-sm p-16 text-center shadow-[3px_3px_0_#c8b89a]">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-[#7a6a52] text-sm leading-relaxed">
                Select a month and click <strong>Generate Report</strong>,<br />
                or click <strong>View</strong> on any past report in the sidebar.
              </p>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-4">

              {/* Submitted status banner — with print button */}
              {submitted && (
                <div className="px-4 py-3 bg-[rgba(26,122,110,0.08)] border border-[rgba(26,122,110,0.3)] rounded-sm flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[#1a7a6e] text-sm font-semibold">
                    <IconApproved size={12} color="currentColor" /> This report has been submitted to admin.
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowDetail(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#1a3a2a] border border-[rgba(212,168,67,0.35)] text-[#d4a843] text-xs font-semibold rounded-sm hover:bg-[#224d38] shadow-[1px_1px_0_rgba(26,18,9,0.3)] transition-all">
                      <IconEye size={12} color="currentColor" /> View Details
                    </button>
                    <button onClick={handlePrint}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[rgba(26,122,110,0.3)] text-[#1a7a6e] text-xs font-semibold rounded-sm hover:bg-[#f0faf8] shadow-[1px_1px_0_#c8b89a] transition-all">
                      🖨️ Print / Save PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-sm font-bold text-[#1a1209] flex-1" style={{ fontFamily: 'Georgia, serif' }}>
                  <span className="text-[11px] font-mono bg-[#1a3a2a] text-[#d4a843] px-2 py-0.5 mr-2">{weekLabel}</span>
                  {MONTHS[report.month - 1]} {report.year} — {report.teacherName}
                </h2>
                {/* View Details always visible when report is loaded */}
                <button onClick={() => setShowDetail(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a3a2a] border border-[rgba(212,168,67,0.3)] text-[#d4a843] text-xs font-semibold rounded-sm hover:bg-[#224d38] shadow-[2px_2px_0_rgba(26,18,9,0.3)] transition-all">
                  <IconEye size={12} color="currentColor" /> View Details
                </button>
                {/* Print always visible whether draft or submitted */}
                {!submitted && (
                  <button onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c8b89a] text-[#1a1209] text-xs font-semibold rounded-sm hover:bg-[#faf6ee] shadow-[2px_2px_0_#c8b89a] transition-all">
                    🖨️ Print / Save PDF
                  </button>
                )}
                {!submitted && (
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a3a2a] text-[#d4a843] text-xs font-semibold rounded-sm border border-[rgba(212,168,67,0.3)] hover:bg-[#224d38] disabled:opacity-50 transition-colors shadow-[2px_2px_0_rgba(26,18,9,0.3)]">
                    {submitting ? <IconPending size={12} color="currentColor" /> : <IconSubmitted size={12} color="currentColor" />} {submitting ? ' Submitting...' : '📤 Submit to Admin'}
                  </button>
                )}
              </div>

              {/* Summary grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Subjects',  value: report.summary.totalSubjects,  icon: '📚' },
                  { label: 'Students',  value: report.summary.totalStudents,  icon: '👥' },
                  { label: 'Projects',  value: report.summary.totalProjects,  icon: '📋' },
                  { label: 'Avg Grade', value: report.summary.avgGrade != null ? `${report.summary.avgGrade}%` : 'N/A', icon: '🏆' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-[#c8b89a] rounded-sm p-4 shadow-[2px_2px_0_#c8b89a]">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{s.value}</div>
                    <div className="text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Per-subject breakdown */}
              {report.subjects.map(subj => (
                <div key={subj.subjectId} className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a] overflow-hidden">
                  <div className="bg-[#f0e9d6] border-b border-[#c8b89a] px-5 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-[#c0392b] font-bold">{subj.code}</span>
                      <span className="text-sm font-bold text-[#1a1209] ml-2" style={{ fontFamily: 'Georgia, serif' }}>{subj.name}</span>
                    </div>
                    <span className="text-xs font-mono text-[#7a6a52]">{subj.studentCount} students</span>
                  </div>
                  {subj.projects.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-[#7a6a52] font-mono">No projects this month.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[#f0e9d6]">
                          <tr className="text-left">
                            {['Project','Deadline','Submitted','Graded','Late','Avg','High','Low'].map(h => (
                              <th key={h} className="px-4 py-2 text-[10px] font-mono text-[#7a6a52] uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f0e8]">
                          {subj.projects.map(p => (
                            <tr key={p.projectId} className="hover:bg-[#faf6ee] transition-colors">
                              <td className="px-4 py-2.5 font-semibold text-[#1a1209] max-w-[160px] truncate">{p.title}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-[#7a6a52] whitespace-nowrap">{new Date(p.deadline).toLocaleDateString()}</td>
                              <td className="px-4 py-2.5 text-xs font-mono">{p.submitted}/{p.totalStudents}</td>
                              <td className="px-4 py-2.5 text-xs font-mono">{p.graded}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-[#c0392b]">{p.late}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-[#1a7a6e] font-bold">{p.avgGrade ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs font-mono">{p.highestGrade ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs font-mono">{p.lowestGrade ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* Remarks */}
              {!submitted ? (
                <div className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a]">
                  <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-2">
                    Remarks / Notes (optional)
                  </label>
                  <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                    rows={3} placeholder="Add any additional observations or notes for this week..."
                    className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e] resize-none" />
                </div>
              ) : report.remarks ? (
                <div className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a]">
                  <p className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-2">Remarks</p>
                  <p className="text-sm text-[#1a1209] leading-relaxed">{report.remarks}</p>
                </div>
              ) : null}

              {/* Footer print bar — always at the bottom of every loaded report */}
              <div className="flex items-center justify-between pt-2 border-t border-[#e8dfc8]">
                <p className="text-[11px] font-mono text-[#7a6a52]">
                  {submitted
                    ? <span className="flex items-center gap-1.5">
                      <IconLock size={14} color="currentColor" />Submitted · read-only</span>
                    : '📝 Draft · not yet submitted to admin'}
                </p>
                <button onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2 bg-white border border-[#c8b89a] text-[#1a1209] text-xs font-semibold rounded-sm hover:bg-[#faf6ee] hover:border-[#d4a843] shadow-[2px_2px_0_#c8b89a] transition-all">
                  🖨️ Print / Save PDF
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}