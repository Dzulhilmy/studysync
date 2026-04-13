'use client'

/**
 * FilePreviewButton
 *
 * A smart "See the (document/image/submission/material) details" button
 * that detects the file type from its URL or explicit fileName and opens
 * the file in a new tab.
 *
 * Props:
 *   url        — the file URL to open
 *   fileName   — optional filename hint for type detection
 *   label      — optional override for the word after "See the ... details"
 *                e.g. "submission" → "See the submission details"
 *   accentColor — theme color  (default #1a7a6e)
 *   className  — extra Tailwind classes
 *   compact    — if true, renders a small inline link instead of a pill button
 */

interface Props {
  url:         string
  fileName?:   string
  label?:      string           // overrides the auto-detected noun
  accentColor?: string
  className?:  string
  compact?:    boolean
}

// ── Detect a human-readable noun from the file extension / URL ─────────────
function detectFileNoun(url: string, fileName?: string): string {
  const src = (fileName || url || '').toLowerCase()

  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)/.test(src)) return 'image'
  if (/\.pdf/.test(src))                                         return 'document'
  if (/\.(doc|docx|odt|rtf)/.test(src))                         return 'document'
  if (/\.(ppt|pptx|odp)/.test(src))                             return 'presentation'
  if (/\.(xls|xlsx|ods|csv)/.test(src))                         return 'spreadsheet'
  if (/\.(txt|md)/.test(src))                                    return 'document'
  if (/\.(mp4|mov|avi|mkv|webm)/.test(src))                     return 'video'
  if (/\.(mp3|wav|ogg|aac|flac)/.test(src))                     return 'audio'
  if (/\.(zip|rar|7z|tar|gz)/.test(src))                        return 'archive'
  return 'file'
}

// ── Emoji icon per noun ────────────────────────────────────────────────────
function iconFor(noun: string): string {
  const MAP: Record<string, string> = {
    image:        '🖼️',
    document:     '📄',
    presentation: '📊',
    spreadsheet:  '📋',
    video:        '🎬',
    audio:        '🎵',
    archive:      '🗜️',
    submission:   '📤',
    material:     '📎',
    file:         '📎',
  }
  return MAP[noun] ?? '📎'
}

export default function FilePreviewButton({
  url,
  fileName,
  label,
  accentColor = '#1a7a6e',
  className   = '',
  compact     = false,
}: Props) {
  if (!url) return null

  const noun = label ?? detectFileNoun(url, fileName)
  const icon = iconFor(noun)
  const btnLabel = `See the ${noun} details`

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1 text-[11px] font-mono hover:underline underline-offset-2 transition-colors ${className}`}
        style={{ color: accentColor }}
      >
        {icon} {btnLabel} ↗
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all hover:opacity-90 active:scale-[0.98] ${className}`}
      style={{
        color:           accentColor,
        borderColor:     `${accentColor}40`,
        background:      `${accentColor}08`,
      }}
    >
      <span>{icon}</span>
      <span>{btnLabel}</span>
      <span className="text-[10px] opacity-60">↗</span>
    </a>
  )
}
