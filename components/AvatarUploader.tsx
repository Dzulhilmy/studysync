'use client'

import { useRef, useState } from 'react'
import { useSession }       from 'next-auth/react'
import Avatar               from '@/components/Avatar'

interface AvatarUploaderProps {
  currentAvatar?: string | null
  name?:          string | null
  role?:          'admin' | 'teacher' | 'student'
  /** Called with the new URL after a successful upload */
  onUpload?:      (url: string) => void
}

export default function AvatarUploader({
  currentAvatar,
  name,
  role,
  onUpload,
}: AvatarUploaderProps) {
  const { update }          = useSession()
  const inputRef            = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentAvatar ?? null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.')
      return
    }

    // Local preview immediately
    setPreview(URL.createObjectURL(file))
    setError(null)
    setSuccess(false)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/auth/avatar', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setPreview(data.avatarUrl)
      setSuccess(true)
      onUpload?.(data.avatarUrl)
      await update()   // refresh NextAuth session so header updates
    } catch (err: any) {
      setError(err.message ?? 'Upload failed. Please try again.')
      setPreview(currentAvatar ?? null)
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    setUploading(true)
    setError(null)
    try {
      await fetch('/api/auth/avatar', { method: 'DELETE' })
      setPreview(null)
      setSuccess(false)
      onUpload?.('')
      await update()
    } catch {
      setError('Failed to remove avatar.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar preview */}
      <div className="relative">
        <Avatar src={preview} name={name} role={role} size={72} showRoleDot />
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs px-4 py-1.5 bg-[#1a3a2a] text-[#d4a843] border border-[rgba(212,168,67,0.3)]
                       rounded-sm hover:bg-[#1f4a34] transition-colors font-mono disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : preview ? 'Change Photo' : 'Upload Photo'}
          </button>

          {preview && !uploading && (
            <button
              onClick={handleRemove}
              className="text-xs px-3 py-1.5 border border-[#c8b89a] text-[#7a6a52]
                         hover:bg-[#faf6ee] rounded-sm font-mono transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <p className="text-[10px] font-mono text-[#a89880]">
          JPG, PNG or WebP · Max 2 MB · Square recommended
        </p>

        {error && (
          <p className="text-[10px] font-mono text-[#c0392b]">⚠ {error}</p>
        )}
        {success && (
          <p className="text-[10px] font-mono text-[#1a7a6e]">✓ Avatar updated</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''   // reset so same file can be re-selected
        }}
      />
    </div>
  )
}