'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

/**
 * ScrollToTop — Global "back to top" button
 *
 * ✔ Registered once in app/layout.tsx → active on every page automatically
 * ✔ Listens to window scroll (works with all role layouts: teacher, admin, student)
 * ✔ Auto-hides when navigating to a new route (page already at top)
 * ✔ Smooth scroll with opacity + translateY animation
 * ✔ Positioned bottom-left to avoid AccessibilityMenu (bottom-right) & NotificationBell (top-right)
 * ✔ Works on mobile, tablet, and desktop
 * ✔ Passive scroll listener — zero performance impact
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  // ── Hide on every route change (new page starts at top) ──
  useEffect(() => {
    setVisible(false)
  }, [pathname])

  // ── Show after scrolling 280 px down ──
  const onScroll = useCallback(() => {
    setVisible(window.scrollY > 280)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    // Sync on mount in case user arrived mid-page (e.g. browser back)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  function scrollUp() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollUp}
      aria-label="Back to top"
      title="Back to top"
      className={[
        // Position & shape
        'fixed bottom-6 left-6 z-[9990]',
        'w-11 h-11 rounded-full',
        'flex items-center justify-center',

        // Colours — StudySync dark-parchment palette
        'bg-[#1a1209] text-[#d4a843]',
        'border border-[rgba(212,168,67,0.35)]',
        'shadow-[0_4px_16px_rgba(0,0,0,0.35)]',

        // Hover / active states
        'hover:bg-[#2c1f0a]',
        'hover:border-[rgba(212,168,67,0.65)]',
        'hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)]',
        'active:scale-95',

        // Smooth transition for all properties + visibility
        'transition-all duration-200',

        // Visibility — opacity + translate so layout is never affected
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
    >
      {/* Upward chevron — inline SVG, no external icon dependency */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.5 11.25L9 6.75L13.5 11.25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
