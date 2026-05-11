'use client'

import Link from 'next/link'
import { CheckCircle, WarningCircle, ArrowRight } from '@phosphor-icons/react'
import type { AttendanceReadinessResult } from '@/features/payroll-generation/types/payroll.types'

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-6 first:pl-0">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-900">{value}</p>
    </div>
  )
}

interface Props {
  weekLabel: string
  readiness: AttendanceReadinessResult
  onContinue: () => void
}

export function AttendanceVerificationStep({ weekLabel, readiness, onContinue }: Props) {
  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Verify Attendance</h2>
        <p className="mt-1 text-sm text-zinc-500">{weekLabel}</p>
      </div>

      {/* ── Status alert ─────────────────────────────────────────────── */}
      {!readiness.ready ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50 p-4">
          <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-amber-800">
              {readiness.reason === 'NO_UPLOAD'
                ? 'No attendance uploaded for this week'
                : 'Payroll cannot be generated — attendance has unresolved blocking errors'}
            </p>
            <Link
              href={readiness.reason === 'NO_UPLOAD' ? '/attendance' : '/attendance'}
              className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              {readiness.reason === 'NO_UPLOAD'
                ? 'Upload attendance for this week'
                : 'Go to attendance review'}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50 p-4">
            <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">
              Attendance verified — {readiness.matchedEmployeeCount} employees matched, 0 errors
            </p>
          </div>

          {/* ── Quick stats ──────────────────────────────────────────── */}
          <div className="flex divide-x divide-zinc-200/60 border-b border-t border-zinc-200/60 py-4">
            <StatBlock label="Total Employees" value={readiness.matchedEmployeeCount} />
            <StatBlock label="Total Regular Hrs" value={readiness.totalRegularHours.toFixed(1)} />
            <StatBlock label="Total Overtime Hrs" value={readiness.totalOvertimeHours.toFixed(1)} />
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
            >
              Continue
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
