'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

interface ReportData {
  month: number; year: number; status: string
  teacherName: string; teacherEmail: string; remarks: string
  summary: {
    totalSubjects: number; totalStudents: number
    totalProjects: number; gradedSubmissions: number
    totalSubmissions: number; lateSubmissions: number
    avgGrade: number | null
  }
  subjects: {
    subjectId: string; name: string; code: string; studentCount: number
    projects: {
      projectId: string; title: string; deadline: string; maxScore: number
      totalStudents: number; submitted: number; graded: number; late: number
      avgGrade: number | null; highestGrade: number | null; lowestGrade: number | null
    }[]
  }[]
}

function PrintPage() {
  const params = useSearchParams()
  const [report, setReport] = useState<ReportData | null>(null)
  const [error,  setError]  = useState('')

  useEffect(() => {
    try {
      const raw = params.get('data')
      if (!raw) throw new Error('No report data')
      setReport(JSON.parse(decodeURIComponent(raw)))
    } catch {
      setError('Failed to load report data.')
    }
  }, [params])

  useEffect(() => {
    if (report) {
      // Give images/fonts time to load before auto-triggering print
      const t = setTimeout(() => window.print(), 800)
      return () => clearTimeout(t)
    }
  }, [report])

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-600">{error}</p>
    </div>
  )

  if (!report) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 font-mono text-sm animate-pulse">Preparing report…</p>
    </div>
  )

  const subRate = report.summary.totalSubmissions > 0
    ? Math.round((report.summary.gradedSubmissions / report.summary.totalSubmissions) * 100)
    : 0

  const lateRate = report.summary.totalSubmissions > 0
    ? Math.round((report.summary.lateSubmissions / report.summary.totalSubmissions) * 100)
    : 0

  return (
    <>
      {/* ════════ Print-specific CSS ════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Share+Tech+Mono&family=Source+Sans+3:wght@300;400;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:      #1a1209;
          --gold:     #c8973e;
          --green:    #1a5c54;
          --red:      #8b2020;
          --muted:    #6b5c48;
          --border:   #d4c4a8;
          --bg-warm:  #faf7f2;
          --bg-section: #f5f0e8;
        }

        body {
          font-family: 'Source Sans 3', sans-serif;
          color: var(--ink);
          background: white;
          font-size: 10pt;
          line-height: 1.5;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 16mm 18mm;
          background: white;
        }

        /* ── Page header ── */
        .doc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 10mm;
          border-bottom: 2pt solid var(--ink);
          margin-bottom: 8mm;
          gap: 12mm;
        }
        .school-brand { flex: 1; }
        .school-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26pt;
          font-weight: 700;
          letter-spacing: -0.5pt;
          color: var(--ink);
          line-height: 1;
        }
        .school-name span { color: var(--gold); }
        .school-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 7pt;
          color: var(--muted);
          letter-spacing: 3pt;
          text-transform: uppercase;
          margin-top: 3pt;
        }
        .doc-meta { text-align: right; }
        .doc-type {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16pt;
          font-weight: 600;
          color: var(--green);
          line-height: 1.1;
        }
        .doc-period {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8.5pt;
          color: var(--muted);
          margin-top: 2pt;
          letter-spacing: 1pt;
        }
        .doc-stamp {
          display: inline-block;
          margin-top: 5pt;
          border: 1.5pt solid var(--gold);
          color: var(--gold);
          font-family: 'Share Tech Mono', monospace;
          font-size: 6.5pt;
          letter-spacing: 2pt;
          padding: 2pt 8pt;
          text-transform: uppercase;
        }

        /* ── Gold rule ── */
        .gold-rule {
          height: 2pt;
          background: linear-gradient(90deg, var(--gold), transparent);
          margin-bottom: 8mm;
        }

        /* ── Section heading ── */
        .section-head {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12pt;
          font-weight: 700;
          color: var(--green);
          letter-spacing: 1pt;
          text-transform: uppercase;
          border-bottom: 1pt solid var(--border);
          padding-bottom: 3pt;
          margin-bottom: 5mm;
          display: flex;
          align-items: center;
          gap: 8pt;
        }
        .section-head::before {
          content: '';
          display: inline-block;
          width: 4pt;
          height: 12pt;
          background: var(--gold);
        }

        /* ── Teacher info row ── */
        .teacher-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4mm;
          background: var(--bg-warm);
          border: 1pt solid var(--border);
          padding: 5mm 6mm;
          margin-bottom: 8mm;
        }
        .info-cell label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 6.5pt;
          color: var(--muted);
          letter-spacing: 1.5pt;
          text-transform: uppercase;
          display: block;
          margin-bottom: 2pt;
        }
        .info-cell span {
          font-size: 10pt;
          font-weight: 600;
          color: var(--ink);
        }

        /* ── Summary KPI boxes ── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4mm;
          margin-bottom: 8mm;
        }
        .kpi-box {
          border: 1pt solid var(--border);
          padding: 4mm;
          background: var(--bg-warm);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .kpi-box::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2pt;
          background: var(--gold);
        }
        .kpi-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24pt;
          font-weight: 700;
          color: var(--ink);
          line-height: 1;
          display: block;
        }
        .kpi-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 6pt;
          color: var(--muted);
          letter-spacing: 1.5pt;
          text-transform: uppercase;
          margin-top: 2pt;
          display: block;
        }

        /* ── Performance metrics bar ── */
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4mm;
          margin-bottom: 8mm;
        }
        .metric-item {
          background: var(--bg-section);
          border: 1pt solid var(--border);
          padding: 3mm 4mm;
        }
        .metric-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 6.5pt;
          color: var(--muted);
          letter-spacing: 1pt;
          text-transform: uppercase;
          display: block;
          margin-bottom: 2pt;
        }
        .metric-bar-bg {
          height: 5pt;
          background: var(--border);
          border-radius: 1pt;
          overflow: hidden;
          margin-bottom: 2pt;
        }
        .metric-bar-fill {
          height: 100%;
          background: var(--green);
          border-radius: 1pt;
        }
        .metric-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 14pt;
          font-weight: 700;
          color: var(--green);
          line-height: 1;
        }
        .metric-val.warn { color: var(--red); }

        /* ── Subject section ── */
        .subject-block {
          break-inside: avoid;
          margin-bottom: 8mm;
        }
        .subject-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--ink);
          color: white;
          padding: 3mm 5mm;
        }
        .subj-code {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8pt;
          color: var(--gold);
          letter-spacing: 2pt;
          display: block;
        }
        .subj-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13pt;
          font-weight: 600;
          color: white;
          display: block;
          margin-top: 1pt;
        }
        .subj-count {
          font-family: 'Share Tech Mono', monospace;
          font-size: 7pt;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1pt;
        }

        /* ── Project table ── */
        .proj-table {
          width: 100%;
          border-collapse: collapse;
          border: 1pt solid var(--border);
        }
        .proj-table th {
          background: var(--bg-section);
          font-family: 'Share Tech Mono', monospace;
          font-size: 6.5pt;
          color: var(--muted);
          letter-spacing: 1.5pt;
          text-transform: uppercase;
          padding: 3pt 6pt;
          text-align: left;
          border-bottom: 1pt solid var(--border);
          border-right: 1pt solid var(--border);
          white-space: nowrap;
        }
        .proj-table td {
          padding: 4pt 6pt;
          font-size: 9pt;
          border-bottom: 0.5pt solid var(--border);
          border-right: 0.5pt solid var(--border);
          vertical-align: middle;
        }
        .proj-table tr:last-child td { border-bottom: none; }
        .proj-table tr:nth-child(even) td { background: var(--bg-warm); }
        .proj-title { font-weight: 600; color: var(--ink); }
        .td-mono { font-family: 'Share Tech Mono', monospace; font-size: 8pt; }
        .td-green { color: var(--green); font-weight: 700; }
        .td-red   { color: var(--red); }
        .td-gold  { color: #9a6e1a; font-weight: 700; }

        /* Submission rate mini bar in table */
        .sub-bar { display: flex; align-items: center; gap: 4pt; }
        .sub-bar-track { flex: 1; height: 4pt; background: var(--border); border-radius: 1pt; min-width: 40pt; }
        .sub-bar-fill  { height: 100%; background: var(--green); border-radius: 1pt; }

        /* ── Remarks box ── */
        .remarks-box {
          border: 1pt solid var(--border);
          padding: 5mm;
          background: var(--bg-warm);
          min-height: 18mm;
          margin-bottom: 8mm;
        }
        .remarks-text {
          font-size: 9.5pt;
          color: var(--ink);
          line-height: 1.6;
          white-space: pre-line;
          font-style: italic;
        }
        .remarks-empty {
          font-family: 'Share Tech Mono', monospace;
          font-size: 7.5pt;
          color: var(--border);
          letter-spacing: 1pt;
        }

        /* ── Signature area ── */
        .sig-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10mm;
          margin-top: 8mm;
        }
        .sig-box {
          border-top: 1pt solid var(--ink);
          padding-top: 3pt;
        }
        .sig-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 7pt;
          color: var(--muted);
          letter-spacing: 1pt;
          text-transform: uppercase;
        }
        .sig-name {
          font-size: 9pt;
          color: var(--ink);
          margin-top: 2pt;
          font-style: italic;
        }

        /* ── Footer ── */
        .doc-footer {
          margin-top: 10mm;
          padding-top: 4mm;
          border-top: 0.5pt solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-left {
          font-family: 'Share Tech Mono', monospace;
          font-size: 6.5pt;
          color: var(--border);
          letter-spacing: 1pt;
        }
        .footer-right {
          font-family: 'Share Tech Mono', monospace;
          font-size: 6.5pt;
          color: var(--border);
        }

        /* Print rules */
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { padding: 12mm 15mm; }
          .no-print { display: none !important; }
          .subject-block { break-inside: avoid; }
          @page { size: A4; margin: 0; }
        }

        /* Screen only: comfortable reading width */
        @media screen {
          body { background: #e8e0d4; }
          .page { margin: 20px auto; box-shadow: 0 4px 32px rgba(0,0,0,0.18); }
          .print-bar {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            background: #1a3a2a; padding: 10px 24px;
            display: flex; align-items: center; justify-content: space-between;
          }
          .print-btn {
            background: #d4a843; color: #1a1209; font-weight: 700;
            font-family: 'Share Tech Mono', monospace; font-size: 11px;
            letter-spacing: 2px; text-transform: uppercase;
            border: none; padding: 8px 20px; cursor: pointer;
          }
          .print-bar-label {
            font-family: 'Share Tech Mono', monospace; font-size: 10px;
            letter-spacing: 2px; color: rgba(250,246,238,0.5); text-transform: uppercase;
          }
          /* Push page below the fixed bar */
          .page-wrapper { padding-top: 52px; }
        }
      `}</style>

      {/* ── Screen top bar (hidden when printing) ── */}
      <div className="print-bar no-print">
        <span className="print-bar-label">📋 Monthly Report Preview</span>
        <button className="print-btn" onClick={() => window.print()}>
          🖨 Print / Save as PDF
        </button>
      </div>

      <div className="page-wrapper">
        <div className="page">

          {/* ════════ DOCUMENT HEADER ════════ */}
          <div className="doc-header">
            <div className="school-brand">
              <div className="school-name">Study<span>Sync</span></div>
              <div className="school-sub">Learning Management System</div>
            </div>
            <div className="doc-meta">
              <div className="doc-type">Monthly Teaching Report</div>
              <div className="doc-period">{MONTHS[report.month - 1].toUpperCase()} {report.year}</div>
              {report.status === 'submitted' && (
                <div className="doc-stamp">Submitted</div>
              )}
            </div>
          </div>

          <div className="gold-rule" />

          {/* ════════ TEACHER INFORMATION ════════ */}
          <div className="section-head">Teacher Information</div>
          <div className="teacher-row">
            <div className="info-cell">
              <label>Name</label>
              <span>{report.teacherName}</span>
            </div>
            <div className="info-cell">
              <label>Email</label>
              <span>{report.teacherEmail}</span>
            </div>
            <div className="info-cell">
              <label>Report Period</label>
              <span>{MONTHS[report.month - 1]} {report.year}</span>
            </div>
          </div>

          {/* ════════ SUMMARY KPIs ════════ */}
          <div className="section-head">Summary Overview</div>
          <div className="kpi-grid">
            {[
              { num: report.summary.totalSubjects,    label: 'Subjects Taught' },
              { num: report.summary.totalStudents,    label: 'Total Students'  },
              { num: report.summary.totalProjects,    label: 'Active Projects' },
              { num: report.summary.avgGrade != null ? `${report.summary.avgGrade}` : '—', label: 'Avg Grade (pts)' },
            ].map(k => (
              <div key={k.label} className="kpi-box">
                <span className="kpi-num">{k.num}</span>
                <span className="kpi-label">{k.label}</span>
              </div>
            ))}
          </div>

          {/* ── Metrics bars ── */}
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Submission Rate</span>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill" style={{ width: `${subRate}%` }} />
              </div>
              <span className="metric-val">{report.summary.totalSubmissions}</span>
              &nbsp;<span style={{ fontSize: '7pt', color: 'var(--muted)', fontFamily: 'Share Tech Mono' }}>
                submissions ({subRate}% graded)
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Late Submissions</span>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill" style={{ width: `${lateRate}%`, background: lateRate > 20 ? 'var(--red)' : 'var(--green)' }} />
              </div>
              <span className={`metric-val ${lateRate > 20 ? 'warn' : ''}`}>{report.summary.lateSubmissions}</span>
              &nbsp;<span style={{ fontSize: '7pt', color: 'var(--muted)', fontFamily: 'Share Tech Mono' }}>
                late ({lateRate}% of total)
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Graded Work</span>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill" style={{ width: `${subRate}%` }} />
              </div>
              <span className="metric-val">{report.summary.gradedSubmissions}</span>
              &nbsp;<span style={{ fontSize: '7pt', color: 'var(--muted)', fontFamily: 'Share Tech Mono' }}>
                graded of {report.summary.totalSubmissions}
              </span>
            </div>
          </div>

          {/* ════════ SUBJECT BREAKDOWN ════════ */}
          <div className="section-head">Subject &amp; Project Breakdown</div>

          {report.subjects.map(subj => (
            <div key={subj.subjectId} className="subject-block">
              <div className="subject-header">
                <div>
                  <span className="subj-code">{subj.code}</span>
                  <span className="subj-name">{subj.name}</span>
                </div>
                <span className="subj-count">{subj.studentCount} students enrolled</span>
              </div>

              {subj.projects.length === 0 ? (
                <div style={{ background: 'var(--bg-warm)', border: '1pt solid var(--border)', borderTop: 'none', padding: '4mm 5mm' }}>
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: '7.5pt', color: 'var(--muted)', letterSpacing: '1pt' }}>
                    NO PROJECTS RECORDED THIS PERIOD
                  </span>
                </div>
              ) : (
                <table className="proj-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Project Title</th>
                      <th>Deadline</th>
                      <th>Max</th>
                      <th>Submitted</th>
                      <th>Graded</th>
                      <th>Late</th>
                      <th>Avg Grade</th>
                      <th>High</th>
                      <th>Low</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subj.projects.map(p => {
                      const submitPct = p.totalStudents > 0
                        ? Math.round((p.submitted / p.totalStudents) * 100) : 0
                      return (
                        <tr key={p.projectId}>
                          <td className="proj-title">{p.title}</td>
                          <td className="td-mono">{new Date(p.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="td-mono">{p.maxScore}</td>
                          <td>
                            <div className="sub-bar">
                              <div className="sub-bar-track">
                                <div className="sub-bar-fill" style={{ width: `${submitPct}%` }} />
                              </div>
                              <span className="td-mono" style={{ fontSize: '7.5pt', whiteSpace: 'nowrap' }}>
                                {p.submitted}/{p.totalStudents}
                              </span>
                            </div>
                          </td>
                          <td className="td-mono td-green">{p.graded}</td>
                          <td className={`td-mono ${p.late > 0 ? 'td-red' : ''}`}>{p.late}</td>
                          <td className="td-mono td-gold">{p.avgGrade ?? '—'}</td>
                          <td className="td-mono">{p.highestGrade ?? '—'}</td>
                          <td className="td-mono">{p.lowestGrade ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          {/* ════════ REMARKS ════════ */}
          <div className="section-head" style={{ marginTop: '8mm' }}>Remarks &amp; Observations</div>
          <div className="remarks-box">
            {report.remarks
              ? <p className="remarks-text">{report.remarks}</p>
              : <p className="remarks-empty">— NO REMARKS PROVIDED —</p>
            }
          </div>

          {/* ════════ SIGNATURES ════════ */}
          <div className="sig-grid">
            <div className="sig-box">
              <div className="sig-label">Prepared by</div>
              <div className="sig-name">{report.teacherName}</div>
            </div>
            <div className="sig-box">
              <div className="sig-label">Verified by</div>
              <div className="sig-name">&nbsp;</div>
            </div>
            <div className="sig-box">
              <div className="sig-label">Acknowledged by</div>
              <div className="sig-name">&nbsp;</div>
            </div>
          </div>

          {/* ════════ FOOTER ════════ */}
          <div className="doc-footer">
            <span className="footer-left">
              STUDYSYNC · MONTHLY TEACHING REPORT · {MONTHS[report.month - 1].toUpperCase()} {report.year}
            </span>
            <span className="footer-right">
              Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

        </div>
      </div>
    </>
  )
}

export default function TeacherReportPrintPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ fontFamily: 'monospace', color: '#7a6a52' }}>Loading report…</p>
      </div>
    }>
      <PrintPage />
    </Suspense>
  )
}