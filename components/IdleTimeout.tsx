'use client'

/**
 * IdleTimeout
 *
 * Drop this once inside any authenticated layout.
 * It watches all user activity (mouse, keyboard, touch, scroll).
 * After IDLE_SECONDS of inactivity it signs the user out and
 * redirects to the landing page.
 *
 * Usage — add to layout.tsx:
 *   import IdleTimeout from '@/components/IdleTimeout'
 *   ...
 *   <IdleTimeout />          ← place anywhere inside the layout JSX
 */

import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'

const IDLE_SECONDS  = 60   // kick out after this many seconds of inactivity
const WARN_SECONDS  = 15   // show warning this many seconds before kick-out

export default function IdleTimeout() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)  // null = not yet warned
  const timerRef    = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isLoggingOut = useRef(false)

  function clearAll() {
    if (timerRef.current)    clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function logout() {
    if (isLoggingOut.current) return
    isLoggingOut.current = true
    clearAll()
    // callbackUrl='/' sends user to landing page, not /login
    signOut({ callbackUrl: '/' })
  }

  function resetTimer() {
    if (isLoggingOut.current) return
    clearAll()
    setSecondsLeft(null)

    // Warn WARN_SECONDS before the timeout
    timerRef.current = setTimeout(() => {
      setSecondsLeft(WARN_SECONDS)

      // Countdown tick
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev === null) return null
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            logout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, (IDLE_SECONDS - WARN_SECONDS) * 1000)
  }

  useEffect(() => {
    // All events that count as "activity"
    const events = [
      'mousemove', 'mousedown', 'keydown',
      'touchstart', 'touchmove', 'scroll', 'wheel', 'click',
    ]

    const handler = () => resetTimer()

    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    resetTimer()   // start the initial timer

    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      clearAll()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Nothing visible until warning kicks in
  if (secondsLeft === null) return null

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm" />

      {/* Warning card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="bg-[#2c1810] border border-[rgba(212,168,67,0.35)] rounded-sm shadow-2xl
            w-full max-w-sm overflow-hidden"
          style={{ boxShadow: '8px 8px 0 rgba(26,18,9,0.4)' }}
        >
          {/* Stripe */}
          <div className="h-1 bg-gradient-to-r from-[#c0392b] via-[#d4a843] to-[#c0392b]" />

          <div className="px-7 py-6 text-center">
            {/* Countdown ring */}
            <div className="relative w-16 h-16 mx-auto mb-4">
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none"
                  stroke="rgba(212,168,67,0.15)" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="none"
                  stroke="#d4a843" strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - secondsLeft / WARN_SECONDS)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center
                  text-xl font-bold font-mono"
                style={{ color: secondsLeft <= 5 ? '#c0392b' : '#d4a843' }}
              >
                {secondsLeft}
              </span>
            </div>

            <p className="text-[#d4a843] text-xs font-mono tracking-[0.2em] uppercase mb-2">
              Session Expiring
            </p>
            <h2
              className="text-[#faf6ee] text-lg font-bold mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Still there?
            </h2>
            <p className="text-[rgba(250,246,238,0.5)] text-sm mb-6">
              You've been inactive. You'll be signed out in{' '}
              <span className="font-bold" style={{ color: secondsLeft <= 5 ? '#c0392b' : '#d4a843' }}>
                {secondsLeft}s
              </span>{' '}
              unless you continue.
            </p>

            <div className="flex gap-3">
              <button
                onClick={logout}
                className="flex-1 py-2.5 border border-[rgba(192,57,43,0.4)] text-[rgba(192,57,43,0.7)]
                  hover:text-[#c0392b] hover:border-[rgba(192,57,43,0.7)]
                  text-xs font-mono uppercase tracking-widest rounded-sm transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={resetTimer}
                className="flex-1 py-2.5 bg-[#d4a843] hover:bg-[#c49a35] text-[#1a1209]
                  font-bold text-xs uppercase tracking-widest rounded-sm transition-colors"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}