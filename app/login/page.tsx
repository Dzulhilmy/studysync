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

/* ── Strength indicator ───────────────────────────────── */
function strengthOf(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: 'transparent', width: '0%' }
  if (pw.length < 6)   return { label: 'Too short', color: '#c0392b', width: '20%' }
  const has = {
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
  const score = Object.values(has).filter(Boolean).length
  if (score <= 1) return { label: 'Weak',   color: '#e07820', width: '35%' }
  if (score === 2) return { label: 'Fair',   color: '#d4a843', width: '55%' }
  if (score === 3) return { label: 'Good',   color: '#1a9a8a', width: '75%' }
  return               { label: 'Strong', color: '#1a7a6e', width: '100%' }
}

function StrengthBar({ password }: { password: string }) {
  const s = strengthOf(password)
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-[rgba(212,168,67,0.1)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: s.width, background: s.color }} />
      </div>
      <p className="text-[10px] font-mono mt-1 transition-colors" style={{ color: s.color }}>
        {s.label}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
type Mode = 'login' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')

  // Login fields
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Forgot password fields
  const [fpEmail,      setFpEmail]      = useState('')
  const [fpNew,        setFpNew]        = useState('')
  const [fpConfirm,    setFpConfirm]    = useState('')
  const [fpStep,       setFpStep]       = useState<'email' | 'reset'>('email')
  const [fpVerified,   setFpVerified]   = useState(false)

  // Shared
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(''); setSuccess('')
    setEmail(''); setPassword('')
    setFpEmail(''); setFpNew(''); setFpConfirm('')
    setFpStep('email'); setFpVerified(false)
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

  /* ── Forgot: Step 1 — verify email exists ── */
  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    // We'll try a dry-run against the reset endpoint
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fpEmail, checkOnly: true }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Email not found.')
    } else {
      setFpVerified(true)
      setFpStep('reset')
      setError('')
    }
  }

  /* ── Forgot: Step 2 — set new password ── */
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (fpNew !== fpConfirm)  { setError('Passwords do not match.'); return }
    if (fpNew.length < 6)     { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fpEmail, newPassword: fpNew }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Reset failed. Please try again.')
    } else {
      setSuccess('Password updated! Redirecting to sign in…')
      setTimeout(() => switchMode('login'), 2000)
    }
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#faf6ee] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Back to home */}
      <Link href="/"
        suppressHydrationWarning
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-xs font-mono
          text-[#7a6a52] hover:text-[#1a1209] group transition-colors">
        <span suppressHydrationWarning className="text-base leading-none group-hover:-translate-x-1 transition-transform inline-block">←</span>
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
            {(['login', 'forgot'] as const).map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={`flex-1 py-3 text-xs font-mono tracking-widest uppercase transition-all ${
                  mode === m
                    ? 'text-[#d4a843] bg-[rgba(212,168,67,0.07)] border-b-2 border-[#d4a843]'
                    : 'text-[rgba(250,246,238,0.3)] hover:text-[rgba(250,246,238,0.55)] hover:bg-[rgba(255,255,255,0.02)]'
                }`}>
                {m === 'login' ? 'Sign In' : 'Forgot Password'}
              </button>
            ))}
          </div>

          {/* ══════════════════════
              LOGIN FORM
          ══════════════════════ */}
          {mode === 'login' && (
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

              <div className="mb-2">
                <Label>Password</Label>
                <PasswordInput value={password} onChange={setPassword} />
              </div>

              {/* Forgot password shortcut link */}
              <div className="mb-6 text-right">
                <button type="button" onClick={() => switchMode('forgot')}
                  className="text-[10px] font-mono text-[rgba(212,168,67,0.5)] hover:text-[#d4a843] transition-colors tracking-widest uppercase">
                  Forgot password?
                </button>
              </div>

              <SubmitBtn loading={loading}>
                {loading ? 'Opening the book…' : 'Enter the Library'}
              </SubmitBtn>
            </form>
          )}

          {/* ══════════════════════
              FORGOT PASSWORD
          ══════════════════════ */}
          {mode === 'forgot' && (
            <div className="px-8 py-7">

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {['Verify Email', 'New Password'].map((label, i) => {
                  const active  = fpStep === (i === 0 ? 'email' : 'reset')
                  const done    = fpStep === 'reset' && i === 0
                  return (
                    <div key={label} className="flex items-center gap-2 flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                        done    ? 'bg-[#1a7a6e] text-white' :
                        active  ? 'bg-[#d4a843] text-[#1a1209]' :
                                  'bg-[rgba(212,168,67,0.1)] text-[rgba(250,246,238,0.2)]'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-[10px] font-mono tracking-wide uppercase transition-colors ${
                        active ? 'text-[#d4a843]' : done ? 'text-[#1a9a8a]' : 'text-[rgba(250,246,238,0.2)]'
                      }`}>{label}</span>
                      {i === 0 && <div className="flex-1 h-px mx-1" style={{
                        background: done ? '#1a7a6e' : 'rgba(212,168,67,0.1)'
                      }} />}
                    </div>
                  )
                })}
              </div>

              {/* ── Step 1: enter email ── */}
              {fpStep === 'email' && (
                <form onSubmit={handleVerifyEmail}>
                  {error && <ErrorBox msg={error} />}

                  <p className="text-[rgba(250,246,238,0.4)] text-xs font-mono mb-5 leading-relaxed">
                    Enter the email address linked to your account. We'll let you set a new password.
                  </p>

                  <div className="mb-6">
                    <Label>Email Address</Label>
                    <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                      required placeholder="you@school.edu"
                      className="w-full bg-[rgba(250,246,238,0.06)] border border-[rgba(212,168,67,0.2)]
                        text-[#faf6ee] placeholder-[rgba(250,246,238,0.2)] rounded-sm px-3 py-2.5
                        text-sm focus:outline-none focus:border-[#d4a843] transition-colors" />
                  </div>

                  <SubmitBtn loading={loading}>
                    {loading ? 'Checking…' : 'Continue →'}
                  </SubmitBtn>
                </form>
              )}

              {/* ── Step 2: set new password ── */}
              {fpStep === 'reset' && (
                <form onSubmit={handleResetPassword}>
                  {error   && <ErrorBox   msg={error}   />}
                  {success && <SuccessBox msg={success} />}

                  <p className="text-[rgba(250,246,238,0.4)] text-xs font-mono mb-5 leading-relaxed">
                    Account found for <span className="text-[#d4a843]">{fpEmail}</span>. Choose a new password below.
                  </p>

                  <div className="mb-4">
                    <Label>New Password</Label>
                    <PasswordInput value={fpNew} onChange={setFpNew} placeholder="Min. 6 characters" />
                    <StrengthBar password={fpNew} />
                  </div>

                  <div className="mb-6">
                    <Label>Confirm Password</Label>
                    <PasswordInput value={fpConfirm} onChange={setFpConfirm} placeholder="Re-enter password" />
                    {/* Match indicator */}
                    {fpConfirm && (
                      <p className={`text-[10px] font-mono mt-1.5 transition-colors ${
                        fpNew === fpConfirm ? 'text-[#1a9a8a]' : 'text-[#c0392b]'
                      }`}>
                        {fpNew === fpConfirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <SubmitBtn loading={loading}>
                    {loading ? 'Updating…' : '🔑 Update Password'}
                  </SubmitBtn>

                  {/* Back to step 1 */}
                  <button type="button" onClick={() => { setFpStep('email'); setError(''); setFpNew(''); setFpConfirm('') }}
                    className="w-full mt-3 py-2 text-[10px] font-mono text-[rgba(250,246,238,0.3)]
                      hover:text-[rgba(250,246,238,0.6)] tracking-widest uppercase transition-colors">
                    ← Use different email
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Footer hint */}
          <div className="px-8 pb-5 text-center">
            <p className="text-[rgba(250,246,238,0.15)] text-xs font-mono">
              {mode === 'login'
                ? 'Contact your administrator for account access'
                : 'Password is overwritten immediately upon confirmation'}
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