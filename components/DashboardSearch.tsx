'use client'

/**
 * DashboardSearch — ⌘K command palette for Admin / Teacher / Student
 *
 * Usage (in any dashboard page or layout):
 *   import DashboardSearch from '@/components/DashboardSearch'
 *   <DashboardSearch role="admin" />   // or "teacher" | "student"
 *
 * Keyboard: ⌘K or Ctrl+K to open, ↑↓ navigate, ↵ go, Esc close
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Search index per role ──────────────────────────────────────────────────

type Item = {
  label: string
  desc:  string
  icon:  string
  href:  string
  tags:  string[]
  group: string
}

const ADMIN_ITEMS: Item[] = [
  // Pages
  { label:'Dashboard',         desc:'Overview of all system stats',                icon:'⛩',  href:'/admin',             group:'Pages',   tags:['home','overview','stats','dashboard','main'] },
  { label:'Users',             desc:'Manage all users — admin, teachers, students',icon:'👥',  href:'/admin/users',        group:'Pages',   tags:['users','people','accounts','manage','add user','create user'] },
  { label:'Subjects',          desc:'Create and manage subjects',                  icon:'📚',  href:'/admin/subjects',     group:'Pages',   tags:['subjects','courses','class','subject'] },
  { label:'Students',          desc:'View enrolled students per subject',           icon:'🎓',  href:'/admin/students',     group:'Pages',   tags:['students','enroll','enrolled','assign'] },
  { label:'Projects',          desc:'Review and approve/reject teacher projects',   icon:'🗂',  href:'/admin/projects',     group:'Pages',   tags:['projects','approve','reject','review','pending','approval'] },
  { label:'Reports',           desc:'View monthly reports submitted by teachers',   icon:'📊',  href:'/admin/reports',      group:'Pages',   tags:['reports','monthly','teacher reports','submitted'] },
  { label:'Announcements',     desc:'View notifications and announcements',         icon:'📢',  href:'/admin/announcements',group:'Pages',   tags:['announcements','notifications','notice','bell'] },
  { label:'Profile',           desc:'Edit your admin profile and password',         icon:'⚙️',  href:'/admin/profile',      group:'Pages',   tags:['profile','settings','password','account','edit'] },
  // Actions
  { label:'Add New User',      desc:'Create a new admin, teacher or student',      icon:'➕',  href:'/admin/users',        group:'Actions', tags:['add','new','create','user','register'] },
  { label:'Create Subject',    desc:'Add a new subject to the system',             icon:'📝',  href:'/admin/subjects',     group:'Actions', tags:['create','new','subject','add subject'] },
  { label:'Review Projects',   desc:'Approve or reject pending projects',          icon:'✅',  href:'/admin/projects',     group:'Actions', tags:['review','approve','reject','pending'] },
  { label:'Assign Students',   desc:'Enroll students into subjects',               icon:'🔗',  href:'/admin/students',     group:'Actions', tags:['assign','enroll','students','subject'] },
  { label:'View Reports',      desc:'Read submitted teacher monthly reports',       icon:'📋',  href:'/admin/reports',      group:'Actions', tags:['view','reports','monthly','teacher'] },
]

const TEACHER_ITEMS: Item[] = [
  { label:'Dashboard',         desc:'Your teaching overview and stats',            icon:'⛩',  href:'/teacher',             group:'Pages',   tags:['home','overview','dashboard','main'] },
  { label:'Subjects',          desc:'View your assigned subjects',                  icon:'📚',  href:'/teacher/subjects',    group:'Pages',   tags:['subjects','class','my subjects','courses'] },
  { label:'Projects',          desc:'Create and manage your projects',              icon:'🗂',  href:'/teacher/projects',    group:'Pages',   tags:['projects','create','assignment','project'] },
  { label:'Students',          desc:'View students and grade their submissions',    icon:'🎓',  href:'/teacher/students',    group:'Pages',   tags:['students','grade','grading','submissions','marks'] },
  { label:'Announcements',     desc:'Post announcements and view notifications',    icon:'📢',  href:'/teacher/announcements',group:'Pages',  tags:['announcements','post','notice','notification'] },
  { label:'Monthly Reports',   desc:'Generate and submit monthly reports to admin', icon:'📊',  href:'/teacher/reports',     group:'Pages',   tags:['report','monthly','submit','admin','generate'] },
  { label:'Profile',           desc:'Edit your profile and password',               icon:'⚙️',  href:'/teacher/profile',     group:'Pages',   tags:['profile','settings','password','account'] },
  // Actions
  { label:'Create New Project',desc:'Add a new project for a subject',             icon:'➕',  href:'/teacher/projects',    group:'Actions', tags:['create','new','project','add','assignment'] },
  { label:'Grade Submissions', desc:'Mark and give feedback on student work',       icon:'✏️',  href:'/teacher/students',    group:'Actions', tags:['grade','mark','feedback','submission','score'] },
  { label:'Post Announcement', desc:'Broadcast a notice to your subject students',  icon:'📣',  href:'/teacher/announcements',group:'Actions',tags:['post','announce','broadcast','notice'] },
  { label:'Generate Report',   desc:'Create this month\'s teaching report',         icon:'📋',  href:'/teacher/reports',     group:'Actions', tags:['generate','report','monthly','create report'] },
  { label:'Submit Report',     desc:'Send your monthly report to the admin',        icon:'📤',  href:'/teacher/reports',     group:'Actions', tags:['submit','send','report','admin'] },
  { label:'View My Subjects',  desc:'See subjects and enrolled students',           icon:'👁',  href:'/teacher/subjects',    group:'Actions', tags:['view','subjects','enrolled','students'] },
]

const STUDENT_ITEMS: Item[] = [
  { label:'Dashboard',         desc:'Your learning overview',                       icon:'⛩',  href:'/student',             group:'Pages',   tags:['home','dashboard','overview','main'] },
  { label:'Subjects',          desc:'Browse your enrolled subjects',                icon:'📚',  href:'/student/subjects',    group:'Pages',   tags:['subjects','class','enrolled','courses'] },
  { label:'Projects',          desc:'View and submit your project assignments',     icon:'📋',  href:'/student/projects',    group:'Pages',   tags:['projects','assignment','submit','submission','work'] },
  { label:'Announcements',     desc:'Read announcements and notifications',         icon:'📢',  href:'/student/announcements',group:'Pages',  tags:['announcements','notice','notification','bell'] },
  { label:'Profile',           desc:'Edit your student profile',                    icon:'⚙️',  href:'/student/profile',     group:'Pages',   tags:['profile','settings','account','password'] },
  // Actions
  { label:'Submit Assignment', desc:'Upload or write your project submission',      icon:'📤',  href:'/student/projects',    group:'Actions', tags:['submit','upload','assignment','project','work'] },
  { label:'Check Grades',      desc:'See your scores and teacher feedback',         icon:'🏆',  href:'/student/projects',    group:'Actions', tags:['grade','score','marks','result','feedback'] },
  { label:'View Deadlines',    desc:'Check upcoming project deadlines',             icon:'⏰',  href:'/student/projects',    group:'Actions', tags:['deadline','due','upcoming','schedule'] },
  { label:'Read Announcements',desc:'Latest notices from your teachers',            icon:'📬',  href:'/student/announcements',group:'Actions',tags:['read','announcements','notice','latest'] },
  { label:'View Materials',    desc:'Access learning resources shared by teachers', icon:'📎',  href:'/student/subjects',    group:'Actions', tags:['material','resource','file','pdf','download'] },
]

const ROLE_ITEMS: Record<string, Item[]> = {
  admin:   ADMIN_ITEMS,
  teacher: TEACHER_ITEMS,
  student: STUDENT_ITEMS,
}

// ── Fuzzy-ish search ───────────────────────────────────────────────────────

function searchItems(items: Item[], query: string): Item[] {
  if (!query.trim()) return items.slice(0, 8)
  const q = query.toLowerCase().trim()
  const scored = items.map(item => {
    let score = 0
    if (item.label.toLowerCase().startsWith(q)) score += 10
    if (item.label.toLowerCase().includes(q))   score += 6
    if (item.desc.toLowerCase().includes(q))    score += 3
    if (item.tags.some(t => t.includes(q) || q.includes(t))) score += 4
    return { item, score }
  })
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item)
    .slice(0, 8)
}

// ── Highlight matching text ────────────────────────────────────────────────

function Hl({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[rgba(212,168,67,0.25)] text-[#d4a843] rounded-sm not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ── Accent colours per role ────────────────────────────────────────────────
const ROLE_STYLE = {
  admin:   { accent: '#d4a843', bg: '#2c1810', border: 'rgba(212,168,67,0.2)',  hover: 'rgba(212,168,67,0.08)' },
  teacher: { accent: '#1a7a6e', bg: '#0f2922', border: 'rgba(26,122,110,0.25)', hover: 'rgba(26,122,110,0.1)' },
  student: { accent: '#3b82f6', bg: '#0f172a', border: 'rgba(59,130,246,0.25)', hover: 'rgba(59,130,246,0.1)' },
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props { role: 'admin' | 'teacher' | 'student' }

export default function DashboardSearch({ role }: Props) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [sel,     setSel]     = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const items   = ROLE_ITEMS[role] ?? ADMIN_ITEMS
  const style   = ROLE_STYLE[role] ?? ROLE_STYLE.admin
  const results = searchItems(items, query)

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSel(0)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    itemRefs.current[sel]?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  function pick(item: Item) {
    setOpen(false)
    setQuery('')
    router.push(item.href)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[sel]) pick(results[sel])
    if (e.key === 'Escape') setOpen(false)
  }

  // Group results
  const groups = results.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  let globalIdx = 0

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-sm border text-xs font-mono transition-all hover:opacity-80"
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderColor: style.border,
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <span style={{ color: style.accent }}>🔍</span>
        <span className="hidden sm:inline">Search...</span>
        <span className="hidden sm:flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px]"
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${style.border}`, color: style.accent }}>
          ⌘K
        </span>
      </button>

      {/* ── Modal overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-xl rounded-sm overflow-hidden"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${style.border}`,
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b"
              style={{ borderColor: style.border }}>
              <span style={{ color: style.accent, fontSize: 16 }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSel(0) }}
                onKeyDown={onKey}
                placeholder={`Search pages, actions…`}
                className="flex-1 bg-transparent outline-none text-sm dashboard-search-input"
                style={{ color: '#f4f4f4', fontFamily: 'ui-monospace, monospace', letterSpacing: '.3px' }}
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="text-base leading-none opacity-40 hover:opacity-70 transition-opacity"
                  style={{ color: '#faf6ee' }}>✕</button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] rounded font-mono opacity-40"
                style={{ border: `1px solid ${style.border}`, color: '#faf6ee' }}>esc</kbd>
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
              {results.length === 0 && query ? (
                <div className="px-5 py-10 text-center">
                  <div className="text-3xl mb-2">🔎</div>
                  <p className="text-xs font-mono opacity-40" style={{ color: '#faf6ee' }}>
                    No results for "{query}"
                  </p>
                </div>
              ) : (
                Object.entries(groups).map(([groupName, groupItems]) => (
                  <div key={groupName}>
                    {/* Group label */}
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-40"
                        style={{ color: style.accent }}>{groupName}</span>
                    </div>

                    {groupItems.map((item) => {
                      const idx = globalIdx++
                      const isSelected = idx === sel
                      return (
                        <button
                          key={item.label}
                          ref={el => { itemRefs.current[idx] = el }}
                          onClick={() => pick(item)}
                          onMouseEnter={() => setSel(idx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{
                            background: isSelected ? style.hover : 'transparent',
                            borderLeft: isSelected ? `2px solid ${style.accent}` : '2px solid transparent',
                          }}
                        >
                          <span className="text-lg w-7 text-center flex-shrink-0">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold leading-snug" style={{ color: isSelected ? style.accent : '#faf6ee', fontFamily: 'Georgia, serif' }}>
                              <Hl text={item.label} query={query} />
                            </div>
                            <div className="text-xs mt-0.5 truncate opacity-50" style={{ color: '#faf6ee', fontFamily: 'monospace' }}>
                              <Hl text={item.desc} query={query} />
                            </div>
                          </div>
                          <span className="text-[10px] font-mono opacity-30 flex-shrink-0"
                            style={{ color: style.accent }}>{item.href}</span>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t flex items-center gap-4"
              style={{ borderColor: style.border, background: 'rgba(0,0,0,0.2)' }}>
              {[['↑↓','navigate'],['↵','open'],['esc','close']].map(([k, l]) => (
                <span key={k} className="text-[10px] font-mono flex items-center gap-1.5 opacity-40" style={{ color: '#faf6ee' }}>
                  <kbd className="px-1 py-0.5 rounded text-[9px]"
                    style={{ border: `1px solid rgba(255,255,255,0.15)`, color: style.accent }}>{k}</kbd>
                  {l}
                </span>
              ))}
              <span className="ml-auto text-[10px] font-mono opacity-25" style={{ color: '#faf6ee' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}