'use client'

import { useState, useCallback } from 'react'
import { WarningCircle, X } from '@phosphor-icons/react'

interface WeekSelectionDialogProps {
  onConfirm: (startDate: string, endDate: string) => void
  onCancel: () => void
}

function isStandardWeek(start: string, end: string): boolean {
  if (!start || !end) return true
  const startDay = new Date(start + 'T00:00:00Z').getUTCDay()
  const endDay = new Date(end + 'T00:00:00Z').getUTCDay()
  return startDay === 4 && endDay === 3
}

export function WeekSelectionDialog({ onConfirm, onCancel }: WeekSelectionDialogProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const nonStandard = startDate && endDate && !isStandardWeek(startDate, endDate)
  const canConfirm = Boolean(startDate && endDate)

  const handleConfirm = useCallback(() => {
    if (canConfirm) onConfirm(startDate, endDate)
  }, [canConfirm, startDate, endDate, onConfirm])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Select Payroll Week</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed mb-5">
          We couldn&apos;t detect the payroll week from the uploaded file. Please select dates manually.
        </p>

        {/* Form */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Week Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-zinc-200/60 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Week End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-zinc-200/60 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Non-standard week warning */}
        {nonStandard && (
          <div className="mt-4 flex items-start gap-2.5 bg-amber-50/50 border border-amber-200 rounded-xl p-3">
            <WarningCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Standard payroll week runs Thursday to Wednesday.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
