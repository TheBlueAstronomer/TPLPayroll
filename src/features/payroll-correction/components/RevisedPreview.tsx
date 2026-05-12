'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, CircleNotch } from '@phosphor-icons/react'
import type { RevisedEmployeeRow } from '@/features/payroll-correction/types/correction.types'
import type { PayrollSummaryTotals } from '@/features/payroll-generation/types/payroll.types'
import { approveRevisionAction } from '@/features/payroll-correction/actions/correction.actions'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RevisedPreviewProps {
  payrollRunId: string
  revisionId: string
  revisionNumber: number
  weekLabel: string
  employees: RevisedEmployeeRow[]
  totals: PayrollSummaryTotals
  previousTotals: PayrollSummaryTotals | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function DiffValue({
  current,
  previous,
  prefix = '₹',
}: {
  current: number
  previous: number | null
  prefix?: string
}) {
  if (previous === null || current === previous) {
    return <span>{prefix}{formatCurrency(current)}</span>
  }

  const increased = current > previous
  return (
    <span className="group relative">
      <span className={increased ? 'text-emerald-600' : 'text-rose-600'}>
        {prefix}{formatCurrency(current)}
      </span>
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        Previous: {prefix}{formatCurrency(previous)}
      </span>
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RevisedPreview({
  payrollRunId,
  revisionId,
  revisionNumber,
  weekLabel,
  employees,
  totals,
  previousTotals,
}: RevisedPreviewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleApprove() {
    startTransition(async () => {
      const res = await approveRevisionAction(revisionId)
      if (res.ok) {
        router.push(`/payroll/run/${payrollRunId}`)
        router.refresh()
      } else {
        setError(res.error)
        setShowConfirm(false)
      }
    })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Revised Payroll
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Revision {revisionNumber}
          </span>
          <span className="text-sm text-zinc-500">{weekLabel}</span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Summary table */}
      <section className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-zinc-200">
                {['ID', 'Employee', 'GPay', 'Bank', 'Net Pay'].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 last:text-right"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {employees.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-zinc-50/50">
                  <td className="py-2 pr-4 text-zinc-700">{emp.employeeCode}</td>
                  <td className="py-2 pr-4 font-sans text-zinc-900">{emp.employeeName}</td>
                  <td className="py-2 pr-4 text-zinc-500">{emp.gPay ?? '—'}</td>
                  <td className="py-2 pr-4 text-zinc-500">{emp.bankAccount ?? '—'}</td>
                  <td className="py-2 text-right font-semibold">
                    <DiffValue current={emp.netPayable} previous={emp.previousNetPayable} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200">
                <td colSpan={4} className="py-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Totals
                </td>
                <td className="py-2 text-right font-bold">
                  <DiffValue current={totals.totalNetPayable} previous={previousTotals?.totalNetPayable ?? null} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Action bar */}
      <div className="mt-8 flex items-center justify-between border-t border-zinc-200/60 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
        >
          <CheckCircle size={16} weight="bold" />
          Approve Revision
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
            <h3 className="text-base font-semibold text-zinc-900">Approve Revised Payroll?</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Approve this revised payroll? The previous revision will be superseded.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <CircleNotch size={14} className="animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Confirm Revision'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
