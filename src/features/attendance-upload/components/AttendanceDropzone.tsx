'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadSimple,
  SpinnerGap,
  WarningCircle,
  FileXls,
  X,
} from '@phosphor-icons/react'
import { parseAttendanceFileAction } from '@/features/attendance-upload/actions/attendance.actions'
import type { MatchedAttendanceRecord, PayrollWeekSource, ImportSummary } from '@/features/attendance-upload/types/attendance.types'

type DragState = 'idle' | 'over'

interface VerificationRequiredPayload {
  records: MatchedAttendanceRecord[]
  summary: ImportSummary
  payrollWeekStartDate: string
  payrollWeekEndDate: string
  payrollWeekSource: PayrollWeekSource
  tempFilePath: string
  fileName: string
  fileType: string
}

interface AttendanceDropzoneProps {
  onWeekRequired: (tempFilePath: string, fileName: string, fileType: string) => void
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
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return
    setParsing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const result = await parseAttendanceFileAction(formData)

      if (!result.ok) {
        setError(result.error)
        return
      }

      const { payrollWeek, tempFilePath, fileName, fileType, records, summary } = result.data

      if (expectedWeekStart && expectedWeekEnd) {
        if (payrollWeek.source !== 'MANUAL_REQUIRED') {
          if (payrollWeek.start !== expectedWeekStart || payrollWeek.end !== expectedWeekEnd) {
            setError('The uploaded attendance file is for a different week. Please upload the correct file for this payroll run.')
            return
          }
        }
      }

      if (payrollWeek.source === 'MANUAL_REQUIRED') {
        onWeekRequired(tempFilePath, fileName, fileType)
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
          tempFilePath,
          fileName,
          fileType,
        })
        return
      }

      // Finalize and navigate to preview
      const { finalizeAttendanceUploadAction } = await import('@/features/attendance-upload/actions/attendance.actions')
      const finalResult = await finalizeAttendanceUploadAction({
        ...result.data,
        payrollWeekStartDate: payrollWeek.start,
        payrollWeekEndDate: payrollWeek.end,
        payrollWeekSource: payrollWeek.source,
      })

      if (!finalResult.ok) {
        setError(finalResult.error)
        return
      }

      if (onUploadSuccess) {
        onUploadSuccess(finalResult.data.uploadId)
        return
      }

      startTransition(() => {
        router.push(`/attendance/${finalResult.data.uploadId}/preview`)
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to parse attendance file. Please try again.'
      )
    } finally {
      setParsing(false)
    }
  }, [selectedFile, router, startTransition, onWeekRequired, onVerificationRequired, expectedWeekStart, expectedWeekEnd, onUploadSuccess])

  const isOver = dragState === 'over'

  return (
    <div className="pt-8 border-t border-zinc-200/60">
      <p className="text-sm font-medium text-zinc-900 mb-4">Upload New Attendance</p>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={[
          'rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300',
          isOver
            ? 'border-emerald-400 bg-emerald-50/20 scale-[1.01]'
            : 'border-zinc-200 bg-zinc-50/50 hover:border-emerald-400 hover:bg-emerald-50/20',
          !selectedFile ? 'cursor-pointer' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          id="attendance-dropzone-trigger"
          type="file"
          accept=".xls,.xlsx"
          className="hidden"
          onChange={handleInputChange}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <UploadSimple size={32} className="text-zinc-300 mb-1" />
            <p className="text-sm font-medium text-zinc-600">
              Drag and drop your attendance file here
            </p>
            <p className="text-xs text-zinc-400">or click to browse</p>
            <p className="text-xs text-zinc-300 mt-1">Supported: .xls, .xlsx</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3 min-w-0">
              <FileXls size={24} className="text-emerald-500 flex-shrink-0" />
              <span className="text-sm font-mono text-zinc-700 truncate">{selectedFile.name}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleClearFile() }}
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
      {selectedFile && !parsing && (
        <button
          onClick={handleUpload}
          className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-all duration-150"
        >
          Parse &amp; Preview
        </button>
      )}

      {parsing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <SpinnerGap size={16} className="animate-spin" />
          <span>Parsing attendance file&hellip;</span>
        </div>
      )}
    </div>
  )
}
