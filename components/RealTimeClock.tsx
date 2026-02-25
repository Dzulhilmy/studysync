'use client'

import { useEffect, useState } from 'react'

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * RealTimeClock
 *
 * Usage — drop anywhere in a page header:
 *
 *   import RealTimeClock from '@/components/RealTimeClock'
 *
 *   // Student pages (blue accent)
 *   <RealTimeClock accentColor="#63b3ed" />
 *
 *   // Teacher pages (green accent)
 *   <RealTimeClock accentColor="#1a7a6e" />
 *
 *   // Admin pages (gold accent)
 *   <RealTimeClock accentColor="#d4a843" />
 *
 * Props:
 *   accentColor  — color for the time digits            (default: '#d4a843')
 *   align        — 'left' | 'right'                     (default: 'right')
 */
export default function RealTimeClock({
  accentColor = '#d4a843',
  align = 'right',
}: {
  accentColor?: string
  align?: 'left' | 'right'
}) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Avoid hydration mismatch — render nothing until client tick
  if (!now) return null

  const day   = DAYS[now.getDay()]
  const date  = now.getDate()
  const month = MONTHS[now.getMonth()]
  const year  = now.getFullYear()
  const hh    = String(now.getHours()).padStart(2, '0')
  const mm    = String(now.getMinutes()).padStart(2, '0')
  const ss    = String(now.getSeconds()).padStart(2, '0')

  const alignClass = align === 'left' ? 'items-start' : 'items-end'

  return (
    <div className={`flex flex-col ${alignClass} select-none shrink-0`}>

      {/* ── Time ── */}
      <div className="flex items-baseline gap-0.5 leading-none">
        <span
          className="text-lg font-mono font-bold tracking-wider"
          style={{ color: accentColor }}
        >
          {hh}:{mm}
        </span>
        <span
          className="text-sm font-mono font-bold tracking-wider"
          style={{ color: accentColor, opacity: 0.45 }}
        >
          :{ss}
        </span>
      </div>

      {/* ── Day · Date — dark text so visible on light #faf6ee background ── */}
      <div
        className="text-[11px] font-mono tracking-widest uppercase mt-0.5 leading-none"
        style={{ color: '#7a6a52' }}   /* warm brown — always readable on parchment bg */
      >
        {day} · {date} {month} {year}
      </div>

    </div>
  )
}