'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/Avatar'

interface AvatarUploaderProps {
  role?: 'admin' | 'teacher' | 'student'
  size?: number
}

export default function AvatarUploader({ role = 'student', size = 80 }: AvatarUploaderProps) {
  const { data: session, update } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview,  setPreview]  = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const currentAvatar = preview ?? ((session?.user as any)?.avatarUrl ?? null)
  const userName      = session?.user?.name ?? null

  // ── Convert file → base64 data URL ──────────────────────────────────────────
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  // ── Pick file ────────────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSaved(false)

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG or WebP images are allowed.')
      return
    }

    // Validate size (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB.')
      return
    }

    setSaving(true)
    try {
      // 1. Convert to base64 — this is the URL we store in MongoDB
      const base64 = await fileToBase64(file)

      // 2. Show instant preview
      setPreview(base64)

      // 3. Save to database via API
      const res = await fetch('/api/auth/avatar', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatarUrl: base64 }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      // 4. Update the NextAuth session so the new avatar appears everywhere
      //    without requiring a full logout/login cycle
      await update({ avatarUrl: base64 })

      setSaved(true)
    } catch (err: any) {
      console.error('[AvatarUploader]', err)
      setError(err.message ?? 'Failed to save avatar. Please try again.')
      setPreview(null)
    } finally {
      setSaving(false)
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // ── Remove avatar ────────────────────────────────────────────────────────────
  async function handleRemove() {
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const res = await fetch('/api/auth/avatar', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatarUrl: null }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await update({ avatarUrl: null })
      setPreview(null)
      setSaved(true)
    } catch (err: any) {
      setError(err.message ?? 'Failed to remove avatar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="">
      

      <div className="flex items-center gap-5 flex-wrap">
        {/* Avatar preview */}
        <Avatar
          src={currentAvatar}
          name={userName}
          role={role}
          size={size}
          showRoleDot
        />

        {/* Actions */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Hidden file input */}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={saving}
            />

            {/* Upload / Change button */}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-sm transition-all disabled:opacity-50 cursor-pointer"
              style={{
                background:  '#1a3a2a',
                color:       '#d4a843',
                border:      '1px solid rgba(212,168,67,0.35)',
              }}
            >
              {saving ? 'Saving…' : currentAvatar ? 'Change Photo' : 'Upload Photo'}
            </button>

            {/* Remove button — only when avatar exists */}
            {currentAvatar && !saving && (
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-semibold rounded-sm border border-[#c8b89a] text-[#7a6a52] hover:bg-[#faf6ee] transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          {/* Hint */}
          <p className="text-[11px] font-mono text-[#7a6a52] mb-1.5">
            JPG, PNG or WebP · Max 2 MB · Square recommended
          </p>

          {/* Status messages */}
          {saved && !error && (
            <p className="text-[12px] font-mono text-[#1a7a6e]">✓ Avatar updated</p>
          )}
          {error && (
            <p className="text-[12px] font-mono text-[#c0392b]">✗ {error}</p>
          )}
        </div>
      </div>
    </div>
  )
}