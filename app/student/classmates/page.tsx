'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock';

interface ClassmateProgress {
  _id: string; name: string; isMe: boolean
  submitted: number; totalProjects: number; progressPct: number
}
interface SubjectGroup {
  subject: { _id: string; name: string; code: string; teacher: string }
  classmates: ClassmateProgress[]
  totalProjects: number
}

function ProgressBar({ pct, isMe }: { pct: number; isMe: boolean }) {
  const color = isMe
    ? '#63b3ed'
    : pct === 100 ? '#1a7a6e' : pct >= 50 ? '#d4a843' : '#c0392b'

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 bg-[#f0e9d6] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-xs font-mono font-bold w-8 text-right shrink-0"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  )
}

export default function ClassmatesPage() {
  const [data, setData] = useState<SubjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/student/classmates')
      .then((r) => r.json())
      .then((d) => {
        const safe = Array.isArray(d) ? d : []
        setData(safe)
        if (safe.length > 0) setSelectedSubject(safe[0].subject._id)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const current = data.find((g) => g.subject._id === selectedSubject)
  const filtered = (current?.classmates ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Link
        href="/student"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#63b3ed] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Dashboard
      </Link>
      <div className="mb-6">
        <p className="text-[#63b3ed] text-xs font-mono tracking-[0.2em] uppercase mb-1">
          クラスメート
        </p>
        <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
          Classmates
        </h1>
        <p className="text-[#7a6a52] text-sm mt-1">
          See how your classmates are progressing. Grades are kept private.
        </p>
        <RealTimeClock accentColor="#63b3ed" />
      </div>

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading...</div>
      ) : data.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-[#7a6a52] text-sm">No classmates found yet.</p>
        </div>
      ) : (
        <>
          {/* Subject tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {data.map((g) => (
              <button
                key={g.subject._id}
                onClick={() => { setSelectedSubject(g.subject._id); setSearch('') }}
                className={`px-4 py-1.5 text-xs font-mono rounded-sm border transition-all ${
                  selectedSubject === g.subject._id
                    ? 'bg-[#1a2535] text-[#63b3ed] border-[rgba(99,179,237,0.4)]'
                    : 'bg-white text-[#7a6a52] border-[#c8b89a] hover:border-[#63b3ed]'
                }`}
              >
                {g.subject.code} · {g.classmates.length} students
              </button>
            ))}
          </div>

          {current && (
            <>
              {/* Subject info bar */}
              <div className="bg-white border border-[#c8b89a] rounded-sm p-4 mb-4 shadow-[3px_3px_0_#c8b89a] flex flex-wrap gap-4 items-center">
                <div>
                  <div className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider">Subject</div>
                  <div className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
                    {current.subject.name}
                  </div>
                </div>
                <div className="h-8 w-px bg-[#c8b89a] hidden sm:block" />
                <div>
                  <div className="text-xs font-mono text-[#7a6a52]">Teacher</div>
                  <div className="font-semibold text-[#1a1209] text-sm">{current.subject.teacher}</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-[#7a6a52]">Approved Projects</div>
                  <div className="font-bold text-[#1a1209]">{current.totalProjects}</div>
                </div>
                <div className="ml-auto">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search classmates..."
                    className="border border-[#c8b89a] px-3 py-1.5 text-sm rounded-sm focus:outline-none focus:border-[#63b3ed] w-44"
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mb-3 flex-wrap">
                {[
                  { color: '#63b3ed', label: 'You' },
                  { color: '#1a7a6e', label: '100% done' },
                  { color: '#d4a843', label: '50–99%' },
                  { color: '#c0392b', label: 'Below 50%' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                    <span className="text-xs text-[#7a6a52] font-mono">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Classmate list */}
              {filtered.length === 0 ? (
                <p className="text-[#7a6a52] text-sm text-center py-10">No classmates found.</p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((classmate, i) => (
                    <div
                      key={classmate._id}
                      className={`bg-white border rounded-sm px-5 py-4 shadow-[3px_3px_0_#c8b89a] transition-all ${
                        classmate.isMe
                          ? 'border-[rgba(99,179,237,0.4)] bg-[rgba(99,179,237,0.02)]'
                          : 'border-[#c8b89a]'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                        {/* Rank */}
                        <div className="text-xs font-mono text-[#7a6a52] w-6 shrink-0 text-center">
                          {classmate.isMe ? '★' : `#${i + 1}`}
                        </div>

                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-bold shrink-0 ${
                            classmate.isMe
                              ? 'bg-[#1a2535] border border-[rgba(99,179,237,0.4)] text-[#63b3ed]'
                              : 'bg-[#f0e9d6] border border-[#c8b89a] text-[#8b5a2b]'
                          }`}
                        >
                          {classmate.name[0]}
                        </div>

                        {/* Name */}
                        <div className="w-40 shrink-0">
                          <div
                            className={`text-sm font-semibold truncate ${
                              classmate.isMe ? 'text-[#63b3ed]' : 'text-[#1a1209]'
                            }`}
                          >
                            {classmate.name}
                          </div>
                          <div className="text-xs text-[#7a6a52] font-mono">
                            {classmate.submitted}/{classmate.totalProjects} submitted
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex-1 min-w-[120px]">
                          <ProgressBar pct={classmate.progressPct} isMe={classmate.isMe} />
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