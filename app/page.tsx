'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, on }
}

function Rise({ children, d = 0, y = 40, style: s = {} }: {
  children: React.ReactNode; d?: number; y?: number; style?: React.CSSProperties
}) {
  const { ref, on } = useReveal()
  return (
    <div ref={ref} style={{
      opacity: on ? 1 : 0,
      transform: on ? 'none' : `translateY(${y}px)`,
      transition: `opacity .85s cubic-bezier(.22,1,.36,1) ${d}s, transform .85s cubic-bezier(.22,1,.36,1) ${d}s`,
      ...s,
    }}>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════
   BOOK SPINES  (pure CSS art)
═══════════════════════════════════════════ */
const BOOKS = [
  { w:22, h:158, c:'#7a1f1f', t:'Mathematics',  d:.00 },
  { w:17, h:172, c:'#1c3d6a', t:'Science',       d:.14 },
  { w:25, h:144, c:'#1d5133', t:'History',        d:.05 },
  { w:15, h:168, c:'#59320e', t:'Literature',     d:.20 },
  { w:23, h:150, c:'#3c1e5c', t:'Geography',      d:.09 },
  { w:19, h:162, c:'#194840', t:'Physics',        d:.24 },
  { w:27, h:138, c:'#6a2f0e', t:'Chemistry',      d:.07 },
  { w:17, h:166, c:'#491828', t:'Biology',        d:.17 },
  { w:21, h:156, c:'#1b2c55', t:'English',        d:.12 },
  { w:15, h:146, c:'#3e280a', t:'Computing',      d:.22 },
  { w:20, h:160, c:'#193650', t:'Music',          d:.06 },
  { w:24, h:142, c:'#29184c', t:'Art',            d:.16 },
]

function Spine({ w, h, c, t, d }: typeof BOOKS[0]) {
  return (
    <div style={{
      width: w, height: h, flexShrink: 0, position: 'relative',
      background: `linear-gradient(120deg, ${c} 0%, ${c}bb 55%, ${c}77 100%)`,
      borderRadius: '2px 1px 1px 2px',
      boxShadow: `inset -4px 0 8px rgba(0,0,0,.45), 3px 0 10px rgba(0,0,0,.6)`,
      animation: `bob 3.8s ease-in-out ${d}s infinite alternate`,
      userSelect: 'none',
    }}>
      {/* Spine gloss */}
      <div style={{ position:'absolute', top:0, left:2, width:4, bottom:0, background:'linear-gradient(180deg,rgba(255,255,255,.18),transparent)', borderRadius:1 }} />
      {/* Top edge */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:5, background:'rgba(255,255,255,.1)', borderRadius:'2px 1px 0 0' }} />
      {/* Title */}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ writingMode:'vertical-rl', fontSize:7, fontFamily:'Georgia,serif', fontWeight:600, color:'rgba(255,255,255,.45)', letterSpacing:'.12em', overflow:'hidden', maxHeight:h-18 }}>{t}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   DUST MOTE
═══════════════════════════════════════════ */
function Mote({ top, left, dur, del, sz=2.5 }: { top:string; left:string; dur:number; del:number; sz?:number }) {
  return (
    <div style={{
      position:'absolute', top, left, width:sz, height:sz, borderRadius:'50%',
      background:'rgba(212,168,67,.55)',
      animation:`mote ${dur}s ease-in-out ${del}s infinite alternate`,
      pointerEvents:'none',
    }} />
  )
}

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const ROLES = [
  {
    icon:'⛩',  role:'Administrator', jp:'管理者',
    accent:'#c0392b', glow:'rgba(192,57,43,.14)', border:'rgba(192,57,43,.3)',
    href:'/login',
    desc:'Full oversight of the school. Register users, approve projects, assign subjects, and monitor every corner of the platform.',
    perks:['User Registration','Project Approval','Subject Control','Platform Overview'],
  },
  {
    icon:'📖', role:'Teacher', jp:'先生',
    accent:'#16a085', glow:'rgba(22,160,133,.14)', border:'rgba(22,160,133,.3)',
    href:'/login',
    desc:'Upload materials, assign projects, track student progress in real time, and post targeted announcements to your classes.',
    perks:['Upload Materials','Manage Projects','Student Progress','Announcements'],
  },
  {
    icon:'🎓', role:'Student', jp:'学生',
    accent:'#3a86d4', glow:'rgba(58,134,212,.14)', border:'rgba(58,134,212,.3)',
    href:'/login',
    desc:'Browse your subjects, download learning materials, submit work as a draft or final, and see how classmates are progressing.',
    perks:['Submit Projects','Draft Mode','Download Materials','Classmate Progress'],
  },
]

const FEATS = [
  { icon:'📊', t:'Role-Based Dashboards',  b:'Every login reveals a personalised view — unique stats, shortcuts, and alerts built for that specific role.' },
  { icon:'⚠️', t:'5-Day Deadline Alerts',  b:'Automatic warnings fire for teachers and students when a deadline is dangerously near and no submission exists.' },
  { icon:'✏️', t:'Draft Mode',             b:'Students privately save progress before making an official submission. No pressure, full creative control.' },
  { icon:'📈', t:'Progress Bars',          b:'Submission rates per student, per subject, in one glance. Know the health of your class instantly.' },
  { icon:'📢', t:'Announcements',          b:'Global or subject-scoped posts with read-tracking, pinning, and bold unread badge counters.' },
  { icon:'🔐', t:'Secure Auth',            b:'JWT sessions with role enforcement on every route — zero cross-role data leaks, ever.' },
]

/* ═══════════════════════════════════════════
   PAGE
═══════════════════════════════════════════ */
export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    setMounted(true)
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive:true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const solid = scrollY > 48

  const HERO_MOTES = [
    {top:'16%',left:'8%', dur:6, del:0   },
    {top:'36%',left:'88%',dur:8, del:1.4 },
    {top:'64%',left:'4%', dur:5, del:2.7 },
    {top:'22%',left:'54%',dur:7, del:.7  },
    {top:'78%',left:'80%',dur:9, del:1.1 },
    {top:'52%',left:'42%',dur:6, del:3.4 },
    {top:'11%',left:'76%',dur:8, del:.4  },
    {top:'87%',left:'27%',dur:6, del:2.0 },
  ]

  return (
    <>
      {/* ─── GLOBAL CSS ────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;600;700;900&family=Share+Tech+Mono&family=Lato:wght@300;400;700&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{
          font-family:'Lato',sans-serif;
          background:#0f0904;
          color:#faf6ee;
          overflow-x:hidden;
        }

        /* Book bounce */
        @keyframes bob {
          from{transform:translateY(0)}
          to  {transform:translateY(-11px)}
        }

        /* Dust float */
        @keyframes mote {
          0%  {opacity:0;transform:translate(0,0) scale(1)}
          30% {opacity:.85}
          100%{opacity:0;transform:translate(13px,-42px) scale(.3)}
        }

        /* Hero staggered fade-up */
        @keyframes up {
          from{opacity:0;transform:translateY(26px)}
          to  {opacity:1;transform:translateY(0)}
        }

        /* Ink draw */
        @keyframes ink {
          from{stroke-dashoffset:700}
          to  {stroke-dashoffset:0}
        }

        /* Stamp */
        @keyframes stamp {
          0%  {opacity:0;transform:scale(1.6) rotate(-14deg)}
          65% {transform:scale(.95) rotate(2deg)}
          100%{opacity:1;transform:scale(1) rotate(-6deg)}
        }

        /* Shimmer pulse */
        @keyframes pulse {
          0%,100%{opacity:.38}
          50%    {opacity:.9}
        }

        /* Grow line */
        @keyframes grow {
          from{transform:scaleX(0)}
          to  {transform:scaleX(1)}
        }

        .a1{animation:up .9s .1s cubic-bezier(.22,1,.36,1) both}
        .a2{animation:up .9s .3s cubic-bezier(.22,1,.36,1) both}
        .a3{animation:up .9s .52s cubic-bezier(.22,1,.36,1) both}
        .a4{animation:up .9s .72s cubic-bezier(.22,1,.36,1) both}
        .a5{animation:up 1.1s 1.0s cubic-bezier(.22,1,.36,1) both}

        .ink-path{
          stroke-dasharray:700;
          stroke-dashoffset:700;
          animation:ink 2s 1.1s ease forwards;
        }
        .ink-path2{
          stroke-dasharray:700;
          stroke-dashoffset:700;
          animation:ink 2s 1.5s ease forwards;
        }
        .ink-path3{
          stroke-dasharray:700;
          stroke-dashoffset:700;
          animation:ink 2s 1.8s ease forwards;
        }

        .stamp-el{animation:stamp .6s 2s cubic-bezier(.3,.7,.4,1.5) both}

        /* Nav underline hover */
        .nl{
          position:relative;
          color:rgba(250,246,238,.46);
          text-decoration:none;
          font-size:.75rem;
          letter-spacing:.07em;
          font-family:'Share Tech Mono',monospace;
          transition:color .2s;
        }
        .nl::after{
          content:'';
          position:absolute;bottom:-3px;left:0;right:0;
          height:1px;background:#d4a843;
          transform:scaleX(0);transform-origin:left;
          transition:transform .22s;
        }
        .nl:hover{color:#d4a843}
        .nl:hover::after{transform:scaleX(1)}

        /* Paper lines */
        .ruled{
          background-image:repeating-linear-gradient(
            0deg,transparent,transparent 27px,
            rgba(200,184,154,.2) 28px
          );
        }

        /* Red margin rule */
        .margin-line::before{
          content:'';
          position:absolute;top:0;bottom:0;
          left:clamp(2.5rem,7vw,5.5rem);
          width:1px;
          background:rgba(192,57,43,.13);
        }

        /* Scrollbar */
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#0a0602}
        ::-webkit-scrollbar-thumb{background:rgba(212,168,67,.22);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(212,168,67,.5)}

        /* Responsive nav
           NOTE: hamburger button hides via .mobile-menu-btn — no inline display allowed on the element */
        .desktop-nav    { display: flex  !important; }
        .mobile-menu-btn{ display: none  !important; }
        .mobile-menu    { display: none  !important; }

        @media (max-width: 768px) {
          .desktop-nav    { display: none  !important; }
          .mobile-menu-btn{ display: flex  !important; }
          .mobile-menu    { display: block !important; }
        }
      `}</style>

      {/* ─── NAVBAR ──────────────────────────────────── */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:62, padding:'0 clamp(1.2rem,4vw,3rem)',
        display:'flex', alignItems:'center',
        background: solid || menuOpen ? 'rgba(10,6,2,.97)' : 'transparent',
        backdropFilter: solid || menuOpen ? 'blur(18px)' : 'none',
        borderBottom: solid || menuOpen ? '1px solid rgba(212,168,67,.1)' : '1px solid transparent',
        transition:'background .4s, border-color .4s',
      }}>

        {/* ── Logo ── */}
        <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {/* Logo image placeholder — replace src with your actual logo */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {/* LOGO PLACEHOLDER — swap the <svg> below with <img src="/logo.png" /> */}
            <Image src="/Image_Logo.png" alt="Logo" width={70} height={70} style={{ objectFit:'cover' }} />
          </div>
          <div style={{ fontFamily:'Noto Serif JP,serif', fontWeight:900, fontSize:'1.12rem', color:'#faf6ee', display:'flex', alignItems:'center', gap:6 }}>
            <Image src="/Text_Logo.png" alt="StudySync Text" width={120} height={30} style={{ objectFit:'cover' }} />
            <span style={{ fontFamily:'Share Tech Mono', fontSize:'.44rem', color:'rgba(212,168,67,.32)', border:'1px solid rgba(212,168,67,.16)', padding:'1px 4px' }}>LMS</span>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'2rem' }}
          className="desktop-nav">
          <a href="#features" className="nl">Features</a>
          <a href="#roles"    className="nl">Roles</a>
          <a href="#stack"    className="nl">Stack</a>
          <Link href="/login" style={{
            background:'linear-gradient(135deg,#d4a843,#b8882a)',
            color:'#1a1209', fontWeight:700, fontSize:'.68rem',
            letterSpacing:'.14em', textTransform:'uppercase',
            fontFamily:'Share Tech Mono',
            padding:'.46rem 1.3rem', borderRadius:2,
            boxShadow:'0 2px 18px rgba(212,168,67,.22)',
            textDecoration:'none', whiteSpace:'nowrap',
            transition:'transform .2s, box-shadow .2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 28px rgba(212,168,67,.35)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 18px rgba(212,168,67,.22)'}}
          >Sign In →</Link>
        </nav>

        {/* ── Mobile hamburger button — hidden on desktop, shown on mobile via CSS class ── */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
          style={{
            marginLeft:'auto', background:'none', border:'none', cursor:'pointer',
            padding:'8px', flexDirection:'column', gap:5,
            alignItems:'center', justifyContent:'center',
          }}
        >
          <span style={{
            display:'block', width:22, height:2, background: menuOpen ? '#d4a843' : 'rgba(250,246,238,.7)',
            borderRadius:2, transition:'all .3s',
            transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
          }} />
          <span style={{
            display:'block', width:22, height:2, background:'rgba(250,246,238,.7)',
            borderRadius:2, transition:'all .3s',
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display:'block', width:22, height:2, background: menuOpen ? '#d4a843' : 'rgba(250,246,238,.7)',
            borderRadius:2, transition:'all .3s',
            transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
          }} />
        </button>
      </header>

      {/* ── Mobile dropdown menu ── */}
      <div style={{
        position:'fixed', top:62, left:0, right:0, zIndex:99,
        background:'rgba(10,6,2,.97)',
        backdropFilter:'blur(18px)',
        borderBottom:'1px solid rgba(212,168,67,.12)',
        overflow:'hidden',
        maxHeight: menuOpen ? '280px' : '0px',
        transition:'max-height .4s cubic-bezier(.22,1,.36,1)',
      }}
        className="mobile-menu">
        <nav style={{ padding:'1rem clamp(1.2rem,4vw,3rem) 1.5rem', display:'flex', flexDirection:'column', gap:4 }}>
          {[
            { href:'#features', label:'Features' },
            { href:'#roles',    label:'Roles' },
            { href:'#stack',    label:'Stack' },
          ].map(item => (
            <a key={item.href} href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color:'rgba(250,246,238,.55)', textDecoration:'none',
                fontFamily:'Share Tech Mono,monospace', fontSize:'.8rem',
                letterSpacing:'.12em', textTransform:'uppercase',
                padding:'.75rem 0',
                borderBottom:'1px solid rgba(212,168,67,.07)',
                transition:'color .2s',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}
              onMouseEnter={e=>{e.currentTarget.style.color='#d4a843'}}
              onMouseLeave={e=>{e.currentTarget.style.color='rgba(250,246,238,.55)'}}
            >
              {item.label}
              <span style={{ color:'rgba(212,168,67,.3)', fontSize:'.7rem' }}>→</span>
            </a>
          ))}
          <Link href="/login"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop:'.75rem',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:'linear-gradient(135deg,#d4a843,#b8882a)',
              color:'#1a1209', fontWeight:700, fontSize:'.72rem',
              letterSpacing:'.14em', textTransform:'uppercase',
              fontFamily:'Share Tech Mono',
              padding:'.8rem', borderRadius:2,
              boxShadow:'0 2px 18px rgba(212,168,67,.22)',
              textDecoration:'none',
            }}
          >📖 Sign In → Enter the Library</Link>
        </nav>
      </div>

      {/* ─── HERO ─────────────────────────────────────── */}
      <section style={{
        minHeight:'100vh',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'110px clamp(1.5rem,5vw,3rem) 60px',
        position:'relative', overflow:'hidden',
        background:`
          radial-gradient(ellipse 80% 65% at 50% 28%, rgba(36,18,7,.97) 0%,transparent 70%),
          radial-gradient(ellipse 100% 50% at 50% 100%, rgba(10,6,2,1) 0%,transparent 55%),
          linear-gradient(162deg,#1c1108 0%,#201408 38%,#111b27 100%)
        `,
      }}>
        {/* Paper lines */}
        <div className="ruled" style={{ position:'absolute', inset:0, pointerEvents:'none' }} />

        {/* Decorative ink SVG — top right */}
        <svg viewBox="0 0 280 280" style={{ position:'absolute', top:'6%', right:'3%', width:260, opacity:.09, pointerEvents:'none' }}>
          <circle cx="140" cy="140" r="118" fill="none" stroke="#d4a843" strokeWidth="1.3" strokeDasharray="8 6" className="ink-path" />
          <circle cx="140" cy="140" r="84"  fill="none" stroke="#d4a843" strokeWidth=".7"  strokeDasharray="4 9" className="ink-path2" />
          <line x1="36"  y1="140" x2="244" y2="140" stroke="#d4a843" strokeWidth=".6" opacity=".5" className="ink-path3" />
          <line x1="140" y1="36"  x2="140" y2="244" stroke="#d4a843" strokeWidth=".6" opacity=".5" className="ink-path3" />
        </svg>

        {/* Small ink circle — bottom left */}
        <svg viewBox="0 0 160 160" style={{ position:'absolute', bottom:'15%', left:'-1%', width:150, opacity:.07, pointerEvents:'none' }}>
          <circle cx="80" cy="80" r="66" fill="none" stroke="#d4a843" strokeWidth="1" strokeDasharray="5 8" className="ink-path2" />
        </svg>

        {/* Dust motes */}
        {mounted && HERO_MOTES.map((m,i) => <Mote key={i} {...m} />)}

        {/* Approval stamp */}
        <div className="stamp-el" style={{
          position:'absolute', top:'19%', left:'5.5%',
          border:'2px solid rgba(192,57,43,.42)',
          color:'rgba(192,57,43,.42)',
          fontFamily:'Noto Serif JP,serif',
          padding:'.5rem .9rem', transform:'rotate(-7deg)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:3,
          pointerEvents:'none',
        }}>
          <span style={{ fontSize:'1.4rem', lineHeight:1 }}>承認</span>
          <span style={{ fontSize:'.46rem', letterSpacing:'.32em', fontFamily:'Share Tech Mono' }}>APPROVED 2026</span>
        </div>

        {/* ── HERO TEXT ── */}
        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:840 }}>

          <p className="a1" style={{
            fontFamily:'Share Tech Mono', fontSize:'.6rem',
            letterSpacing:'.46em', color:'rgba(212,168,67,.5)',
            textTransform:'uppercase', marginBottom:'1.9rem',
          }}>スタディシンク · Secondary School Learning Platform</p>

          {/* Giant logotype */}
          <h1 className="a2" style={{
            fontFamily:'Noto Serif JP,Georgia,serif', fontWeight:900,
            fontSize:'clamp(3.8rem,13vw,9.5rem)',
            lineHeight:.87, letterSpacing:'-.025em',
            marginBottom:'1.6rem',
          }}>
            <span style={{ color:'#faf6ee', display:'block' }}>Study</span>
            <span style={{ display:'block', color:'transparent', WebkitTextStroke:'2px #d4a843', textShadow:'0 0 100px rgba(212,168,67,.12)' }}>Sync</span>
          </h1>

          {/* Ornamental rule */}
          <div className="a2" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:'1.9rem' }}>
            <div style={{ width:90, height:1, background:'rgba(212,168,67,.28)', transformOrigin:'right', animation:'grow 1.2s 1.1s ease both' }} />
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ opacity:.55, flexShrink:0 }}>
              <circle cx="9" cy="9" r="2.8" fill="#d4a843" />
              <circle cx="9" cy="9" r="6"   fill="none" stroke="#d4a843" strokeWidth=".8" />
              <circle cx="9" cy="9" r="8.5" fill="none" stroke="#d4a843" strokeWidth=".4" strokeDasharray="2 3" />
            </svg>
            <div style={{ width:90, height:1, background:'rgba(212,168,67,.28)', transformOrigin:'left', animation:'grow 1.2s 1.1s ease both' }} />
          </div>

          <p className="a3" style={{
            color:'rgba(250,246,238,.5)',
            fontSize:'clamp(.9rem,2vw,1.07rem)',
            lineHeight:1.9, maxWidth:570, margin:'0 auto 2.8rem',
            fontWeight:300,
          }}>
            A unified school management platform for{' '}
            <span style={{ color:'#e05040', fontWeight:700 }}>administrators</span>,{' '}
            <span style={{ color:'#1ec4b0', fontWeight:700 }}>teachers</span> and{' '}
            <span style={{ color:'#5aabf0', fontWeight:700 }}>students</span>{' '}
            — one login routes you directly to your personalised dashboard.
          </p>

          {/* CTAs */}
          <div className="a4" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            {/* Primary */}
            <Link href="/login" style={{
              display:'inline-flex', alignItems:'center', gap:10,
              background:'linear-gradient(140deg,#d4a843 0%,#c09030 55%,#a87c28 100%)',
              color:'#1a1209', fontWeight:800, fontSize:'.9rem',
              letterSpacing:'.1em', textTransform:'uppercase',
              fontFamily:'Noto Serif JP,serif',
              padding:'1rem 3rem', borderRadius:2, textDecoration:'none',
              boxShadow:'4px 4px 0 rgba(212,168,67,.2), 0 12px 44px rgba(212,168,67,.16)',
              transition:'all .25s cubic-bezier(.22,1,.36,1)',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translate(-3px,-3px)';e.currentTarget.style.boxShadow='8px 8px 0 rgba(212,168,67,.24), 0 22px 55px rgba(212,168,67,.2)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='4px 4px 0 rgba(212,168,67,.2), 0 12px 44px rgba(212,168,67,.16)'}}
            >📖 Enter the Library</Link>

            {/* Secondary */}
            <a href="#roles" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              border:'1px solid rgba(212,168,67,.3)',
              color:'rgba(250,246,238,.56)', fontWeight:400, fontSize:'.86rem',
              letterSpacing:'.05em', padding:'1rem 2rem', borderRadius:2,
              textDecoration:'none', transition:'all .2s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(212,168,67,.65)';e.currentTarget.style.color='#d4a843'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(212,168,67,.3)';e.currentTarget.style.color='rgba(250,246,238,.56)'}}
            >Explore Roles ↓</a>
          </div>
        </div>

        {/* ── BOOKSHELF ── */}
        <div className="a5" style={{ position:'relative', zIndex:1, marginTop:72, width:'100%', maxWidth:490 }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:3, paddingBottom:13, position:'relative' }}>
            {BOOKS.map((b,i) => <Spine key={i} {...b} />)}
            {/* Plank */}
            <div style={{
              position:'absolute', bottom:0, left:-30, right:-30, height:14,
              background:'linear-gradient(180deg,#4c3018 0%,#2c1a09 45%,#170d04 100%)',
              boxShadow:'0 5px 20px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06)',
              borderRadius:1,
            }} />
          </div>
          {/* Ground shadow */}
          <div style={{ height:8, margin:'0 12px', background:'radial-gradient(ellipse at 50% 0%,rgba(0,0,0,.6) 0%,transparent 80%)' }} />
        </div>

        {/* Scroll cue */}
        <div style={{
          position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:7,
          animation:'pulse 2s infinite',
        }}>
          <span style={{ fontFamily:'Share Tech Mono', fontSize:'.5rem', letterSpacing:'.38em', color:'rgba(212,168,67,.3)' }}>SCROLL</span>
          <div style={{ width:1, height:38, background:'linear-gradient(180deg,rgba(212,168,67,.38),transparent)' }} />
        </div>
      </section>

      {/* ─── STATS BAND ───────────────────────────────── */}
      <section style={{
        background:'linear-gradient(135deg,#d4a843,#be943a 50%,#a87e2e)',
        padding:'2.8rem clamp(1.5rem,5vw,3.5rem)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Crosshatch texture */}
        <div style={{ position:'absolute', inset:0, opacity:.055, backgroundImage:'repeating-linear-gradient(45deg,#1a1209 0,#1a1209 1px,transparent 0,transparent 50%)', backgroundSize:'10px 10px' }} />
        <div style={{ maxWidth:900, margin:'0 auto', position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.5rem' }}>
          {[
            { v:'3',    l:'User Roles',   jp:'役割'     },
            { v:'6',    l:'Core Modules', jp:'モジュール' },
            { v:'∞',   l:'Subjects',      jp:'科目'     },
            { v:'100%', l:'Web-Based',    jp:'ウェブ'   },
          ].map((s,i) => (
            <Rise key={i} d={i*.09}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Noto Serif JP,serif', fontWeight:900, fontSize:'clamp(2rem,5vw,2.8rem)', color:'#1a1209', lineHeight:1 }}>{s.v}</div>
                <div style={{ fontWeight:700, fontSize:'.7rem', color:'rgba(26,18,9,.62)', letterSpacing:'.1em', marginTop:4 }}>{s.l}</div>
                <div style={{ fontFamily:'Share Tech Mono', fontSize:'.55rem', color:'rgba(26,18,9,.36)', letterSpacing:'.22em' }}>{s.jp}</div>
              </div>
            </Rise>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────── */}
      <section id="features" style={{ background:'#faf6ee', padding:'7rem clamp(1.5rem,5vw,3.5rem)', position:'relative', overflow:'hidden' }}>
        <div className="ruled margin-line" style={{ position:'absolute', inset:0, pointerEvents:'none' }} />

        <div style={{ maxWidth:1060, margin:'0 auto', position:'relative', zIndex:1 }}>
          <Rise style={{ textAlign:'center', marginBottom:'5rem' }}>
            <span style={{ fontFamily:'Share Tech Mono', fontSize:'.58rem', letterSpacing:'.42em', color:'#c0392b', textTransform:'uppercase' }}>機能一覧</span>
            <h2 style={{ fontFamily:'Noto Serif JP,serif', fontWeight:900, fontSize:'clamp(2rem,5vw,3.2rem)', color:'#1a1209', marginTop:'.55rem', lineHeight:1.15 }}>
              Everything your school needs,<br /><span style={{ color:'#c0392b' }}>in one place.</span>
            </h2>
          </Rise>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(295px,1fr))', gap:'1.2rem' }}>
            {FEATS.map((f,i) => (
              <Rise key={i} d={i*.07}>
                <div style={{
                  background:'#fff', border:'1px solid #c8b89a', borderRadius:2,
                  padding:'1.7rem', boxShadow:'3px 3px 0 #c8b89a', height:'100%',
                  transition:'transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s',
                }}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='translate(-3px,-3px)';el.style.boxShadow='6px 6px 0 #c8b89a'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='';el.style.boxShadow='3px 3px 0 #c8b89a'}}
                >
                  <div style={{ fontSize:'1.8rem', marginBottom:'.9rem', lineHeight:1 }}>{f.icon}</div>
                  <div style={{ fontFamily:'Noto Serif JP,serif', fontWeight:700, fontSize:'.97rem', color:'#1a1209', marginBottom:'.5rem' }}>{f.t}</div>
                  <p style={{ fontSize:'.81rem', color:'#7a6a52', lineHeight:1.8 }}>{f.b}</p>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ────────────────────────────────────── */}
      <section id="roles" style={{
        background:'linear-gradient(162deg,#190f07 0%,#0c1520 100%)',
        padding:'7rem clamp(1.5rem,5vw,3.5rem)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Grid overlay */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(212,168,67,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,67,.03) 1px,transparent 1px)', backgroundSize:'58px 58px' }} />

        <div style={{ maxWidth:1120, margin:'0 auto', position:'relative', zIndex:1 }}>
          <Rise style={{ textAlign:'center', marginBottom:'5rem' }}>
            <span style={{ fontFamily:'Share Tech Mono', fontSize:'.58rem', letterSpacing:'.42em', color:'rgba(212,168,67,.5)', textTransform:'uppercase' }}>ユーザーロール</span>
            <h2 style={{ fontFamily:'Noto Serif JP,serif', fontWeight:900, fontSize:'clamp(2rem,5vw,3.2rem)', color:'#faf6ee', marginTop:'.55rem', lineHeight:1.15 }}>
              Three roles.<br /><span style={{ color:'#d4a843' }}>One system.</span>
            </h2>
          </Rise>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(298px,1fr))', gap:'1.5rem' }}>
            {ROLES.map((r,i) => (
              <Rise key={i} d={i*.14} style={{ display:'flex' }}>
                <div style={{
                  position:'relative', overflow:'hidden',
                  background:'rgba(255,255,255,.02)',
                  border:`1px solid ${r.border}`,
                  borderRadius:2, padding:'2rem',
                  boxShadow:`3px 3px 0 rgba(0,0,0,.42), 0 0 50px ${r.glow}`,
                  transition:'transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s',
                  display:'flex', flexDirection:'column', width:'100%',
                }}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='translateY(-7px)';el.style.boxShadow=`5px 10px 0 rgba(0,0,0,.5), 0 0 70px ${r.glow}`}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='';el.style.boxShadow=`3px 3px 0 rgba(0,0,0,.42), 0 0 50px ${r.glow}`}}
                >
                  {/* Accent top bar */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:r.accent }} />

                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.4rem' }}>
                    <div style={{
                      width:56, height:56, flexShrink:0, borderRadius:2,
                      background:r.glow, border:`1px solid ${r.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.65rem',
                    }}>{r.icon}</div>
                    <div>
                      <div style={{ fontFamily:'Noto Serif JP,serif', fontWeight:700, fontSize:'1.1rem', color:'#faf6ee' }}>{r.role}</div>
                      <div style={{ fontFamily:'Share Tech Mono', fontSize:'.6rem', color:r.accent, letterSpacing:'.24em', marginTop:2 }}>{r.jp}</div>
                    </div>
                  </div>

                  <p style={{ fontSize:'.81rem', color:'rgba(250,246,238,.5)', lineHeight:1.84, marginBottom:'1.4rem' }}>{r.desc}</p>

                  {/* Perk tags */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:'1.8rem' }}>
                    {r.perks.map(p => (
                      <span key={p} style={{
                        fontFamily:'Share Tech Mono', fontSize:'.56rem', letterSpacing:'.05em',
                        padding:'.22rem .68rem', borderRadius:1,
                        border:`1px solid ${r.border}`, color:r.accent, background:r.glow,
                      }}>{p}</span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link href={r.href} style={{
                    display:'block', marginTop:'auto', textAlign:'center',
                    padding:'.72rem', borderRadius:2,
                    border:`1px solid ${r.border}`, color:r.accent,
                    fontSize:'.7rem', fontWeight:700, letterSpacing:'.14em',
                    textTransform:'uppercase', fontFamily:'Share Tech Mono',
                    textDecoration:'none',
                    transition:'background .2s, transform .18s',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background=r.glow;e.currentTarget.style.transform='scale(1.02)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.transform=''}}
                  >
                    Sign in as {r.role} →
                  </Link>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STACK ────────────────────────────────────── */}
      <section id="stack" style={{ background:'#f0e9d6', padding:'7rem clamp(1.5rem,5vw,3.5rem)', position:'relative', overflow:'hidden' }}>
        <div className="ruled margin-line" style={{ position:'absolute', inset:0, pointerEvents:'none' }} />

        <div style={{ maxWidth:1020, margin:'0 auto', position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5rem', alignItems:'center' }}>

            <Rise>
              <span style={{ fontFamily:'Share Tech Mono', fontSize:'.58rem', letterSpacing:'.42em', color:'#c0392b', textTransform:'uppercase' }}>技術スタック</span>
              <h2 style={{ fontFamily:'Noto Serif JP,serif', fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#1a1209', marginTop:'.55rem', marginBottom:'1.2rem', lineHeight:1.2 }}>
                Built for speed,<br /><span style={{ color:'#c0392b' }}>built to last.</span>
              </h2>
              <p style={{ color:'#7a6a52', fontSize:'.87rem', lineHeight:1.9, marginBottom:'2rem', fontWeight:300 }}>
                StudySync runs on a production-grade modern stack. No installation needed — just a browser. Fast, secure, and deployed globally on edge infrastructure.
              </p>
              <Link href="/login" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'#1a1209', color:'#d4a843',
                fontWeight:700, fontSize:'.75rem', letterSpacing:'.14em',
                textTransform:'uppercase', fontFamily:'Share Tech Mono',
                padding:'.9rem 2.2rem', borderRadius:2, textDecoration:'none',
                border:'1px solid rgba(212,168,67,.28)',
                boxShadow:'4px 4px 0 rgba(26,18,9,.16)',
                transition:'all .25s cubic-bezier(.22,1,.36,1)',
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translate(-3px,-3px)';e.currentTarget.style.boxShadow='7px 7px 0 rgba(26,18,9,.2)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='4px 4px 0 rgba(26,18,9,.16)'}}
              >🎓 Access Dashboard</Link>
            </Rise>

            <Rise d={.18}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.85rem' }}>
                {[
                  { i:'⚡', n:'Next.js 14',  d:'App Router + SSR' },
                  { i:'🍃', n:'MongoDB',      d:'Mongoose ODM' },
                  { i:'🎨', n:'Tailwind CSS', d:'Utility-first' },
                  { i:'🔐', n:'NextAuth.js',  d:'JWT · Role sessions' },
                  { i:'☁️', n:'Vercel',       d:'Global edge deploy' },
                  { i:'🖼', n:'Uploadthing',   d:'Media & files' },
                ].map(t => (
                  <div key={t.n} style={{
                    background:'#fff', border:'1px solid #c8b89a',
                    borderRadius:2, padding:'1rem 1.1rem',
                    boxShadow:'2px 2px 0 #c8b89a',
                    transition:'transform .2s,box-shadow .2s',
                  }}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='translate(-2px,-2px)';el.style.boxShadow='4px 4px 0 #c8b89a'}}
                    onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='';el.style.boxShadow='2px 2px 0 #c8b89a'}}
                  >
                    <div style={{ fontSize:'1.2rem', marginBottom:'.35rem' }}>{t.i}</div>
                    <div style={{ fontFamily:'Noto Serif JP,serif', fontWeight:700, fontSize:'.82rem', color:'#1a1209' }}>{t.n}</div>
                    <div style={{ fontFamily:'Share Tech Mono', fontSize:'.6rem', color:'#7a6a52', marginTop:2 }}>{t.d}</div>
                  </div>
                ))}
              </div>
            </Rise>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────── */}
      <section style={{
        background:'linear-gradient(162deg,#1a1108 0%,#0c1520 100%)',
        padding:'9rem clamp(1.5rem,5vw,3.5rem)',
        textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        {/* Giant kanji watermark */}
        <div style={{
          position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Noto Serif JP,serif', fontWeight:900,
          fontSize:'clamp(14rem,40vw,30rem)', color:'rgba(212,168,67,.022)',
          userSelect:'none', pointerEvents:'none', lineHeight:1,
        }}>学</div>

        {/* Dust in CTA */}
        {mounted && [
          {top:'22%',left:'13%',dur:7,del:.5,sz:3},
          {top:'70%',left:'83%',dur:9,del:1.2,sz:2},
          {top:'42%',left:'91%',dur:6,del:2.0,sz:2.5},
          {top:'78%',left:'17%',dur:8,del:.8,sz:2},
        ].map((m,i) => <Mote key={i} {...m} />)}

        <Rise style={{ position:'relative', zIndex:1 }}>
          <span style={{ fontFamily:'Share Tech Mono', fontSize:'.58rem', letterSpacing:'.44em', color:'rgba(212,168,67,.4)', textTransform:'uppercase', display:'block', marginBottom:'1.5rem' }}>
            Ready to begin?
          </span>
          <h2 style={{ fontFamily:'Noto Serif JP,serif', fontWeight:900, fontSize:'clamp(2.5rem,8vw,5.5rem)', color:'#faf6ee', lineHeight:1, marginBottom:'1.5rem' }}>
            Open the library.<br /><span style={{ color:'#d4a843' }}>Start learning.</span>
          </h2>
          <p style={{ color:'rgba(250,246,238,.34)', fontSize:'.9rem', lineHeight:1.88, maxWidth:470, margin:'0 auto 3rem', fontWeight:300 }}>
            Sign in with your school credentials. Every role lands automatically on its own personalised dashboard — no manual routing needed.
          </p>
          <Link href="/login" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            background:'linear-gradient(140deg,#d4a843 0%,#c09030 55%,#a87c28 100%)',
            color:'#1a1209', fontWeight:900, fontSize:'1rem',
            letterSpacing:'.12em', textTransform:'uppercase',
            fontFamily:'Noto Serif JP,serif',
            padding:'1.15rem 3.4rem', borderRadius:2, textDecoration:'none',
            boxShadow:'5px 5px 0 rgba(212,168,67,.17), 0 18px 55px rgba(212,168,67,.13)',
            transition:'all .28s cubic-bezier(.22,1,.36,1)',
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translate(-4px,-4px)';e.currentTarget.style.boxShadow='9px 9px 0 rgba(212,168,67,.22), 0 28px 65px rgba(212,168,67,.18)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='5px 5px 0 rgba(212,168,67,.17), 0 18px 55px rgba(212,168,67,.13)'}}
          >📖 Enter StudySync</Link>
        </Rise>
      </section>

      {/* ─── FOOTER ───────────────────────────────────── */}
      <footer style={{
        background:'#080503',
        borderTop:'1px solid rgba(212,168,67,.09)',
        padding:'1.8rem clamp(1.5rem,5vw,3.5rem)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem',
      }}>
        <div style={{ fontFamily:'Noto Serif JP,serif', fontWeight:900, fontSize:'1rem', color:'#faf6ee' }}>
          Study<span style={{ color:'#d4a843' }}>Sync</span>
        </div>
        <div style={{ fontFamily:'Share Tech Mono', fontSize:'.65rem', color:'rgba(250, 246, 238, 0.57)', letterSpacing:'.2em' }}>
          © 2026 STUDYSYNC · SECONDARY SCHOOL LMS
        </div>
        <Link href="/login" style={{
          fontFamily:'Share Tech Mono', fontSize:'.9rem', letterSpacing:'.16em',
          color:'rgba(212,168,67,.38)', textDecoration:'none', textTransform:'uppercase',
          transition:'color .2s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.color='#d4a843'}}
          onMouseLeave={e=>{e.currentTarget.style.color='rgba(212,168,67,.38)'}}
        >Sign In →</Link>
      </footer>
    </>
  )
}