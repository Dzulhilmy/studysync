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

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Always read from the live session — never from local state.
  // After update() resolves, session.user.avatarUrl will contain the new value
  // and the component re-renders automatically.
  const currentAvatar = (session?.user as any)?.avatarUrl ?? null
  const userName      = session?.user?.name ?? null

  // Convert file to base64 data URL
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSaved(false)

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG or WebP images are allowed.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB.')
      return
    }

    setSaving(true)
    try {
      // 1. Convert to permanent base64 data URL
      const base64 = await fileToBase64(file)

      // 2. Save to MongoDB
      const res = await fetch('/api/auth/avatar', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatarUrl: base64 }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error (${res.status})`)
      }

      // 3. Push new avatarUrl into the NextAuth JWT so session.user.avatarUrl
      //    updates immediately in ALL components without logout/login
      await update({ avatarUrl: base64 })

      setSaved(true)
    } catch (err: any) {
      console.error('[AvatarUploader]', err)
      setError(err.message ?? 'Failed to save avatar. Please try again.')
    } finally {
      setSaving(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

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
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      await update({ avatarUrl: null })
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
        <Avatar src={currentAvatar} name={userName} role={role} size={size} showRoleDot />

        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={saving}
            />

            <button
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-sm transition-all cursor-pointer"
              style={{ background: '#1a3a2a', color: '#d4a843', border: '1px solid rgba(212,168,67,0.35)' }}
            >
              {saving ? 'Saving…' : currentAvatar ? 'Change Photo' : 'Upload Photo'}
            </button>

            {currentAvatar && !saving && (
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-semibold rounded-sm border border-[#c8b89a] text-[#7a6a52] hover:bg-[#faf6ee] transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-[11px] font-mono text-[#7a6a52] mb-1.5">
            JPG, PNG or WebP · Max 2 MB · Square recommended
          </p>

          {saved && !error && <p className="text-[12px] font-mono text-[#1a7a6e]">✓ Avatar updated</p>}
          {error            && <p className="text-[12px] font-mono text-[#c0392b]">✗ {error}</p>}
        </div>
      </div>
    </div>
  )
}