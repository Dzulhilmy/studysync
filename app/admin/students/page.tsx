'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import RealTimeClock from '@/components/RealTimeClock';

interface Student { _id: string; name: string; email: string }
interface Subject {
  _id: string; name: string; code: string
  teacher: { name: string } | null
  students: Student[]   // always an array after load — API populates it
}

export default function StudentsPage() {
  const [subjects,       setSubjects]       = useState<Subject[]>([])
  const [allStudents,    setAllStudents]    = useState<Student[]>([])
  const [loading,        setLoading]        = useState(true)
  const [selectedSubject,setSelectedSubject]= useState<Subject | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [search,         setSearch]         = useState('')
  const [error,          setError]          = useState('')

  // useRef gives a SYNCHRONOUS lock — unlike useState which batches async
  // This prevents the same button firing 4x before React re-renders with saving=true
  const lockRef = useRef(false)

  /* ── Load all data ──────────────────────────────── */
  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [sRes, uRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch('/api/admin/users'),
      ])
      if (!sRes.ok || !uRes.ok) throw new Error('Failed to load data')
      const [subs, users] = await Promise.all([sRes.json(), uRes.json()])
      setSubjects(subs)
      setAllStudents(users.filter((u: any) => u.role === 'student'))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  /* ── Helpers ────────────────────────────────────── */
  function getStudents(sub: Subject | null): Student[] {
    return sub?.students ?? []
  }

  function isEnrolled(studentId: string): boolean {
    return getStudents(selectedSubject).some(s => s._id === studentId)
  }

  /* ── Toggle enroll / unenroll ───────────────────── */
  async function toggleEnroll(studentId: string) {
    // Synchronous lock — prevents duplicate calls from rapid clicks
    if (!selectedSubject || lockRef.current) return
    lockRef.current = true
    setSaving(true)
    setError('')

    const enrolled = isEnrolled(studentId)
    const currentStudents = getStudents(selectedSubject)
    const updatedIds = enrolled
      ? currentStudents.filter(s => s._id !== studentId).map(s => s._id)
      : [...currentStudents.map(s => s._id), studentId]

    try {
      // PATCH — update enrollment
      const patchRes = await fetch(`/api/admin/subjects/${selectedSubject._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: updatedIds }),
      })

      if (!patchRes.ok) {
        const msg = await patchRes.text()
        throw new Error(`Server error ${patchRes.status}: ${msg}`)
      }

      // Re-fetch fresh populated data sequentially
      const sRes = await fetch('/api/admin/subjects')
      const freshSubjects: Subject[] = await sRes.json()

      const uRes = await fetch('/api/admin/users')
      const users = await uRes.json()

      // Find the updated subject by id
      const freshSelected = freshSubjects.find(s => s._id === selectedSubject._id) ?? null

      // Batch all state updates in one pass
      setSubjects(freshSubjects)
      setAllStudents(users.filter((u: any) => u.role === 'student'))
      setSelectedSubject(freshSelected)

    } catch (e: any) {
      setError(e.message)
    } finally {
      // Release lock AFTER everything settles
      lockRef.current = false
      setSaving(false)
    }
  }

  /* ── Filtered student list ──────────────────────── */
  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const enrolledCount = getStudents(selectedSubject).length

  /* ── UI ─────────────────────────────────────────── */
  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono text-[#7a6a52] hover:text-[#1a1209] mb-6 group transition-colors"
      >
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Dashboard
      </Link>
      <div className="mb-6">
        <p className="text-[#c0392b] text-xs font-mono tracking-[0.2em] uppercase mb-1">学生管理</p>
        <h1 className="text-2xl font-bold text-[#1a1209] font-serif">Student Management</h1>
        <p className="text-[#7a6a52] text-sm mt-1">Select a subject to manage student enrollment.</p>
      </div>
      <RealTimeClock accentColor="#d4a843" />

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.25)] rounded-sm text-sm text-[#c0392b] font-mono flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError('')} className="text-lg leading-none opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Subject list ── */}
        <div>
          <h2 className="text-sm font-mono text-[#7a6a52] uppercase tracking-wider mb-3">Select Subject</h2>
          {loading ? (
            <div className="text-[#7a6a52] text-sm font-mono animate-pulse">Loading...</div>
          ) : (
            <div className="space-y-2">
              {subjects.map(s => (
                <button
                  key={s._id}
                  onClick={() => { setSelectedSubject(s); setSearch(''); setError('') }}
                  className={`w-full text-left p-4 border rounded-sm transition-all ${
                    selectedSubject?._id === s._id
                      ? 'bg-[#2c1810] border-[rgba(212,168,67,0.4)] shadow-[3px_3px_0_rgba(26,18,9,0.3)]'
                      : 'bg-white border-[#c8b89a] hover:border-[#d4a843] shadow-[2px_2px_0_#c8b89a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-mono ${selectedSubject?._id === s._id ? 'text-[#d4a843]' : 'text-[#c0392b]'}`}>
                        {s.code}
                      </span>
                      <div className={`font-serif font-bold text-sm mt-0.5 ${selectedSubject?._id === s._id ? 'text-[#faf6ee]' : 'text-[#1a1209]'}`}>
                        {s.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${selectedSubject?._id === s._id ? 'text-[rgba(250,246,238,0.4)]' : 'text-[#7a6a52]'}`}>
                        👩‍🏫 {s.teacher?.name ?? 'Unassigned'}
                      </div>
                    </div>
                    <span className={`text-xs font-mono px-2 py-1 rounded-sm border ${
                      selectedSubject?._id === s._id
                        ? 'text-[#d4a843] border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.1)]'
                        : 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] bg-[rgba(26,122,110,0.06)]'
                    }`}>
                      {/* Safe: always use ?? [] */}
                      {(s.students ?? []).length} enrolled
                    </span>
                  </div>
                </button>
              ))}
              {subjects.length === 0 && (
                <p className="text-[#7a6a52] text-sm text-center py-8">No subjects found. Create subjects first.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Student assignment panel ── */}
        <div>
          <h2 className="text-sm font-mono text-[#7a6a52] uppercase tracking-wider mb-3">
            {selectedSubject ? `Students — ${selectedSubject.name}` : 'Students'}
          </h2>

          {!selectedSubject ? (
            <div className="bg-white border border-[#c8b89a] rounded-sm p-10 text-center shadow-[3px_3px_0_#c8b89a]">
              <div className="text-3xl mb-2">👈</div>
              <p className="text-[#7a6a52] text-sm">Select a subject on the left to manage its students.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#c8b89a] rounded-sm shadow-[3px_3px_0_#c8b89a]">

              {/* Search */}
              <div className="p-3 border-b border-[#f0e9d6]">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full border border-[#c8b89a] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#d4a843]"
                />
              </div>

              {/* List */}
              <div className="divide-y divide-[#f0e9d6] max-h-[400px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-center py-8 text-[#7a6a52] text-sm">No students found.</p>
                ) : filteredStudents.map(student => {
                  const enrolled = isEnrolled(student._id)
                  return (
                    <div key={student._id} className="flex items-center justify-between px-4 py-3 hover:bg-[#faf6ee]">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-sm bg-[#f0e9d6] border border-[#c8b89a] flex items-center justify-center text-xs font-bold text-[#8b5a2b]">
                          {student.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#1a1209]">{student.name}</div>
                          <div className="text-xs text-[#7a6a52]">{student.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleEnroll(student._id)}
                        disabled={saving}   // visual feedback
                        className={`text-xs px-3 py-1.5 rounded-sm border font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          enrolled
                            ? 'text-[#c0392b] border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.08)]'
                            : 'text-[#1a7a6e] border-[rgba(26,122,110,0.3)] hover:bg-[rgba(26,122,110,0.08)]'
                        }`}
                      >
                        {saving ? '...' : enrolled ? '− Remove' : '+ Enroll'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Footer count */}
              <div className="px-4 py-2 border-t border-[#f0e9d6] text-xs text-[#7a6a52] font-mono bg-[#faf6ee]">
                {enrolledCount} student{enrolledCount !== 1 ? 's' : ''} enrolled
                {saving && <span className="ml-2 text-[#d4a843] animate-pulse">· saving…</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}