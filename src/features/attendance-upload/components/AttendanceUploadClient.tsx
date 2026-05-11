'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  WarningCircle,
  CalendarBlank,
  Eye,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { AttendanceDropzone } from './AttendanceDropzone'
import { WeekSelectionDialog } from './WeekSelectionDialog'
import { EmployeeVerificationDialog } from './EmployeeVerificationDialog'
import {
  parseAttendanceWithDatesAction,
  finalizeAttendanceUploadAction,
} from '@/features/attendance-upload/actions/attendance.actions'
import type { AttendanceUploadRow } from '@/features/attendance-upload/actions/attendance.actions'
import type { MatchedAttendanceRecord, PayrollWeekSource, ImportSummary, VerificationDecision } from '@/features/attendance-upload/types/attendance.types'

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmtWeek(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isReady = status === 'READY'
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full text-xs px-2 py-0.5',
        isReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      {isReady ? (
        <CheckCircle size={14} className="text-emerald-500" />
      ) : (
        <WarningCircle size={14} className="text-amber-500" />
      )}
      {isReady ? 'Ready' : 'Errors'}
    </span>
  )
}

// ─── Dialog state ─────────────────────────────────────────────────────────────

type DialogState =
  | { type: 'none' }
  | {
      type: 'week_required'
      tempFilePath: string
      fileName: string
      fileType: string
    }
  | {
      type: 'verify_required'
      records: MatchedAttendanceRecord[]
      summary: ImportSummary
      payrollWeekStartDate: string
      payrollWeekEndDate: string
      payrollWeekSource: PayrollWeekSource
      tempFilePath: string
      fileName: string
      fileType: string
    }

// ─── AttendanceUploadClient ───────────────────────────────────────────────────

interface AttendanceUploadClientProps {
  initialUploads: AttendanceUploadRow[]
}

export function AttendanceUploadClient({ initialUploads }: AttendanceUploadClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [uploads] = useState(initialUploads)
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const [processingError, setProcessingError] = useState<string | null>(null)

  const handleWeekRequired = useCallback(
    (tempFilePath: string, fileName: string, fileType: string) => {
      setDialog({ type: 'week_required', tempFilePath, fileName, fileType })
    },
    []
  )

  const handleVerificationRequired = useCallback(
    (payload: {
      records: MatchedAttendanceRecord[]
      summary: ImportSummary
      payrollWeekStartDate: string
      payrollWeekEndDate: string
      payrollWeekSource: PayrollWeekSource
      tempFilePath: string
      fileName: string
      fileType: string
    }) => {
      setDialog({ type: 'verify_required', ...payload })
    },
    []
  )

  const handleWeekConfirm = useCallback(
    async (startDate: string, endDate: string) => {
      if (dialog.type !== 'week_required') return
      const { tempFilePath, fileName, fileType } = dialog
      setDialog({ type: 'none' })
      setProcessingError(null)

      const result = await parseAttendanceWithDatesAction(
        tempFilePath,
        startDate,
        endDate,
        fileName,
        fileType
      )

      if (!result.ok) {
        setProcessingError(result.error)
        return
      }

      // Check if verification is required
      const needsVerification = result.data.records.some(
        (r) => r.matchStatus === 'INACTIVE' || r.matchStatus === 'RESIGNED_BEFORE_WEEK'
      )

      if (needsVerification) {
        setDialog({
          type: 'verify_required',
          records: result.data.records,
          summary: result.data.summary,
          payrollWeekStartDate: startDate,
          payrollWeekEndDate: endDate,
          payrollWeekSource: 'MANUAL',
          tempFilePath,
          fileName,
          fileType,
        })
        return
      }

      const finalResult = await finalizeAttendanceUploadAction({
        ...result.data,
        payrollWeekStartDate: startDate,
        payrollWeekEndDate: endDate,
        payrollWeekSource: 'MANUAL',
      })

      if (!finalResult.ok) {
        setProcessingError(finalResult.error)
        return
      }

      startTransition(() => {
        router.push(`/attendance/${finalResult.data.uploadId}/preview`)
      })
    },
    [dialog, router, startTransition]
  )

  const handleVerificationConfirm = useCallback(
    async (decisions: Record<string, VerificationDecision>) => {
      if (dialog.type !== 'verify_required') return
      const { tempFilePath, fileName, fileType, payrollWeekStartDate, payrollWeekEndDate, payrollWeekSource, records, summary } = dialog
      setDialog({ type: 'none' })
      setProcessingError(null)

      const finalResult = await finalizeAttendanceUploadAction({
        tempFilePath,
        fileName,
        fileType,
        payrollWeekStartDate,
        payrollWeekEndDate,
        payrollWeekSource,
        records,
        summary,
        verificationDecisions: decisions,
      })

      if (!finalResult.ok) {
        setProcessingError(finalResult.error)
        return
      }

      startTransition(() => {
        router.push(`/attendance/${finalResult.data.uploadId}/preview`)
      })
    },
    [dialog, router, startTransition]
  )

  const handleNavigateToPreview = useCallback(
    (uploadId: string) => startTransition(() => router.push(`/attendance/${uploadId}/preview`)),
    [router, startTransition]
  )

  return (
    <>
      {/* ── Recent uploads table ─────────────────────────────────────────── */}
      <div className="mb-2">
        <p className="text-sm font-medium text-zinc-900 mb-4">Recent Uploads</p>

        {uploads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <CalendarBlank size={48} className="text-zinc-200" />
            <p className="text-sm text-zinc-400">
              No attendance files uploaded yet. Upload your first file below.
            </p>
          </div>
        ) : (
          <table className="w-full divide-y divide-zinc-100">
            <thead>
              <tr>
                {['Week', 'File', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="pb-3 text-left text-xs uppercase tracking-wider text-zinc-400 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {uploads.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 pr-4 text-sm text-zinc-900">
                    {fmtWeek(u.payrollWeekStartDate, u.payrollWeekEndDate)}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{u.fileName}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleNavigateToPreview(u.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => document.getElementById('attendance-dropzone-trigger')?.click()}
                        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors"
                      >
                        <ArrowsClockwise size={14} />
                        Replace
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Processing error ──────────────────────────────────────────────── */}
      {processingError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200/60 rounded-xl px-4 py-3">
          <WarningCircle size={16} className="flex-shrink-0" />
          <span>{processingError}</span>
        </div>
      )}

      {/* ── Dropzone ─────────────────────────────────────────────────────── */}
      <AttendanceDropzone onWeekRequired={handleWeekRequired} onVerificationRequired={handleVerificationRequired} />

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      {dialog.type === 'week_required' && (
        <WeekSelectionDialog
          onConfirm={handleWeekConfirm}
          onCancel={() => setDialog({ type: 'none' })}
        />
      )}

      {dialog.type === 'verify_required' && (
        <EmployeeVerificationDialog
          isOpen={dialog.type === 'verify_required'}
          employees={dialog.records.filter(
            (r) => r.matchStatus === 'INACTIVE' || r.matchStatus === 'RESIGNED_BEFORE_WEEK'
          )}
          onConfirm={handleVerificationConfirm}
          onCancel={() => setDialog({ type: 'none' })}
        />
      )}
    </>
  )
}
