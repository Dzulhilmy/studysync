'use client'

import { useSession }     from 'next-auth/react'
import Avatar             from '@/components/Avatar'
import { useUploadThing } from '@/lib/uploadthing'

interface AvatarUploaderProps {
  currentAvatar: string | null
  name?:         string | null
  role?:         'admin' | 'teacher' | 'student'
  size?:         number
  onUpload:      (url: string | null) => void
}

export default function AvatarUploader({
  currentAvatar,
  name,
  role = 'student',
  size = 80,
  onUpload
}: AvatarUploaderProps) {
  const { update } = useSession()

  const { startUpload, isUploading } = useUploadThing('studysyncUploader', {
    onClientUploadComplete: async (res) => {
      const file = res?.[0]
      if (!file) return

      try {
        // 1. Save new URL to DB
        const response = await fetch('/api/auth/avatar', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ avatarUrl: file.url }),
        })
        if (!response.ok) throw new Error('Failed to update avatar in DB')

        // 2. Notify parent
        onUpload(file.url)
        
        // 3. Update NextAuth session immediately
        await update({ avatarUrl: file.url })
      } catch (err: any) {
        console.error('[AvatarUploader] Error saving URL:', err)
        alert('Failed to save avatar photo.')
      }
    },
    onUploadError: (err) => {
      console.error('[UploadThing]', err)
      alert(err.message ?? 'Upload failed.')
    },
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset input
    startUpload([file])
  }

  async function handleRemove() {
    try {
      // 1. Remove from DB
      const res = await fetch('/api/auth/avatar', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatarUrl: null }),
      })
      if (!res.ok) throw new Error('Failed to remove avatar from DB')

      // 2. Notify parent
      onUpload(null)

      // 3. Update NextAuth session
      await update({ avatarUrl: null })
    } catch (err) {
      console.error('[AvatarUploader] Remove Error:', err)
      alert('Failed to remove avatar.')
    }
  }

  // Determine button colors based on role
  const theme = {
    admin:   { bg: '#1a3a2a', text: '#d4a843', border: 'rgba(212,168,67,0.35)' },
    teacher: { bg: '#1a2535', text: '#63b3ed', border: 'rgba(99,179,237,0.35)' },
    student: { bg: '#2c1810', text: '#d4a843', border: 'rgba(212,168,67,0.35)' },
  }[role]

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <Avatar src={currentAvatar} name={name} role={role} size={size} showRoleDot />

      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <label
            className={`px-4 py-2 text-sm font-semibold rounded-sm transition-all cursor-pointer inline-flex ${
              isUploading ? 'opacity-50 pointer-events-none' : ''
            }`}
            style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
          >
            {isUploading ? 'Uploading…' : currentAvatar ? 'Change Photo' : 'Upload Photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
              disabled={isUploading}
            />
          </label>

          {currentAvatar && !isUploading && (
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-sm font-semibold rounded-sm border border-[#c8b89a] text-[#7a6a52] hover:bg-[#faf6ee] transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <p className="text-[11px] font-mono text-[#7a6a52] mb-1.5">
          JPG or PNG · Max 8 MB · Square recommended
        </p>
      </div>
    </div>
  )
}