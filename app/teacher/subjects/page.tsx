'use client'

import { useEffect, useState } from 'react'
import FileUpload from '@/components/FileUpload'
import RealTimeClock from '@/components/RealTimeClock'

interface Material { _id: string; title: string; type: string; url: string; topic: string; createdAt: string; linkUrl?: string; fileUrl?: string }
interface Subject { _id: string; name: string; code: string; description: string; students: any[]; materialCount: number }

const TYPE_ICON: Record<string, string> = { pdf: '📄', video: '🎬', link: '🔗', doc: '📝', upload: '📎' }
const EMPTY_MAT = { title: '', type: 'link', url: '', fileUrl: '', topic: 'General' }

export default function TeacherSubjectsPage() {
  const [subjects,    setSubjects]    = useState<Subject[]>([])
  const [materials,   setMaterials]   = useState<Material[]>([])
  const [selected,    setSelected]    = useState<Subject | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingMats, setLoadingMats] = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState(EMPTY_MAT)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  async function loadSubjects() {
    try {
      const res  = await fetch('/api/teacher/subjects')
      const data = await res.json()
      setSubjects(Array.isArray(data) ? data : [])
    } catch { setSubjects([]) }
    finally  { setLoading(false) }
  }

  async function loadMaterials(subjectId: string) {
    setLoadingMats(true)
    try {
      const res  = await fetch(`/api/teacher/materials?subject=${subjectId}`)
      const data = await res.json()
      setMaterials(Array.isArray(data) ? data : [])
    } catch { setMaterials([]) }
    finally  { setLoadingMats(false) }
  }

  useEffect(() => { loadSubjects() }, [])

  function selectSubject(s: Subject) {
    setSelected(s)
    loadMaterials(s._id)
    setShowForm(false)
  }

  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return

    // Must provide at least one of URL or file
    if (!form.url.trim() && !form.fileUrl.trim()) {
      setError('Please provide a URL/link or upload a file (or both).')
      return
    }

    setError('')
    setSubmitting(true)

    // Auto-set type to 'upload' when only a file was provided
    const resolvedType =
      form.type === 'link' && !form.url.trim() && form.fileUrl ? 'upload' : form.type

    // Primary url = file takes priority so existing material cards still open it
    const primaryUrl = form.fileUrl.trim() || form.url.trim()

    const res = await fetch('/api/teacher/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:   form.title,
        type:    resolvedType,
        url:     primaryUrl,
        fileUrl: form.fileUrl || null,
        linkUrl: form.url     || null,
        topic:   form.topic,
        subject: selected._id,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    setForm(EMPTY_MAT)
    setShowForm(false)
    loadMaterials(selected._id)
    loadSubjects()
  }

  async function deleteMaterial(id: string) {
    if (!confirm('Remove this material?')) return
    await fetch('/api/teacher/materials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (selected) loadMaterials(selected._id)
  }

  // Group by topic
  const grouped = materials.reduce((acc: Record<string, Material[]>, m) => {
    const t = m.topic || 'General'
    if (!acc[t]) acc[t] = []
    acc[t].push(m)
    return acc
  }, {})

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[#1a7a6e] text-xs font-mono tracking-[0.2em] uppercase mb-1">科目管理</p>
          <h1 className="text-2xl font-bold text-[#1a1209]" style={{ fontFamily: 'Georgia, serif' }}>Subject Management</h1>
          <p className="text-[#7a6a52] text-sm mt-1">Select a subject to manage its learning materials.</p>
        </div>
        <RealTimeClock accentColor="#1a7a6e" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Subject list ── */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-3">My Subjects</h2>
          {loading ? (
            <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading...</div>
          ) : subjects.length === 0 ? (
            <p className="text-[#7a6a52] text-sm">No subjects assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map(s => (
                <button key={s._id} onClick={() => selectSubject(s)}
                  className={`w-full text-left p-4 border rounded-sm transition-all ${
                    selected?._id === s._id
                      ? 'bg-[#1a3a2a] border-[rgba(26,122,110,0.5)] shadow-[3px_3px_0_rgba(26,18,9,0.3)]'
                      : 'bg-white border-[#c8b89a] hover:border-[#1a7a6e] shadow-[2px_2px_0_#c8b89a]'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-mono ${selected?._id === s._id ? 'text-[#d4a843]' : 'text-[#c0392b]'}`}>{s.code}</span>
                      <div className={`font-bold text-sm mt-0.5 ${selected?._id === s._id ? 'text-[#faf6ee]' : 'text-[#1a1209]'}`}
                        style={{ fontFamily: 'Georgia, serif' }}>{s.name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-mono ${selected?._id === s._id ? 'text-[rgba(250,246,238,0.5)]' : 'text-[#7a6a52]'}`}>
                        {s.students?.length ?? 0} students
                      </div>
                      <div className={`text-xs font-mono ${selected?._id === s._id ? 'text-[rgba(212,168,67,0.6)]' : 'text-[#7a6a52]'}`}>
                        {s.materialCount ?? 0} materials
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Materials panel ── */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono text-[#7a6a52] uppercase tracking-wider">
              {selected ? `Materials — ${selected.name}` : 'Materials'}
            </h2>
            {selected && (
              <button onClick={() => { setShowForm(true); setError('') }}
                className="text-xs px-3 py-1.5 bg-[#1a3a2a] text-[#d4a843] border border-[rgba(212,168,67,0.3)] rounded-sm hover:bg-[#224d38] transition-colors font-semibold">
                ＋ Add Material
              </button>
            )}
          </div>

          {!selected ? (
            <div className="bg-white border border-[#c8b89a] rounded-sm p-10 text-center shadow-[3px_3px_0_#c8b89a]">
              <div className="text-3xl mb-2">👈</div>
              <p className="text-[#7a6a52] text-sm">Select a subject to view and add materials.</p>
            </div>
          ) : (
            <>
              {/* ════════════════════════
                  ADD MATERIAL FORM
              ════════════════════════ */}
              {showForm && (
                <div className="bg-white border border-[#1a7a6e] rounded-sm p-5 mb-4 shadow-[3px_3px_0_rgba(26,122,110,0.3)]">
                  <h3 className="font-bold text-[#1a1209] mb-4 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                    Add New Material
                  </h3>
                  <form onSubmit={handleAddMaterial} className="space-y-4">
                    {error && (
                      <div className="text-[#c0392b] text-xs bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] px-3 py-2 rounded-sm">
                        {error}
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Title</label>
                      <input
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        required
                        placeholder="e.g. Chapter 1 Notes"
                        className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]"
                      />
                    </div>

                    {/* Type + Topic */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Type</label>
                        <select
                          value={form.type}
                          onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                          className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]"
                        >
                          <option value="link">🔗 Link</option>
                          <option value="pdf">📄 PDF</option>
                          <option value="video">🎬 Video</option>
                          <option value="doc">📝 Document</option>
                          <option value="upload">📎 File Upload</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">Topic</label>
                        <input
                          value={form.topic}
                          onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                          placeholder="e.g. Chapter 1"
                          className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]"
                        />
                      </div>
                    </div>

                    {/* ── URL / Link — always visible ── */}
                    <div>
                      <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                        URL / Link
                        <span className="normal-case font-sans ml-1.5 text-[10px] opacity-55">
                          (optional if file uploaded below)
                        </span>
                      </label>
                      <input
                        value={form.url}
                        onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                        placeholder="https://..."
                        className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1a7a6e]"
                      />
                    </div>

                    {/* ── AND / OR divider ── */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-[#e8dfd0]" />
                      <span className="text-[10px] font-mono text-[#a89880] uppercase tracking-widest px-1">
                        and / or
                      </span>
                      <div className="flex-1 h-px bg-[#e8dfd0]" />
                    </div>

                    {/* ── File Attachment — always visible ── */}
                    <div>
                      <label className="block text-xs font-mono text-[#7a6a52] uppercase tracking-wider mb-1">
                        File Attachment
                        <span className="normal-case font-sans ml-1.5 text-[10px] opacity-55">
                          (optional if URL provided above)
                        </span>
                      </label>
                      <FileUpload
                        value={form.fileUrl}
                        onChange={(url) => setForm(p => ({ ...p, fileUrl: url }))}
                        accentColor="#1a7a6e"
                      />
                    </div>

                    {/* Hint */}
                    <p className="text-[10px] font-mono text-[#7a6a52] bg-[rgba(26,122,110,0.04)] border border-[rgba(26,122,110,0.12)] rounded-sm px-3 py-2">
                      💡 You can add both — students will see a <strong>Link</strong> and a <strong>Download</strong> button side by side.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowForm(false); setForm(EMPTY_MAT); setError('') }}
                        className="flex-1 py-2 border border-[#c8b89a] text-xs text-[#7a6a52] hover:bg-[#faf6ee] rounded-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2 bg-[#1a3a2a] text-[#d4a843] text-xs font-semibold rounded-sm disabled:opacity-50 transition-colors hover:bg-[#224d38]"
                      >
                        {submitting ? 'Adding...' : 'Add Material'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Materials list grouped by topic ── */}
              {loadingMats ? (
                <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading materials...</div>
              ) : materials.length === 0 ? (
                <div className="bg-white border border-[#c8b89a] rounded-sm p-8 text-center shadow-[3px_3px_0_#c8b89a]">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-[#7a6a52] text-sm">No materials yet. Add your first one above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grouped).map(([topic, mats]) => (
                    <div key={topic} className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a] overflow-hidden">
                      <div className="bg-[#f0e9d6] border-b border-[#c8b89a] px-4 py-2 flex items-center gap-2">
                        <span className="text-xs font-mono text-[#8b5a2b] font-bold uppercase tracking-wider">📁 {topic}</span>
                        <span className="text-xs text-[#7a6a52] font-mono ml-auto">{mats.length} item{mats.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="divide-y divide-[#f0e9d6]">
                        {mats.map(m => (
                          <div key={m._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf6ee] group">
                            <span className="text-lg">{TYPE_ICON[m.type] ?? '🔗'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[#1a1209] truncate">{m.title}</div>
                              {/* Show both link + file buttons when both exist */}
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[10px] font-mono text-[#7a6a52] uppercase">{m.type}</span>
                                {m.linkUrl && (
                                  <a href={m.linkUrl} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-mono text-[#1a7a6e] border border-[rgba(26,122,110,0.25)] bg-[rgba(26,122,110,0.05)] px-2 py-0.5 rounded-sm hover:bg-[rgba(26,122,110,0.1)] transition-colors">
                                    🔗 Link ↗
                                  </a>
                                )}
                                {m.fileUrl && (
                                  <a href={m.fileUrl} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-mono text-[#8b5a2b] border border-[rgba(139,90,43,0.25)] bg-[rgba(139,90,43,0.05)] px-2 py-0.5 rounded-sm hover:bg-[rgba(139,90,43,0.1)] transition-colors">
                                    📎 File ↗
                                  </a>
                                )}
                                {/* Fallback for old materials that only have url */}
                                {!m.linkUrl && !m.fileUrl && m.url && (
                                  <a href={m.url} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-mono text-[#1a7a6e] border border-[rgba(26,122,110,0.25)] bg-[rgba(26,122,110,0.05)] px-2 py-0.5 rounded-sm hover:bg-[rgba(26,122,110,0.1)] transition-colors">
                                    ↗ Open
                                  </a>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteMaterial(m._id)}
                              className="text-xs px-2 py-1 border border-[rgba(192,57,43,0.3)] text-[#c0392b] rounded-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgba(192,57,43,0.08)]"
                            >
                              Remove
                            </button>
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
    </div>
  )
}