'use client'

import { useEffect, useRef, useState } from 'react'

// ── Searchable content index for the landing page ────────────────────────────
// Each entry: what users might type → where to scroll → what to show
const LANDING_INDEX = [
  // Hero
  { keywords: ['home','hero','top','welcome','studysync','start','main'],
    label: 'Hero — Welcome to StudySync', section: 'hero', icon: '🏠',
    desc: 'Introduction and main call-to-action' },

  // Features
  { keywords: ['features','feature','what','project','assignment','submission','announcement','grade','grading','announcement','material','file','upload','pdf','deadline','approve'],
    label: 'Features', section: 'features', icon: '✨',
    desc: 'Project management, grading, announcements, materials' },
  { keywords: ['project management','projects','create project','submit','submission'],
    label: 'Feature — Project Management', section: 'features', icon: '📋',
    desc: 'Create, submit and grade projects' },
  { keywords: ['grading','grade','score','marks','feedback','result'],
    label: 'Feature — Grading System', section: 'features', icon: '🏆',
    desc: 'Score submissions and give feedback' },
  { keywords: ['announcement','notice','pinned','broadcast'],
    label: 'Feature — Announcements', section: 'features', icon: '📢',
    desc: 'Post pinned announcements to subjects' },
  { keywords: ['material','resource','file','pdf','upload','cloudinary','attachment'],
    label: 'Feature — Learning Materials', section: 'features', icon: '📎',
    desc: 'Upload and share files with students' },

  // Roles
  { keywords: ['roles','role','admin','teacher','student','who','login','sign in','portal','access'],
    label: 'User Roles', section: 'roles', icon: '👥',
    desc: 'Admin, Teacher and Student portals' },
  { keywords: ['admin','administrator','manage','management'],
    label: 'Role — Administrator', section: 'roles', icon: '👑',
    desc: 'Full system control, user management, project approval' },
  { keywords: ['teacher','cikgu','instructor','educator'],
    label: 'Role — Teacher', section: 'roles', icon: '👨‍🏫',
    desc: 'Create projects, grade submissions, post announcements' },
  { keywords: ['student','murid','learner','pupil'],
    label: 'Role — Student', section: 'roles', icon: '🎒',
    desc: 'View projects, submit work, check grades' },

  // Tech stack
  { keywords: ['tech','stack','technology','nextjs','next.js','mongodb','tailwind','nextauth','built with','how built','technical'],
    label: 'Technology Stack', section: 'stack', icon: '⚙️',
    desc: 'Next.js, MongoDB, Tailwind CSS, NextAuth' },
  { keywords: ['nextjs','next.js','react','framework'],
    label: 'Stack — Next.js', section: 'stack', icon: '▲',
    desc: 'Built with Next.js 15 App Router' },
  { keywords: ['mongodb','database','atlas','db'],
    label: 'Stack — MongoDB Atlas', section: 'stack', icon: '🍃',
    desc: 'Cloud database with Mongoose ODM' },

  // Sign in / CTA
  { keywords: ['sign in','login','signin','enter','start','get started','credentials','password'],
    label: 'Sign In', section: 'cta', icon: '🔐',
    desc: 'Log in with your school credentials' },
  { keywords: ['about','contact','school','education','lms','learning management'],
    label: 'About StudySync', section: 'hero', icon: 'ℹ️',
    desc: 'Learning management system for schools' },
]

function scrollToSection(section: string) {
  if (section === 'hero') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (section === 'cta') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(section)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function search(query: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  const seen = new Set<string>()
  const results: typeof LANDING_INDEX = []

  for (const item of LANDING_INDEX) {
    if (seen.has(item.label)) continue
    const score = item.keywords.some(k => k.includes(q) || q.includes(k))
      || item.label.toLowerCase().includes(q)
      || item.desc.toLowerCase().includes(q)
    if (score) { seen.add(item.label); results.push(item) }
  }
  return results.slice(0, 6)
}

export default function LandingSearch() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<typeof LANDING_INDEX>([])
  const [open,    setOpen]    = useState(false)
  const [sel,     setSel]     = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const r = search(query)
    setResults(r)
    setSel(0)
    setOpen(r.length > 0)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function pick(item: typeof LANDING_INDEX[0]) {
    scrollToSection(item.section)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[sel]) pick(results[sel])
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(250,246,238,0.12)',
        border: '1px solid rgba(212,168,67,0.3)',
        borderRadius: 4, padding: '8px 14px',
        backdropFilter: 'blur(8px)',
        transition: 'border-color .2s, background .2s',
        ...(open || query ? {
          background: 'rgba(250,246,238,0.18)',
          borderColor: 'rgba(212,168,67,0.6)',
        } : {}),}}>
        <span style={{ color: 'rgba(212,168,67,0.7)', fontSize: 14, flexShrink: 0 }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => query && setOpen(results.length > 0)}
          placeholder="Search features, roles, tech..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: '#faf6ee', fontSize: 13, width: '100%',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '.3px',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }}
            style={{ background: 'none', border: 'none', color: 'rgba(212,168,67,0.5)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#2c1810',
          border: '1px solid rgba(212,168,67,0.25)',
          borderRadius: 4,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {results.map((r, i) => (
            <button key={r.label} onClick={() => pick(r)}
              onMouseEnter={() => setSel(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', textAlign: 'left',
                padding: '10px 14px',
                background: i === sel ? 'rgba(212,168,67,0.1)' : 'transparent',
                border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid rgba(212,168,67,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'background .15s',
              }}>
              <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: i === sel ? '#d4a843' : '#faf6ee',
                  fontSize: 12, fontWeight: 600,
                  fontFamily: 'Georgia, serif',
                  transition: 'color .15s',
                }}>
                  {highlight(r.label, query)}
                </div>
                <div style={{ color: 'rgba(250,246,238,0.45)', fontSize: 11, fontFamily: 'monospace', marginTop: 1 }}>
                  {r.desc}
                </div>
              </div>
              <span style={{ color: 'rgba(212,168,67,0.4)', fontSize: 10, fontFamily: 'monospace', flexShrink: 0 }}>
                scroll ↓
              </span>
            </button>
          ))}
          <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 12 }}>
            {[['↑↓','navigate'],['↵','go'],['esc','close']].map(([k,l]) => (
              <span key={k} style={{ color: 'rgba(250,246,238,0.3)', fontSize: 10, fontFamily: 'monospace' }}>
                <span style={{ color: 'rgba(212,168,67,0.5)', marginRight: 4 }}>{k}</span>{l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Bold-highlight matched chars
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(212,168,67,0.25)', color: '#d4a843', borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}