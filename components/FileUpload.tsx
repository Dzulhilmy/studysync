'use client'

/**
 * FileUpload — powered by UploadThing
 *
 * Same props as before — drop-in replacement for the Cloudinary version.
 * No env vars needed on the client side.
 *
 * Props:
 *   value        — current file URL ('' if none)
 *   onChange     — called with (url, originalFileName) after upload
 *   accentColor  — theme color (matches role)
 */

import { useRef, useState } from 'react'
import { useUploadThing } from '@/lib/uploadthing'

const ACCEPT_LABEL = 'PDF, DOCX, DOC, ODT, RTF, TXT, JPG, PNG, GIF'
const MAX_MB = 16

// All accepted MIME types
const ACCEPTED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
].join(',')

interface Props {
  value:       string
  onChange:    (url: string, originalName: string) => void
  accentColor?: string
}

export default function FileUpload({
  value,
  onChange,
  accentColor = '#d4a843',
}: Props) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState('')
  const [fileName,  setFileName]  = useState('')

  const { startUpload } = useUploadThing('studysyncUploader', {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: (res) => {
      const file = res?.[0]
      if (!file) return
      setUploading(false)
      setProgress(0)
      onChange(file.url, file.name)
    },
    onUploadError: (err) => {
      setUploading(false)
      setProgress(0)
      setFileName('')
      setError(err.message ?? 'Upload failed. Please try again.')
    },
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB} MB.`)
      return
    }

    setUploading(true)
    setProgress(0)
    setFileName(file.name)

    await startUpload([file])

    // Reset input so same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleClear() {
    onChange('', '')
    setFileName('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const hasFile = !!value

  return (
    <div>
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFile}
        className="hidden"
        id="ut-file-input"
      />

      {/* ── Upload zone ── */}
      {!hasFile ? (
        <label
          htmlFor="ut-file-input"
          className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-sm transition-all ${
            uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
          }`}
          style={{ borderColor: `${accentColor}40`, background: `${accentColor}06` }}
        >
          <span className="text-xl shrink-0">{uploading ? '⏳' : '📎'}</span>

          <div className="flex-1 min-w-0">
            {uploading ? (
              <>
                <div className="text-xs font-semibold mb-1.5 truncate" style={{ color: accentColor }}>
                  Uploading {fileName}…
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#e8dfd0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: accentColor }}
                  />
                </div>
                <div className="text-[10px] font-mono mt-1" style={{ color: accentColor }}>
                  {progress}%
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold" style={{ color: accentColor }}>
                  Click to attach a file
                </div>
                <div className="text-[10px] font-mono text-[#7a6a52] mt-0.5">
                  {ACCEPT_LABEL} · Max {MAX_MB} MB
                </div>
              </>
            )}
          </div>
        </label>
      ) : (
        /* ── Attached file preview ── */
        <div
          className="flex items-center gap-3 px-4 py-3 border rounded-sm"
          style={{ borderColor: `${accentColor}30`, background: `${accentColor}06` }}
        >
          <span className="text-xl shrink-0">📎</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#1a1209] truncate">
              {fileName || 'Attached file'}
            </div>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono underline underline-offset-2 truncate block"
              style={{ color: accentColor }}
            >
              View / Download ↗
            </a>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-[#c0392b] hover:text-[#e04030] text-sm font-bold transition-colors shrink-0 px-1"
            title="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-[10px] font-mono text-[#c0392b]">⚠ {error}</p>
      )}
    </div>
  )
}