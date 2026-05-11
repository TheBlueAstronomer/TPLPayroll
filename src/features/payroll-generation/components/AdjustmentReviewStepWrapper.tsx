'use client'

import { AdjustmentReviewTable } from '@/features/payroll-adjustments/components/AdjustmentReviewTable'
import type { WeeklyReviewItem } from '@/features/payroll-adjustments/types/adjustment.types'
import { ArrowRight } from '@phosphor-icons/react'

interface Props {
  weekStart: Date
  weekEnd: Date
  adjustments: WeeklyReviewItem[]
  onContinue: () => void
}

export function AdjustmentReviewStepWrapper({ weekStart, weekEnd, adjustments, onContinue }: Props) {
  if (adjustments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Review Adjustments</h2>
          <p className="mt-1 text-sm text-zinc-500">No pending adjustments for this week.</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
          >
            Continue to Summary
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdjustmentReviewTable
      items={adjustments}
      weekStartDate={weekStart}
      weekEndDate={weekEnd}
      onComplete={onContinue}
    />
  )
}
