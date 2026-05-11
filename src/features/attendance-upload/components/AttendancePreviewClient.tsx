'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  WarningCircle,
  Prohibit,
  ArrowLeft,
  Info,
} from '@phosphor-icons/react'
import type { AttendancePreviewData } from '@/features/attendance-upload/actions/attendance.actions'

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmtWeek(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

// ─── Status cell ──────────────────────────────────────────────────────────────

type MatchStatus =
  | 'MATCHED'
  | 'MANUALLY_MATCHED'
  | 'UNMATCHED'
  | 'INACTIVE'
  | 'RESIGNED_BEFORE_WEEK'
  | 'REJECTED_UNMATCHED'
type VerificationDecision = 'APPROVED' | 'REJECTED'

function MatchStatusCell({ status, verificationDecision }: { status: MatchStatus; verificationDecision?: VerificationDecision | null }) {
  if (status === 'MATCHED' || status === 'MANUALLY_MATCHED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
        <CheckCircle size={14} className="text-emerald-500" />
        {status === 'MANUALLY_MATCHED' ? 'Matched (manual)' : 'Matched'}
      </span>
    )
  }
  if (status === 'UNMATCHED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-rose-600">
        <XCircle size={14} className="text-rose-500" />
        Unmatched
      </span>
    )
  }
  if (status === 'REJECTED_UNMATCHED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
        <Prohibit size={14} className="text-zinc-400" />
        Rejected
      </span>
    )
  }
  if (status === 'INACTIVE') {
    return (
      <div className="inline-flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
          <WarningCircle size={14} className="text-amber-500" />
          Inactive
        </span>
        {verificationDecision && (
          <span className={`text-xs px-2 py-0.5 rounded ${verificationDecision === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {verificationDecision === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
          </span>
        )}
      </div>
    )
  }
  return (
    <div className="inline-flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
        <WarningCircle size={14} className="text-amber-500" />
        Resigned
      </span>
      {verificationDecision && (
        <span className={`text-xs px-2 py-0.5 rounded ${verificationDecision === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {verificationDecision === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
        </span>
      )}
    </div>
  )
}

// ─── AttendancePreviewClient ──────────────────────────────────────────────────

interface PreviewRecord {
  id: string
  employeeName: string
  employeeId: string
  totalRegularHours: number
  totalOvertimeHours: number
  sourceSheetName: string | null
  matchStatus?: MatchStatus
  isBlocking?: boolean
  verificationDecision?: VerificationDecision | null
}

interface AttendancePreviewClientProps {
  data: AttendancePreviewData
  isBlocked: boolean
  total: number
  matched: number
  unmatched: number
  excluded: number
  records: PreviewRecord[]
}

export function AttendancePreviewClient({
  data,
  isBlocked,
  total,
  matched,
  unmatched,
  excluded,
  records,
}: AttendancePreviewClientProps) {
  const router = useRouter()
  const { upload } = data
  const weekLabel = fmtWeek(upload.payrollWeekStartDate, upload.payrollWeekEndDate)

  return (
    <div className="space-y-6">
      {/* ── Back + header ────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/attendance"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to attendance
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Attendance Preview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{weekLabel}</p>
      </div>

      {/* ── Status banner ────────────────────────────────────────────────── */}
      {isBlocked ? (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200/60 rounded-xl p-4">
          <Prohibit size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Payroll Blocked</p>
            <p className="text-sm text-rose-600 mt-0.5">
              {[
                unmatched > 0 && `${unmatched} unmatched`,
              ]
                .filter(Boolean)
                .join(', ') || 'Blocking issues found'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200/60 rounded-xl p-4">
          <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">Ready for Payroll</p>
            <p className="text-sm text-emerald-600 mt-0.5">All employees matched</p>
          </div>
        </div>
      )}

      {/* ── Summary strip ────────────────────────────────────────────────── */}
      <div className="flex divide-x divide-zinc-200 border-t border-b border-zinc-200/60 py-4">
        {[
          { label: 'Total', value: total, highlight: false },
          { label: 'Matched', value: matched, highlight: false },
          { label: 'Unmatched', value: unmatched, highlight: unmatched > 0 },
          { label: 'Excluded', value: excluded, highlight: false },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex-1 px-4 first:pl-0 last:pr-0">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
            <p
              className={[
                'text-lg font-mono tabular-nums font-semibold',
                highlight ? 'text-rose-600' : 'text-zinc-900',
              ].join(' ')}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Attendance table ──────────────────────────────────────────────── */}
      <div>
        <table className="w-full divide-y divide-zinc-100">
          <thead>
            <tr>
              {['Employee', 'Status', 'Reg Hrs', 'OT Hrs', 'Sheet'].map((h) => (
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
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="py-3 pr-4 text-sm text-zinc-900">{r.employeeName}</td>
                <td className="py-3 pr-4">
                  <MatchStatusCell status={(r.matchStatus as MatchStatus) ?? 'MATCHED'} verificationDecision={r.verificationDecision} />
                </td>
                <td className="py-3 pr-4 font-mono tabular-nums text-sm text-zinc-800">
                  {r.totalRegularHours.toFixed(1)}
                </td>
                <td className="py-3 pr-4 font-mono tabular-nums text-sm text-zinc-800">
                  {r.totalOvertimeHours.toFixed(1)}
                </td>
                <td className="py-3 font-mono text-xs text-zinc-400">
                  {r.sourceSheetName ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {records.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">No records found for this upload.</p>
        )}
      </div>

      {/* ── Help text ────────────────────────────────────────────────────── */}
      {isBlocked && (
        <div className="flex items-start gap-2.5 text-sm text-zinc-500">
          <Info size={16} className="text-zinc-400 flex-shrink-0 mt-0.5" />
          <p>
            To resolve: update the employee directory or upload a corrected attendance file.
          </p>
        </div>
      )}

      {/* ── Back action ──────────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          onClick={() => router.push('/attendance')}
          className="text-sm text-zinc-500 hover:text-zinc-800 underline underline-offset-2 transition-colors"
        >
          Back to uploads
        </button>
      </div>
    </div>
  )
}
