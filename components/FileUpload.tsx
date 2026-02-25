'use client'

import { useRef, useState } from 'react'

/* ── Supported file types ── */
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

const ACCEPT_LABEL = 'PDF, DOCX, DOC, ODT, RTF, TXT, JPG, PNG, GIF'
const MAX_MB = 20

/**
 * Convert a Cloudinary URL to use fl_attachment so the browser
 * downloads/opens the file instead of trying to render it inline cross-origin.
 * For images we keep the original URL (images don't have CORS issues in <img>).
 */
function toDownloadUrl(url: string, fileName: string): string {
  if (!url.includes('cloudinary.com')) return url
  const isPdf = fileName.toLowerCase().endsWith('.pdf') ||
                url.toLowerCase().includes('.pdf')
  if (!isPdf) return url
  // Insert fl_attachment transformation — forces browser to download
  return url.replace('/upload/', '/upload/fl_attachment/')
}

interface Props {
  value: string          // current URL (empty if none)
  onChange: (url: string, originalName: string) => void
  accentColor?: string   // matches role theme
  label?: string
}

export default function FileUpload({
  value,
  onChange,
  accentColor = '#d4a843',
  label = 'Attachment',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const [fileName,  setFileName]  = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    // Size check
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB} MB.`)
      return
    }

    setUploading(true)
    setFileName(file.name)

    try {
      const cloudName  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', uploadPreset)
      form.append('folder', 'studysync')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: form }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message ?? 'Upload failed')
      }

      const data = await res.json()
      setFileName(file.name)   // keep file name for download URL detection
      onChange(data.secure_url, file.name)
    } catch (err: any) {
      setError(err.message ?? 'Upload failed. Please try again.')
      setFileName('')
    } finally {
      setUploading(false)
      // reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
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
      {/* Hidden real file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFile}
        className="hidden"
        id="file-upload-input"
      />

      {/* Drop zone / button */}
      {!hasFile ? (
        <label
          htmlFor="file-upload-input"
          className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-sm cursor-pointer transition-colors ${
            uploading
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:opacity-80'
          }`}
          style={{ borderColor: `${accentColor}40`, background: `${accentColor}06` }}
        >
          <span className="text-xl">{uploading ? '⏳' : '📎'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold" style={{ color: accentColor }}>
              {uploading
                ? `Uploading ${fileName}…`
                : `Click to attach a file`}
            </div>
            <div className="text-[10px] font-mono text-[#7a6a52] mt-0.5">
              {ACCEPT_LABEL} · Max {MAX_MB} MB
            </div>
          </div>
          {uploading && (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${accentColor}60`, borderTopColor: 'transparent' }} />
          )}
        </label>
      ) : (
        /* Attached file preview */
        <div
          className="flex items-center gap-3 px-4 py-3 border rounded-sm"
          style={{ borderColor: `${accentColor}30`, background: `${accentColor}06` }}
        >
          <span className="text-xl">📎</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#1a1209] truncate">
              {fileName || 'Attached file'}
            </div>
            <a
              href={toDownloadUrl(value, fileName)}
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
            className="text-[#c0392b] hover:text-[#e04030] text-sm font-bold transition-colors px-1"
            title="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1 text-[10px] font-mono text-[#c0392b]">⚠ {error}</p>
      )}
    </div>
  )
}