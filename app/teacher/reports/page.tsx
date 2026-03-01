'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import RealTimeClock from '@/components/RealTimeClock'
import Link from 'next/link'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

interface ReportData {
  _id?: string
  month: number; year: number; status: string
  teacherName: string; teacherEmail: string
  remarks: string
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

export default function TeacherReportsPage() {
  const { data: session } = useSession()
  const now   = new Date()
  const [month,      setMonth]      = useState(now.getMonth() + 1)
  const [year,       setYear]       = useState(now.getFullYear())
  const [report,     setReport]     = useState<ReportData | null>(null)
  const [remarks,    setRemarks]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')
  const [printingId, setPrintingId] = useState<string | null>(null)

  const [history, setHistory] = useState<{ _id: string; month: number; year: number; submittedAt: string }[]>([])

  async function loadHistory() {
    try {
      const res  = await fetch('/api/teacher/reports/history')
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
  }

  async function generateReport(m = month, y = year) {
    setLoading(true)
    setError('')
    setReport(null)
    setSubmitted(false)
    try {
      const res = await fetch(`/api/teacher/reports?month=${m}&year=${y}`)
      if (!res.ok) throw new Error('Failed to generate report')
      const data = await res.json()
      setReport(data)
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
  function loadFromHistory(m: number, y: number) {
    setMonth(m)
    setYear(y)
    generateReport(m, y)
    setTimeout(() => {
      document.getElementById('report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  async function handleSubmit() {
    if (!report) return
    if (!confirm(`Submit ${MONTHS[month - 1]} ${year} report to admin? This cannot be undone.`)) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/teacher/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, remarks, status: 'submitted' }),
      })
      if (!res.ok) throw new Error('Submit failed')
      setSubmitted(true)
      setReport(prev => prev ? { ...prev, remarks, status: 'submitted' } : prev)
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

  return (
    <div>
      <Link
        href="/teacher"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#88d4ab] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[#1a7a6e] text-xs font-mono tracking-[0.2em] uppercase mb-1">月次報告書</p>
          <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
            Monthly Reports
          </h1>
          <p className="text-[#7a6a52] text-sm mt-1">
            Generate, preview, print and submit your monthly teaching report.
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
              <button onClick={() => generateReport(month, year)} disabled={loading}
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
                  return (
                    <div key={r._id}
                      className="rounded-sm overflow-hidden border transition-all"
                      style={{ borderColor: isActive ? 'rgba(26,122,110,0.4)' : '#c8b89a' }}>

                      {/* Clickable info row */}
                      <button onClick={() => loadFromHistory(r.month, r.year)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#faf6ee] transition-colors"
                        style={{ background: isActive ? 'rgba(26,122,110,0.04)' : 'white' }}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-[#1a1209]">
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
                          ✅ {new Date(r.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </button>

                      {/* View + Print buttons */}
                      <div className="flex border-t border-[#f0e9d6]"
                        style={{ background: isActive ? 'rgba(26,122,110,0.02)' : 'white' }}>
                        <button
                          onClick={() => loadFromHistory(r.month, r.year)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-mono text-[#7a6a52] hover:text-[#1a7a6e] hover:bg-[#f0faf8] transition-all border-r border-[#f0e9d6]">
                          👁️ View
                        </button>
                        <button
                          onClick={() => printFromHistory(r._id, r.month, r.year)}
                          disabled={printingId === r._id}
                          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-mono text-[#7a6a52] hover:text-[#b8882a] hover:bg-[#fdf8ee] transition-all disabled:opacity-50">
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
                    ✅ This report has been submitted to admin.
                  </span>
                  <button onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[rgba(26,122,110,0.3)] text-[#1a7a6e] text-xs font-semibold rounded-sm hover:bg-[#f0faf8] shadow-[1px_1px_0_#c8b89a] transition-all">
                    🖨️ Print / Save PDF
                  </button>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-sm font-bold text-[#1a1209] flex-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {MONTHS[report.month - 1]} {report.year} — {report.teacherName}
                </h2>
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
                    {submitting ? '⏳ Submitting...' : '📤 Submit to Admin'}
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
                    rows={3} placeholder="Add any additional observations or notes for this month..."
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
                    ? '🔒 Submitted · read-only'
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