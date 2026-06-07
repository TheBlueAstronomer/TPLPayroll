'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadSimple,
  SpinnerGap,
  WarningCircle,
  FileXls,
  X,
  CloudArrowUp,
} from '@phosphor-icons/react'
import {
  getPresignedUploadUrlAction,
  parseFromStorageAction,
  parseFromStorageWithDatesAction,
  finalizeAttendanceUploadAction,
} from '@/features/attendance-upload/actions/attendance.actions'
import type {
  MatchedAttendanceRecord,
  PayrollWeekSource,
  ImportSummary,
} from '@/features/attendance-upload/types/attendance.types'

type DragState = 'idle' | 'over'

// Upload has 3 phases with distinct UX feedback:
//  idle → uploading (browser → Supabase Storage)
//        → parsing  (server downloads, matches employees)
//        → done
type UploadPhase = 'idle' | 'uploading' | 'parsing'

interface VerificationRequiredPayload {
  records: MatchedAttendanceRecord[]
  summary: ImportSummary
  payrollWeekStartDate: string
  payrollWeekEndDate: string
  payrollWeekSource: PayrollWeekSource
  storageKey: string
  fileName: string
  fileType: string
}

interface AttendanceDropzoneProps {
  onWeekRequired: (storageKey: string, fileName: string, fileType: string) => void
  onVerificationRequired: (payload: VerificationRequiredPayload) => void
  expectedWeekStart?: string
  expectedWeekEnd?: string
  onUploadSuccess?: (uploadId: string) => void
}

export function AttendanceDropzone({
  onWeekRequired,
  onVerificationRequired,
  expectedWeekStart,
  expectedWeekEnd,
  onUploadSuccess,
}: AttendanceDropzoneProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragState, setDragState] = useState<DragState>('idle')
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0) // 0–100
  const [error, setError] = useState<string | null>(null)

  const isBusy = uploadPhase !== 'idle'

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setError(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragState('over')
  }, [])

  const handleDragLeave = useCallback(() => setDragState('idle'), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragState('idle')
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleClearFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    setUploadProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return
    setUploadPhase('uploading')
    setUploadProgress(0)
    setError(null)

    try {
      const fileName = selectedFile.name
      const fileType = fileName.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'xls'

      // ── Phase 1: Get presigned URL from server ────────────────────────────
      const urlResult = await getPresignedUploadUrlAction(fileName)
      if (!urlResult.ok) {
        setError(urlResult.error)
        setUploadPhase('idle')
        return
      }
      const { signedUrl, storageKey } = urlResult.data

      // ── Phase 2: Upload file directly to Supabase Storage (XHR for progress) ─
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', signedUrl, true)
        xhr.setRequestHeader('Content-Type', selectedFile.type || 'application/octet-stream')

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Storage upload failed: ${xhr.status} ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during file upload.'))
        xhr.send(selectedFile)
      })

      setUploadProgress(100)

      // ── Phase 3: Server parses the file from Storage ──────────────────────
      setUploadPhase('parsing')

      const result = await parseFromStorageAction(storageKey, fileName, fileType)

      if (!result.ok) {
        setError(result.error)
        setUploadPhase('idle')
        return
      }

      const { payrollWeek, records, summary } = result.data

      if (expectedWeekStart && expectedWeekEnd) {
        if (payrollWeek.source !== 'MANUAL_REQUIRED') {
          if (
            payrollWeek.start !== expectedWeekStart ||
            payrollWeek.end !== expectedWeekEnd
          ) {
            setError(
              'The uploaded attendance file is for a different week. Please upload the correct file for this payroll run.'
            )
            setUploadPhase('idle')
            return
          }
        }
      }

      if (payrollWeek.source === 'MANUAL_REQUIRED') {
        onWeekRequired(storageKey, fileName, fileType)
        setUploadPhase('idle')
        return
      }

      const needsVerification = records.some(
        (r) =>
          r.matchStatus === 'UNMATCHED' ||
          r.matchStatus === 'INACTIVE' ||
          r.matchStatus === 'RESIGNED_BEFORE_WEEK'
      )

      if (needsVerification) {
        onVerificationRequired({
          records,
          summary,
          payrollWeekStartDate: payrollWeek.start,
          payrollWeekEndDate: payrollWeek.end,
          payrollWeekSource: payrollWeek.source,
          storageKey,
          fileName,
          fileType,
        })
        setUploadPhase('idle')
        return
      }

      // No verification needed — finalize immediately
      const finalResult = await finalizeAttendanceUploadAction({
        storageKey,
        fileName,
        fileType,
        payrollWeekStartDate: payrollWeek.start,
        payrollWeekEndDate: payrollWeek.end,
        payrollWeekSource: payrollWeek.source,
      })

      if (!finalResult.ok) {
        setError(finalResult.error)
        setUploadPhase('idle')
        return
      }

      if (onUploadSuccess) {
        onUploadSuccess(finalResult.data.uploadId)
        setUploadPhase('idle')
        return
      }

      startTransition(() => {
        router.push(`/attendance/${finalResult.data.uploadId}/preview`)
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload attendance file. Please try again.'
      )
      setUploadPhase('idle')
    }
  }, [
    selectedFile,
    router,
    startTransition,
    onWeekRequired,
    onVerificationRequired,
    expectedWeekStart,
    expectedWeekEnd,
    onUploadSuccess,
  ])

  const isOver = dragState === 'over'

  return (
    <div className="pt-8 border-t border-zinc-200/60">
      <p className="text-sm font-medium text-zinc-900 mb-4">Upload New Attendance</p>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isBusy && inputRef.current?.click()}
        className={[
          'rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300',
          isOver
            ? 'border-emerald-400 bg-emerald-50/20 scale-[1.01]'
            : 'border-zinc-200 bg-zinc-50/50 hover:border-emerald-400 hover:bg-emerald-50/20',
          !selectedFile && !isBusy ? 'cursor-pointer' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          id="attendance-dropzone-trigger"
          type="file"
          accept=".xls,.xlsx"
          className="hidden"
          onChange={handleInputChange}
          disabled={isBusy}
        />

        {!selectedFile && !isBusy ? (
          <div className="flex flex-col items-center gap-2">
            <UploadSimple size={32} className="text-zinc-300 mb-1" />
            <p className="text-sm font-medium text-zinc-600">
              Drag and drop your attendance file here
            </p>
            <p className="text-xs text-zinc-400">or click to browse</p>
            <p className="text-xs text-zinc-300 mt-1">Supported: .xls, .xlsx</p>
          </div>
        ) : isBusy ? (
          <div className="flex flex-col items-center gap-3">
            {uploadPhase === 'uploading' ? (
              <>
                <CloudArrowUp size={32} className="text-emerald-500 mb-1" />
                <p className="text-sm font-medium text-zinc-600">Uploading file…</p>
                {/* Progress bar */}
                <div className="w-full max-w-xs bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-400">{uploadProgress}%</p>
              </>
            ) : (
              <>
                <SpinnerGap size={32} className="text-emerald-500 mb-1 animate-spin" />
                <p className="text-sm font-medium text-zinc-600">Matching employees…</p>
                <p className="text-xs text-zinc-400">This takes a moment for large files</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3 min-w-0">
              <FileXls size={24} className="text-emerald-500 flex-shrink-0" />
              <span className="text-sm font-mono text-zinc-700 truncate">{selectedFile!.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClearFile()
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200/60 rounded-xl px-4 py-3">
          <WarningCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && !isBusy && (
        <button
          onClick={handleUpload}
          className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-all duration-150"
        >
          Upload &amp; Preview
        </button>
      )}
    </div>
  )
}
