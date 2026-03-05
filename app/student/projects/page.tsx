'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock';
import {
  IconDraft, IconSubmitted, IconApproved, IconWarning,
  IconClose, IconTrash, IconSave, IconRefresh, IconCalendar, IconTrophy
} from '@/components/NavIcons'

interface Subject { _id: string; name: string; code: string }
interface Submission {
  _id: string; status: string; fileUrl: string; textResponse: string
  isLate: boolean; grade?: number; feedback?: string; submittedAt?: string
}
interface Project {
  _id: string; title: string; description: string; deadline: string; maxScore: number
  subject: Subject; submission: Submission | null
}
interface SubjectGroup { _id: string; name: string; code: string; projects: Project[] }

// ── Consistent time helper ────────────────────────────────────────────────────
// Future  → "9d left"
// Today   → "Due today"
// Overdue → "3d ago"
function timeLabel(deadline: string): { text: string; overdue: boolean; daysNum: number } {
  const daysNum = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysNum > 0)  return { text: `${daysNum}d left`,    overdue: false, daysNum }
  if (daysNum === 0) return { text: 'Due today',           overdue: false, daysNum: 0 }
  return              { text: `${Math.abs(daysNum)}d ago`, overdue: true,  daysNum }
}

// ── Status badge config ───────────────────────────────────────────────────────
// Matches Image 3: left-side pill shows Late / Not submitted only.
// Submitted / Draft / Graded show no pill on the left (graded is shown on right).
const LEFT_BADGE: Record<string, { label: string; style: string } | null> = {
  none:      { label: '○ Not submitted', style: 'text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)]' },
  draft:     { label: '✎ Draft',         style: 'text-[#8b5a2b] bg-[rgba(139,90,43,0.08)] border-[rgba(139,90,43,0.25)]' },
  submitted: null, // no pill — clean look like the screenshot
  graded:    null, // shown on the right as ✓ Graded
}

