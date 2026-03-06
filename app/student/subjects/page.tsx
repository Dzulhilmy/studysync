'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock';
import { IconDraft, IconSubmitted, IconApproved, IconTeacher } from '@/components/NavIcons'

interface Material {
  _id: string; title: string; type: string; url: string; topic: string
}
interface Project {
  _id: string; title: string; deadline: string; maxScore: number
  submission: { status: string; grade?: number } | null
}
interface Subject {
  _id: string; name: string; code: string; description: string
  teacher: { name: string; email: string } | null
  students: any[]
  projects: Project[]
  materials: Material[]
}

const TYPE_ICON: Record<string, string> = { pdf: '📄', video: '🎬', link: '🔗', doc: '📝' }

function getFileUrl(url: string, type: string): string {
  if (!url) return url
  const isPdf = type === 'pdf' || url.toLowerCase().includes('.pdf')
  if (isPdf && url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/fl_attachment/')
  }
  return url
}

// ── Status badge config — no grade shown anywhere ─────────────────────────────
const SUBMIT_STATUS: Record<string, { label: string; Icon?: React.ComponentType<any>; color: string }> = {
  draft:     { label: 'Draft',          Icon: IconDraft,      color: 'text-[#8b5a2b] bg-[rgba(139,90,43,0.08)] border-[rgba(139,90,43,0.25)]'   },
  submitted: { label: 'Submitted',      Icon: IconSubmitted,  color: 'text-[#1a7a6e] bg-[rgba(26,122,110,0.08)] border-[rgba(26,122,110,0.25)]'  },
  graded:    { label: 'Graded',         Icon: IconApproved,   color: 'text-[#8b5a2b] bg-[rgba(212,168,67,0.06)] border-[rgba(212,168,67,0.3)]'   },
  none:      { label: '⭕ Not submitted',                      color: 'text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)]'     },
}

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Subject | null>(null)
  const [tab,      setTab]      = useState<'projects' | 'materials'>('projects')

  useEffect(() => {
    fetch('/api/student/subjects')
      .then((r) => r.json())
      .then((data) => {
        const safe = Array.isArray(data) ? data : []
        setSubjects(safe)
        if (safe.length > 0) setSelected(safe[0])
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false))
  }, [])

  // Group materials by topic
  const grouped = (selected?.materials ?? []).reduce(
    (acc: Record<string, Material[]>, m) => {
      const t = m.topic || 'General'
      if (!acc[t]) acc[t] = []
      acc[t].push(m)
      return acc
    },
    {}
  )

  return (
    <div>
      <Link href="/student"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#63b3ed] mb-6 group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>

      <div className="mb-6">
        
        <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>My Subjects</h1>
        <p className="text-[#7a6a52] text-sm mt-1">View your enrolled subjects, projects, and learning materials.</p>
        <RealTimeClock accentColor="#63b3ed" />
      </div>

      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading subjects...</div>
      ) : subjects.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-[#7a6a52] text-sm">You're not enrolled in any subjects yet.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Subject list ── */}
          <div className="lg:col-span-2 space-y-2">
            {subjects.map((s) => (
              <button key={s._id}
                onClick={() => { setSelected(s); setTab('projects') }}
                className={`w-full text-left p-4 border rounded-sm transition-all ${
                  selected?._id === s._id
                    ? 'bg-[#1a2535] border-[rgba(99,179,237,0.4)] shadow-[3px_3px_0_rgba(26,37,53,0.4)]'
                    : 'bg-white border-[#c8b89a] hover:border-[#63b3ed] shadow-[2px_2px_0_#c8b89a]'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-xs font-mono ${selected?._id === s._id ? 'text-[#d4a843]' : 'text-[#c0392b]'}`}>
                      {s.code}
                    </span>
                    <div className={`font-bold text-sm mt-0.5 ${selected?._id === s._id ? 'text-[#faf6ee]' : 'text-[#1a1209]'}`}
                      style={{ fontFamily: 'Georgia, serif' }}>
                      {s.name}
                    </div>
                    <div className={`text-xs mt-0.5 flex items-center gap-1 ${selected?._id === s._id ? 'text-[rgba(250,246,238,0.4)]' : 'text-[#7a6a52]'}`}>
                      <IconTeacher size={12} color="currentColor" /> {s.teacher?.name ?? 'No teacher'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-mono ${selected?._id === s._id ? 'text-[rgba(99,179,237,0.6)]' : 'text-[#7a6a52]'}`}>
                      {s.projects.length} project{s.projects.length !== 1 ? 's' : ''}
                    </div>
                    <div className={`text-xs font-mono ${selected?._id === s._id ? 'text-[rgba(99,179,237,0.6)]' : 'text-[#7a6a52]'}`}>
                      {s.materials.length} material{s.materials.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Content panel ── */}
          <div className="lg:col-span-3">
            {selected && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-[#f0e9d6] p-1 rounded-sm w-fit">
                  {(['projects', 'materials'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-all ${
                        tab === t ? 'bg-[#1a2535] text-[#63b3ed]' : 'text-[#7a6a52] hover:text-[#1a1209]'
                      }`}>
                      {t === 'projects'
                        ? `🗂 Projects (${selected.projects.length})`
                        : `📖 Materials (${selected.materials.length})`}
                    </button>
                  ))}
                </div>

                {/* Projects tab */}
                {tab === 'projects' && (
                  <div className="space-y-3">
                    {selected.projects.length === 0 ? (
                      <div className="bg-white border border-[#c8b89a] rounded-sm p-8 text-center shadow-[3px_3px_0_#c8b89a]">
                        <div className="text-3xl mb-2">🗂</div>
                        <p className="text-[#7a6a52] text-sm">No approved projects yet.</p>
                      </div>
                    ) : selected.projects.map((p) => {
                      const subStatus = p.submission?.status ?? 'none'
                      const st        = SUBMIT_STATUS[subStatus] ?? SUBMIT_STATUS.none
                      const daysLeft  = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      const overdue   = daysLeft < 0

                      return (
                        <div key={p._id}
                          className="bg-white border border-[#c8b89a] rounded-sm p-4 shadow-[3px_3px_0_#c8b89a] hover:shadow-[4px_4px_0_#c8b89a] transition-all">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <h3 className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>
                                {p.title}
                              </h3>
                              {/* ── Meta row: deadline + max score only — grade intentionally hidden ── */}
                              <div className="flex gap-3 mt-1 text-xs text-[#7a6a52] font-mono flex-wrap items-center">
                                <span className={overdue && subStatus === 'none' ? 'text-[#c0392b] font-bold' : ''}>
                                  📅 {overdue
                                    ? `${Math.abs(daysLeft)}d ago`
                                    : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`
                                  } · {new Date(p.deadline).toLocaleDateString()}
                                </span>
                                <span>🏆 {p.maxScore}pts max</span>
                              </div>
                            </div>
                            {/* Status badge — "Graded" shows without score */}
                            <span className={`text-xs font-mono px-2 py-0.5 border rounded-sm shrink-0 flex items-center gap-1 ${st.color}`}>
                              {st.Icon && <st.Icon size={11} color="currentColor" />}
                              {st.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Materials tab */}
                {tab === 'materials' && (
                  <div className="space-y-3">
                    {selected.materials.length === 0 ? (
                      <div className="bg-white border border-[#c8b89a] rounded-sm p-8 text-center shadow-[3px_3px_0_#c8b89a]">
                        <div className="text-3xl mb-2">📭</div>
                        <p className="text-[#7a6a52] text-sm">No materials uploaded yet.</p>
                      </div>
                    ) : Object.entries(grouped).map(([topic, mats]) => (
                      <div key={topic} className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a] overflow-hidden">
                        <div className="bg-[#f0e9d6] border-b border-[#c8b89a] px-4 py-2 flex items-center justify-between">
                          <span className="text-xs font-mono text-[#8b5a2b] font-bold uppercase tracking-wider">📁 {topic}</span>
                          <span className="text-xs text-[#7a6a52] font-mono">{mats.length} file{mats.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="divide-y divide-[#f0e9d6]">
                          {mats.map((m) => (
                            <div key={m._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf6ee] group">
                              <span className="text-lg">{TYPE_ICON[m.type] ?? '🔗'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-[#1a1209] truncate">{m.title}</div>
                                <div className="text-xs text-[#7a6a52] font-mono">{m.type.toUpperCase()}</div>
                              </div>
                              <a href={getFileUrl(m.url, m.type)} target="_blank" rel="noreferrer"
                                className="text-xs px-3 py-1.5 bg-[#1a2535] text-[#63b3ed] border border-[rgba(99,179,237,0.3)] rounded-sm hover:bg-[#243040] transition-colors font-semibold opacity-0 group-hover:opacity-100">
                                {m.type === 'pdf' ? '⬇ Download' : '↗ Open'}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}