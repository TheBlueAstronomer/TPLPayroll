'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadSimple,
  FileXls,
  X,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react'
import { parseImportFileAction } from '@/features/employee-import-export/actions/import-export.actions'

interface ImportDialogProps {
  onClose: () => void
}

type DragState = 'idle' | 'over'
type UploadState = 'idle' | 'parsing' | 'error'

export function ImportDialog({ onClose }: ImportDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragState, setDragState] = useState<DragState>('idle')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setErrorMessage(null)
    setUploadState('idle')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragState('over')
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragState('idle')
  }, [])

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

  const handleUpload = useCallback(() => {
    if (!selectedFile) return

    setUploadState('parsing')
    setErrorMessage(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const result = await parseImportFileAction(formData)

      if (!result.ok) {
        setUploadState('error')
        setErrorMessage(result.error)
        return
      }

      // Navigate to preview page with state encoded in URL search params
      // Store preview data in sessionStorage to avoid URL length limits
      sessionStorage.setItem(
        'importPreviewData',
        JSON.stringify({
          parseResult: result.data.parseResult,
          tempPath: result.data.tempPath,
          fileName: result.data.fileName,
        })
      )
      router.push('/employees/import/preview')
    })
  }, [selectedFile, router])

  const isLoading = uploadState === 'parsing' || isPending

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <h2
              id="import-dialog-title"
              className="text-lg font-semibold tracking-tight text-zinc-900"
            >
              Import Employee Master
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors -mt-0.5 -mr-1"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed mb-5">
            Upload an .xlsx file with the sheet{' '}
            <span className="font-medium text-zinc-700">&apos;Employee Master List&apos;</span> to import employees.
          </p>

          {/* Dropzone */}
          {!selectedFile ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                'rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300',
                dragState === 'over'
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : 'border-zinc-200 bg-zinc-50/50 hover:border-emerald-400 hover:bg-emerald-50/20',
              ].join(' ')}
            >
              <UploadSimple size={32} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-600">Drag and drop your file here</p>
              <p className="text-xs text-zinc-400 mt-1">or click to browse</p>
              <p className="text-xs text-zinc-300 mt-2">Supported: .xlsx</p>
            </div>
          ) : (
            /* Selected file state */
            <div className="flex items-center gap-3 bg-emerald-50/50 rounded-xl p-3 border border-emerald-200/50">
              <FileXls size={20} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-zinc-700 flex-1 truncate">
                {selectedFile.name}
              </span>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setErrorMessage(null)
                  setUploadState('idle')
                  if (inputRef.current) inputRef.current.value = ''
                }}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="sr-only"
            onChange={handleInputChange}
          />

          {/* Error message */}
          {uploadState === 'error' && errorMessage && (
            <div className="mt-3 flex items-start gap-2 text-rose-600">
              <WarningCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="relative inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors active:scale-[0.98] overflow-hidden"
            >
              {isLoading ? (
                <>
                  <SpinnerGap size={16} className="animate-spin shrink-0" />
                  Parsing…
                  {/* Shimmer bar */}
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_ease_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  )
}
