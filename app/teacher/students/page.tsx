'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock';

interface StudentProgress {
  _id: string; name: string; email: string
  submitted: number; graded: number; totalProjects: number
  progressPct: number; avgGrade: number | null
}
interface SubjectGroup {
  subject: { _id: string; name: string; code: string }
  students: StudentProgress[]
  totalProjects: number
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-[#f0e9d6] rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function TeacherStudentsPage() {
  const [data, setData] = useState<SubjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/teacher/students')
      .then(r => r.json())
      .then(d => {
        const safe = Array.isArray(d) ? d : []
        setData(safe)
        if (safe.length > 0) setSelectedSubject(safe[0].subject._id)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const currentGroup = data.find(g => g.subject._id === selectedSubject)
  const filteredStudents = (currentGroup?.students ?? []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  function getGradeColor(avg: number | null) {
    if (avg === null) return '#c8b89a'
    if (avg >= 80) return '#1a7a6e'
    if (avg >= 60) return '#d4a843'
    return '#c0392b'
  }

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
      <div className="mb-6">
        <p className="text-[#1a7a6e] text-xs font-mono tracking-[0.2em] uppercase mb-1">学生管理</p>
        <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Student Progress</h1>
        <p className="text-[#7a6a52] text-sm mt-1">Track submission progress for each subject.</p>
      </div>
      <RealTimeClock accentColor="#1a7a6e" />

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading...</div>
      ) : data.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-[#7a6a52] text-sm">No subjects or students found.</p>
        </div>
      ) : (
        <>
          {/* Subject tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {data.map(g => (
              <button key={g.subject._id} onClick={() => { setSelectedSubject(g.subject._id); setSearch('') }}
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
              {/* Subject summary */}
              <div className="bg-white border border-[#c8b89a] rounded-sm p-4 mb-4 shadow-[3px_3px_0_#c8b89a] flex flex-wrap gap-4 items-center">
                <div>
                  <div className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider">Subject</div>
                  <div className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{currentGroup.subject.name}</div>
                </div>
                <div className="h-8 w-px bg-[#c8b89a] hidden sm:block" />
                <div><div className="text-xs font-mono text-[#7a6a52]">Students</div><div className="font-bold text-[#1a1209]">{currentGroup.students.length}</div></div>
                <div><div className="text-xs font-mono text-[#7a6a52]">Approved Projects</div><div className="font-bold text-[#1a1209]">{currentGroup.totalProjects}</div></div>
                <div className="ml-auto">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
                    className="border border-[#c8b89a] px-3 py-1.5 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e] w-48" />
                </div>
              </div>

              {/* Student cards */}
              {filteredStudents.length === 0 ? (
                <p className="text-center py-10 text-[#7a6a52] text-sm">No students found.</p>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map(s => (
                    <div key={s._id} className="bg-white border border-[#c8b89a] rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] hover:shadow-[4px_4px_0_#c8b89a] transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 sm:w-48 shrink-0">
                          <div className="w-9 h-9 rounded-sm bg-[#1a3a2a] border border-[rgba(26,122,110,0.4)] flex items-center justify-center text-sm font-bold text-[#d4a843]">
                            {s.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1a1209] text-sm">{s.name}</div>
                            <div className="text-xs text-[#7a6a52] truncate max-w-[130px]">{s.email}</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[#7a6a52] font-mono">Submission progress</span>
                            <span className="text-xs font-bold text-[#1a1209] font-mono">{s.submitted}/{s.totalProjects}</span>
                          </div>
                          <ProgressBar pct={s.progressPct} color={
                            s.progressPct === 100 ? '#1a7a6e' :
                            s.progressPct >= 50 ? '#d4a843' : '#c0392b'
                          } />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] font-mono text-[#7a6a52]">{s.progressPct}% submitted</span>
                            <span className="text-[10px] font-mono text-[#7a6a52]">{s.graded} graded</span>
                          </div>
                        </div>

                        {/* Average grade badge */}
                        <div className="shrink-0 text-center sm:w-20">
                          <div className="text-xs font-mono text-[#7a6a52] mb-1">Avg Grade</div>
                          <div className="text-xl font-bold" style={{ color: getGradeColor(s.avgGrade), fontFamily: 'Georgia, serif' }}>
                            {s.avgGrade !== null ? `${s.avgGrade}` : '—'}
                          </div>
                          {s.avgGrade !== null && (
                            <div className="text-[10px] font-mono" style={{ color: getGradeColor(s.avgGrade) }}>
                              {s.avgGrade >= 80 ? 'Excellent' : s.avgGrade >= 60 ? 'Good' : 'Needs help'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}