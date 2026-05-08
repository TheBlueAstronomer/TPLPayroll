'use client'

import { useState, useTransition } from 'react'
import { Check, X, Info } from '@phosphor-icons/react'
import {
  approveAdjustmentApplicationAction,
  skipAdjustmentApplicationAction,
} from '@/features/payroll-adjustments/actions/adjustment.actions'
import type { WeeklyReviewItem } from '@/features/payroll-adjustments/types/adjustment.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)
}

function formatWeek(start: Date) {
  return new Date(start).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Row action state ─────────────────────────────────────────────────────────

type RowAction = 'APPROVED' | 'SKIPPED' | null

// ─── AdjustmentReviewTable ────────────────────────────────────────────────────

interface Props {
  items: WeeklyReviewItem[]
  weekStartDate: Date
  weekEndDate: Date
  onComplete?: (decisions: Record<string, RowAction>) => void
}

export function AdjustmentReviewTable({ items, weekStartDate, weekEndDate, onComplete }: Props) {
  const [, startTransition] = useTransition()
  const [decisions, setDecisions] = useState<Record<string, RowAction>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const allActioned = items.length > 0 && items.every((item) => decisions[item.applicationId] != null)

  const handleApprove = (applicationId: string) => {
    setPending((p) => ({ ...p, [applicationId]: true }))
    startTransition(async () => {
      const result = await approveAdjustmentApplicationAction(applicationId)
      setPending((p) => ({ ...p, [applicationId]: false }))
      if (result.ok) {
        setDecisions((d) => ({ ...d, [applicationId]: 'APPROVED' }))
      }
    })
  }

  const handleSkip = (applicationId: string) => {
    setPending((p) => ({ ...p, [applicationId]: true }))
    startTransition(async () => {
      const result = await skipAdjustmentApplicationAction(applicationId)
      setPending((p) => ({ ...p, [applicationId]: false }))
      if (result.ok) {
        setDecisions((d) => ({ ...d, [applicationId]: 'SKIPPED' }))
      }
    })
  }

  const handleApproveAll = () => {
    items
      .filter((item) => decisions[item.applicationId] == null)
      .forEach((item) => handleApprove(item.applicationId))
  }

  const handleSkipAll = () => {
    items
      .filter((item) => decisions[item.applicationId] == null)
      .forEach((item) => handleSkip(item.applicationId))
  }

  return (
    <div className="space-y-6">
      {/* ── Step header ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Review Adjustments
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {formatWeek(weekStartDate)} – {formatWeek(weekEndDate)}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/60 bg-zinc-50/50 px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">No pending adjustments for this week.</p>
        </div>
      ) : (
        <>
          {/* ── Bulk actions ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleApproveAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              <Check size={14} weight="bold" />
              Approve All
            </button>
            <button
              type="button"
              onClick={handleSkipAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              <X size={14} weight="bold" />
              Skip All
            </button>
          </div>

          {/* ── Table ─────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50/50">
                <tr>
                  {['Employee', 'Type', 'Amount', 'Reason', 'Action'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400 ${
                        h === 'Action' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((item) => {
                  const decision = decisions[item.applicationId]
                  const isLoading = pending[item.applicationId]
                  const isApproved = decision === 'APPROVED'
                  const isSkipped = decision === 'SKIPPED'

                  return (
                    <tr
                      key={item.applicationId}
                      className={[
                        'transition-colors',
                        isApproved ? 'bg-emerald-50/50' : '',
                        isSkipped ? 'bg-zinc-50' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {/* Employee */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`text-sm font-medium ${isSkipped ? 'text-zinc-400' : 'text-zinc-900'}`}
                          >
                            {item.employeeName}
                          </span>
                          <span className="font-mono text-xs text-zinc-400">{item.employeeCode}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        {item.adjustmentType === 'DEDUCTION' ? (
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                            Deduction
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Addition
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono tabular-nums text-sm ${
                            isSkipped ? 'text-zinc-400 line-through' : 'text-zinc-900'
                          }`}
                        >
                          ₹{formatAmount(item.appliedAmount)}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3">
                        <span className={`text-sm ${isSkipped ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {item.reason}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {decision == null ? (
                            <>
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleApprove(item.applicationId)}
                                aria-label="Approve"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] disabled:opacity-40"
                              >
                                <Check size={16} weight="bold" />
                              </button>
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleSkip(item.applicationId)}
                                aria-label="Skip"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 active:scale-[0.98] disabled:opacity-40"
                              >
                                <X size={16} weight="bold" />
                              </button>
                            </>
                          ) : (
                            <span
                              className={`text-xs font-medium ${
                                isApproved ? 'text-emerald-600' : 'text-zinc-400'
                              }`}
                            >
                              {isApproved ? 'Approved' : 'Skipped'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Info alert ────────────────────────────────────────────────── */}
          <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200/60 bg-zinc-50 p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-zinc-400" />
            <p className="text-sm text-zinc-500">
              Skipped adjustments will carry forward to the next week.
            </p>
          </div>

          {/* ── Continue button ───────────────────────────────────────────── */}
          {onComplete && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!allActioned}
                onClick={() => onComplete(decisions)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue to Payroll Summary
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