export default function StudentProjectsPage() {
  const [subjects,       setSubjects]       = useState<SubjectGroup[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeProject,  setActiveProject]  = useState<Project | null>(null)
  const [commentProject, setCommentProject] = useState<Project | null>(null)
  const [formFileUrl,    setFormFileUrl]    = useState('')
  const [formText,       setFormText]       = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState('')

  async function load() {
    try {
      const res  = await fetch('/api/student/subjects')
      const data = await res.json()
      const safe = Array.isArray(data) ? data : []
      setSubjects(safe.filter((s: any) => (s.projects ?? []).length > 0))
    } catch {
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openSubmit(project: Project) {
    setActiveProject(project)
    setFormFileUrl(project.submission?.fileUrl ?? '')
    setFormText(project.submission?.textResponse ?? '')
    setError('')
  }

  async function handleSubmit(isDraft: boolean) {
    if (!activeProject) return
    setError(''); setSubmitting(true)
    const existing = activeProject.submission
    const body = { projectId: activeProject._id, fileUrl: formFileUrl, textResponse: formText, isDraft }
    let res: Response
    if (existing) {
      res = await fetch('/api/student/submissions', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: existing._id, ...body }),
      })
    } else {
      res = await fetch('/api/student/submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    const data = await res.json(); setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    setActiveProject(null); load()
  }

  async function handleDelete(submissionId: string) {
    if (!confirm('Remove this submission?')) return
    await fetch('/api/student/submissions', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    })
    setActiveProject(null); load()
  }

  // 5-day deadline warnings (only unsubmitted / draft)
  const allProjects = subjects.flatMap((s) => s.projects)
  const warnings = allProjects.filter((p) => {
    const sub = p.submission
    if (sub && (sub.status === 'submitted' || sub.status === 'graded')) return false
    const { daysNum, overdue } = timeLabel(p.deadline)
    return !overdue && daysNum <= 5
  })

  return (
    <div>
      <Link href="/student"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#63b3ed] mb-6 group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span>
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <p className="text-[#63b3ed] text-xs font-mono tracking-[0.2em] uppercase mb-1">プロジェクト</p>
        <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Project Submissions</h1>
        <p className="text-[#7a6a52] text-sm mt-1">Submit your work, save drafts, or update existing submissions.</p>
      </div>
      <RealTimeClock accentColor="#63b3ed" />

      {/* Deadline warnings */}
      {warnings.length > 0 && (
        <div className="mb-5 space-y-2">
          {warnings.map((p) => {
            const { text } = timeLabel(p.deadline)
            return (
              <div key={p._id} className="flex items-center gap-3 bg-[rgba(212,168,67,0.08)] border border-[rgba(212,168,67,0.4)] rounded-sm px-4 py-2.5">
                <IconWarning size={18} color="#d4a843" />
                <span className="text-sm text-[#8b5a2b]">
                  <strong>{p.title}</strong> — {text}!
                </span>
                <button onClick={() => openSubmit(p)}
                  className="ml-auto text-xs px-3 py-1 bg-[#1a2535] text-[#63b3ed] rounded-sm border border-[rgba(99,179,237,0.3)] hover:bg-[#243040] transition-colors">
                  Submit now
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit / Edit Modal */}
      {activeProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-lg">
            <div className="bg-[#1a2535] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[#63b3ed] font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                {activeProject.submission ? 'Update Submission' : 'Submit Project'}
              </h2>
              <button onClick={() => setActiveProject(null)} className="text-[rgba(250,246,238,0.4)] hover:text-white">
                <IconClose size={20} color="currentColor" />
              </button>
            </div>
            <div className="p-6">
              {/* Project info */}
              <div className="mb-4 p-3 bg-[#faf6ee] border border-[#c8b89a] rounded-sm">
                <div className="font-bold text-[#1a1209] text-sm" style={{ fontFamily: 'Georgia, serif' }}>{activeProject.title}</div>
                <div className="text-xs text-[#7a6a52] mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1"><IconCalendar size={12} color="currentColor" /> Due {new Date(activeProject.deadline).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><IconTrophy size={12} color="currentColor" /> {activeProject.maxScore}pts max</span>
                </div>
                {activeProject.description && (
                  <p className="text-xs text-[#7a6a52] mt-1">{activeProject.description}</p>
                )}
              </div>

              {/* Teacher feedback — no grade shown */}
              {activeProject.submission?.feedback && (
                <div className="mb-4 p-3 bg-[rgba(26,122,110,0.06)] border border-[rgba(26,122,110,0.2)] rounded-sm">
                  <div className="text-xs font-mono text-[#1a7a6e] uppercase tracking-wider mb-1">Teacher Feedback</div>
                  <p className="text-sm text-[#1a1209]">{activeProject.submission.feedback}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">{error}</div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">File / Google Drive Link</label>
                <input value={formFileUrl} onChange={(e) => setFormFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#63b3ed]" />
                <p className="text-xs text-[#7a6a52] mt-1">Paste a Google Drive, OneDrive, or any shareable file link.</p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Notes / Text Response (optional)</label>
                <textarea value={formText} onChange={(e) => setFormText(e.target.value)} rows={3}
                  placeholder="Add any notes for your teacher..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#63b3ed] resize-none" />
              </div>

              <div className="flex gap-2 flex-wrap">
                {activeProject.submission && activeProject.submission.status !== 'graded' && (
                  <button onClick={() => handleDelete(activeProject.submission!._id)}
                    className="text-xs px-3 py-2 border border-[rgba(192,57,43,0.3)] text-[#c0392b] rounded-sm hover:bg-[rgba(192,57,43,0.08)] transition-colors flex items-center gap-1">
                    <IconTrash size={13} color="currentColor" /> Remove
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => handleSubmit(true)} disabled={submitting}
                    className="text-xs px-4 py-2 border border-[#c8b89a] text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm disabled:opacity-50 transition-colors flex items-center gap-1">
                    {submitting ? '…' : <><IconSave size={13} color="currentColor" /> Save Draft</>}
                  </button>
                  <button onClick={() => handleSubmit(false)} disabled={submitting || (!formFileUrl && !formText)}
                    className="text-xs px-4 py-2 bg-[#1a2535] text-[#63b3ed] border border-[rgba(99,179,237,0.3)] rounded-sm hover:bg-[#243040] disabled:opacity-50 transition-colors font-semibold">
                    {submitting ? 'Submitting…' : '📤 Submit'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#7a6a52] mt-2 text-center">
                Draft = saved privately. Submit = sent to teacher for grading.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Comment Modal */}
      {commentProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[5px_5px_0_#c8b89a] w-full max-w-sm">
            <div className="bg-[#1a2535] px-5 py-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-[#63b3ed] font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>Teacher Comment</h2>
                <p className="text-[rgba(250,246,238,0.4)] text-[10px] font-mono mt-0.5 truncate max-w-[220px]">{commentProject.title}</p>
              </div>
              <button onClick={() => setCommentProject(null)} className="text-[rgba(250,246,238,0.4)] hover:text-white p-1 rounded-sm transition-colors">
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

      {/* Project list */}
      {loading ? (
        <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading projects...</div>
      ) : subjects.length === 0 ? (
        <div className="bg-white border border-[#c8b89a] rounded-sm p-12 text-center shadow-[3px_3px_0_#c8b89a]">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-[#7a6a52] text-sm">No projects assigned yet. Check back later!</p>
        </div>
      ) : (
        subjects.map((subject) => (
          <div key={subject._id} className="mb-6">
            {/* Subject header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-mono text-[#c0392b] bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] px-2 py-0.5 rounded-sm">
                {subject.code}
              </span>
              <span className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{subject.name}</span>
            </div>

            <div className="space-y-3">
              {subject.projects.map((project) => {
                const sub       = project.submission
                const subStatus = sub?.status ?? 'none'
                const { text: timeText, overdue, daysNum } = timeLabel(project.deadline)
                const leftBadge = LEFT_BADGE[subStatus]

                return (
                  <div key={project._id}
                    className={`bg-white border rounded-sm p-5 shadow-[3px_3px_0_#c8b89a] transition-all hover:shadow-[4px_4px_0_#c8b89a] ${
                      overdue && subStatus === 'none' ? 'border-[rgba(192,57,43,0.4)]' : 'border-[#c8b89a]'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">

                        {/* Left status badges row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          {/* Left pill: Not submitted / Draft — null for submitted/graded */}
                          {leftBadge && (
                            <span className={`text-xs font-mono px-2 py-0.5 border rounded-sm ${leftBadge.style}`}>
                              {leftBadge.label}
                            </span>
                          )}
                          {/* Late badge — shown alongside the status pill */}
                          {sub?.isLate && (
                            <span className="text-xs font-mono px-2 py-0.5 border rounded-sm text-[#c0392b] bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)] flex items-center gap-1">
                              🕐 Late
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>{project.title}</h3>
                        {project.description && (
                          <p className="text-xs text-[#7a6a52] mt-0.5 line-clamp-1">{project.description}</p>
                        )}

                        {/* Meta row — consistent time, no grade */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#7a6a52] font-mono items-center">
                          <span className={`flex items-center gap-1 ${overdue && subStatus === 'none' ? 'text-[#c0392b] font-bold' : ''}`}>
                            <IconCalendar size={12} color={overdue && subStatus === 'none' ? '#c0392b' : '#7a6a52'} />
                            {timeText} · {new Date(project.deadline).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconTrophy size={12} color="#7a6a52" /> {project.maxScore}pts
                          </span>
                        </div>

                        {/* Comment + file link */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {sub?.feedback && (
                            <button onClick={() => setCommentProject(project)}
                              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-[rgba(26,122,110,0.3)] text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] hover:bg-[rgba(26,122,110,0.12)] rounded-sm transition-colors font-mono">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M1 1 Q1 0.5 1.5 0.5 L10.5 0.5 Q11 0.5 11 1 L11 7.5 Q11 8 10.5 8 L4 8 L1.5 10.5 L1.5 8 Q1 8 1 7.5 Z"
                                  stroke="#1a7a6e" strokeWidth="1" fill="rgba(26,122,110,0.15)" />
                              </svg>
                              Teacher comment
                            </button>
                          )}
                          {sub?.fileUrl && (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#63b3ed] hover:underline">
                              🔗 View submitted file
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right action — ✓ Graded badge (exact match to screenshot) or action button */}
                      {subStatus === 'graded' ? (
                        <span className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[rgba(26,122,110,0.3)] text-[#1a7a6e] bg-[rgba(26,122,110,0.06)] rounded-sm font-mono">
                          {/* ✓ checkmark icon matching the picture exactly */}
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <circle cx="6.5" cy="6.5" r="5.5" stroke="#1a7a6e" strokeWidth="1.2" />
                            <path d="M3.5 6.5L5.5 8.5L9.5 4.5" stroke="#1a7a6e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Graded
                        </span>
                      ) : (
                        <button onClick={() => openSubmit(project)}
                          className="shrink-0 text-xs px-4 py-2 bg-[#1a2535] text-[#63b3ed] border border-[rgba(99,179,237,0.3)] rounded-sm hover:bg-[#243040] transition-colors font-semibold flex items-center gap-1.5">
                          {sub ? (
                            sub.status === 'draft'
                              ? <><IconDraft size={13} color="currentColor" />Edit Draft</>
                              : <><IconRefresh size={13} color="currentColor" />Update</>
                          ) : (
                            <><IconSubmitted size={13} color="currentColor" />Submit</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}