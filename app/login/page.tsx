'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ── Eye icons ────────────────────────────────────────── */
function EyeOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeClosed() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

/* ── Password input with eye toggle ──────────────────── */
function PasswordInput({ value, onChange, placeholder = '••••••••' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="w-full bg-[rgba(250,246,238,0.06)] border border-[rgba(212,168,67,0.2)]
          text-[#faf6ee] placeholder-[rgba(250,246,238,0.2)] rounded-sm px-3 py-2.5 pr-10
          text-sm focus:outline-none focus:border-[#d4a843] transition-colors"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2
          text-[rgba(250,246,238,0.3)] hover:text-[#d4a843] transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOpen /> : <EyeClosed />}
      </button>
    </div>
  )
}

/* ── Small reusable bits ──────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[rgba(250,246,238,0.5)] text-xs font-mono
      tracking-widest uppercase mb-1.5">
      {children}
    </label>
  )
}
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 px-3 py-2 bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)]
      rounded-sm text-[#e05040] text-xs text-center font-mono">
      {msg}
    </div>
  )
}
function SuccessBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 px-3 py-2 bg-[rgba(26,122,110,0.18)] border border-[rgba(26,122,110,0.35)]
      rounded-sm text-[#2ab9a8] text-xs text-center font-mono">
      ✓ {msg}
    </div>
  )
}
function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-[#d4a843] hover:bg-[#c49a35] text-[#1a1209] font-bold text-sm
        tracking-widest uppercase py-3 rounded-sm transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {children}
    </button>
  )
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Login fields
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [regName,     setRegName]     = useState('')
  const [regEmail,    setRegEmail]    = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm,  setRegConfirm]  = useState('')

  // Shared
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError(''); setSuccess('')
    setEmail(''); setPassword('')
    setRegName(''); setRegEmail(''); setRegPassword(''); setRegConfirm('')
  }

  /* ── Login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  /* ── Register ── */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return }
    if (regPassword.length < 6)     { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Registration failed. Please try again.')
    } else {
      setSuccess('Account created! Redirecting to sign in…')
      setTimeout(() => switchMode('login'), 1800)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#faf6ee] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Back to home */}
      <Link href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-xs font-mono
          text-[#7a6a52] hover:text-[#1a1209] group transition-colors">
        <span className="text-base leading-none group-hover:-translate-x-1 transition-transform inline-block">←</span>
        Back to Home
      </Link>

      {/* Paper lines */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 27px,#c8b89a 28px)' }} />

      {/* Corner ornaments */}
      <div className="absolute top-6 left-6  text-[#d4a843] opacity-30 text-4xl select-none">⟨</div>
      <div className="absolute top-6 right-6 text-[#d4a843] opacity-30 text-4xl select-none">⟩</div>
      <div className="absolute bottom-6 left-6  text-[#d4a843] opacity-30 text-4xl select-none">⟨</div>
      <div className="absolute bottom-6 right-6 text-[#d4a843] opacity-30 text-4xl select-none">⟩</div>

      <div className="w-full max-w-sm relative z-10">

        {/* Book cover card */}
        <div className="bg-[#2c1810] rounded-sm shadow-2xl overflow-hidden"
          style={{ boxShadow: '8px 8px 0 rgba(26,18,9,0.3)' }}>

          {/* Spine stripe */}
          <div className="h-1.5 bg-gradient-to-r from-[#c0392b] via-[#d4a843] to-[#c0392b]" />

          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center border-b border-[rgba(212,168,67,0.15)]">
            <p className="text-[#d4a843] text-xs font-mono tracking-[0.3em] uppercase mb-2 opacity-60">
              スタディシンク
            </p>
            <h1 className="text-[#faf6ee] text-4xl font-bold tracking-tight leading-none"
              style={{ fontFamily: 'Georgia, serif' }}>
              Study<span className="text-[#d4a843]">Sync</span>
            </h1>
            <p className="text-[rgba(250,246,238,0.4)] text-xs mt-2 tracking-widest uppercase">
              Learning · Monitoring · Growth
            </p>
          </div>

          {/* ── Mode tabs ── */}
          <div className="flex border-b border-[rgba(212,168,67,0.12)]">
            {(['login', 'register'] as const).map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={`flex-1 py-3 text-xs font-mono tracking-widest uppercase transition-all ${
                  mode === m
                    ? 'text-[#d4a843] bg-[rgba(212,168,67,0.07)] border-b-2 border-[#d4a843]'
                    : 'text-[rgba(250,246,238,0.3)] hover:text-[rgba(250,246,238,0.55)] hover:bg-[rgba(255,255,255,0.02)]'
                }`}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* ══════════════════════
              LOGIN FORM
          ══════════════════════ */}
          {isLogin && (
            <form onSubmit={handleLogin} className="px-8 py-7">
              {error && <ErrorBox msg={error} />}

              <div className="mb-4">
                <Label>Email</Label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@school.edu"
                  className="w-full bg-[rgba(250,246,238,0.06)] border border-[rgba(212,168,67,0.2)]
                    text-[#faf6ee] placeholder-[rgba(250,246,238,0.2)] rounded-sm px-3 py-2.5
                    text-sm focus:outline-none focus:border-[#d4a843] transition-colors" />
              </div>

              <div className="mb-6">
                <Label>Password</Label>
                <PasswordInput value={password} onChange={setPassword} />
              </div>

              <SubmitBtn loading={loading}>
                {loading ? 'Opening the book…' : 'Enter the Library'}
              </SubmitBtn>

              <p className="text-center text-[rgba(250,246,238,0.22)] text-xs font-mono mt-5">
                No account?{' '}
                <button type="button" onClick={() => switchMode('register')}
                  className="text-[#d4a843] hover:underline underline-offset-2 transition-colors">
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* ══════════════════════
              REGISTER FORM
          ══════════════════════ */}
          {!isLogin && (
            <form onSubmit={handleRegister} className="px-8 py-7">
              {error   && <ErrorBox   msg={error} />}
              {success && <SuccessBox msg={success} />}

              <div className="mb-4">
                <Label>Full Name</Label>
                <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                  required placeholder="Ali Ahmad"
                  className="w-full bg-[rgba(250,246,238,0.06)] border border-[rgba(212,168,67,0.2)]
                    text-[#faf6ee] placeholder-[rgba(250,246,238,0.2)] rounded-sm px-3 py-2.5
                    text-sm focus:outline-none focus:border-[#d4a843] transition-colors" />
              </div>

              <div className="mb-4">
                <Label>Email</Label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  required placeholder="you@school.edu"
                  className="w-full bg-[rgba(250,246,238,0.06)] border border-[rgba(212,168,67,0.2)]
                    text-[#faf6ee] placeholder-[rgba(250,246,238,0.2)] rounded-sm px-3 py-2.5
                    text-sm focus:outline-none focus:border-[#d4a843] transition-colors" />
              </div>

              <div className="mb-4">
                <Label>Password</Label>
                <PasswordInput value={regPassword} onChange={setRegPassword}
                  placeholder="Min. 6 characters" />
              </div>

              <div className="mb-6">
                <Label>Confirm Password</Label>
                <PasswordInput value={regConfirm} onChange={setRegConfirm}
                  placeholder="Re-enter password" />
              </div>

              <SubmitBtn loading={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </SubmitBtn>

              <p className="text-center text-[rgba(250,246,238,0.22)] text-xs font-mono mt-5">
                Already registered?{' '}
                <button type="button" onClick={() => switchMode('login')}
                  className="text-[#d4a843] hover:underline underline-offset-2 transition-colors">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Footer hint */}
          <div className="px-8 pb-5 text-center">
            <p className="text-[rgba(250,246,238,0.15)] text-xs font-mono">
              {isLogin
                ? 'Contact your administrator for account access'
                : 'New accounts require admin approval before login'}
            </p>
          </div>
        </div>

        {/* Version tag */}
        <p className="text-center text-[#7a6a52] text-xs font-mono mt-4 opacity-50 tracking-widest">
          v1.0.0 · StudySync
        </p>
      </div>
    </div>
  )
}