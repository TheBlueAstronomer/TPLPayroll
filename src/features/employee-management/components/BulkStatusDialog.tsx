'use client'

import { useState, useCallback } from 'react'
import { UserMinus, SpinnerGap } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { bulkUpdateStatusAction } from '@/features/employee-management/actions/employee.actions'
import type { EmployeeListItem } from '@/features/employee-management/types/employee.types'

interface BulkStatusDialogProps {
  employees: EmployeeListItem[]
  onClose: () => void
  onComplete: () => void
}

export function BulkStatusDialog({ employees, onClose, onComplete }: BulkStatusDialogProps) {
  const today = new Date()
  const [dateValue, setDateValue] = useState(today.toISOString().split('T')[0])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: employees.length })

  const handleConfirm = useCallback(async () => {
    if (!dateValue) {
      setError('Date of Resignation is required')
      return
    }

    setError(null)
    setIsProcessing(true)

    const result = await bulkUpdateStatusAction({
      ids: employees.map((e) => e.id),
      status: 'RESIGNED',
      dateOfResignation: new Date(dateValue),
    })

    setIsProcessing(false)

    if (result.ok) {
      const { succeeded, failed } = result.data
      if (failed === 0) {
        toast.success(`${succeeded} employee${succeeded !== 1 ? 's' : ''} marked as resigned`)
      } else {
        toast.warning(`${succeeded} succeeded, ${failed} failed`)
      }
    } else {
      toast.error(result.error)
    }

    onComplete()
  }, [dateValue, employees, onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-resign-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200/60">
        {/* Icon badge */}
        <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50">
          <UserMinus size={20} weight="fill" className="text-rose-500" />
        </div>

        {/* Title */}
        <h2 id="bulk-resign-title" className="text-base font-semibold text-zinc-900 mb-2">
          Mark {employees.length} employee{employees.length !== 1 ? 's' : ''} as Resigned?
        </h2>

        {/* Description */}
        <p className="text-sm text-zinc-500 mb-4">
          The following employees will be marked as resigned and excluded from future payroll runs.
        </p>

        {/* Employee list */}
        <div className="max-h-[180px] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-100 p-3 mb-4 scrollbar-thin scrollbar-thumb-zinc-200">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-2 py-1">
              <span className="font-mono text-xs text-zinc-400">{emp.employeeId}</span>
              <span className="text-sm text-zinc-700">{emp.employeeName}</span>
            </div>
          ))}
        </div>

        {/* Processing state */}
        {isProcessing ? (
          <div className="mb-4">
            <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-rose-500 transition-all duration-300 progress-pulse"
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-sm text-zinc-500 text-center mt-2">
              Processing {progress.current} of {progress.total}...
            </p>
          </div>
        ) : (
          <>
            {/* Date of Resignation */}
            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                Date of Resignation *
              </label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => { setDateValue(e.target.value); setError(null) }}
                className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-zinc-200/60 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-zinc-900 transition-colors duration-200"
                id="bulk-resign-date"
              />
              {error && (
                <p className="text-rose-600 text-xs mt-1">{error}</p>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
            id="bulk-resign-confirm"
          >
            {isProcessing && <SpinnerGap size={14} className="animate-spin" />}
            {isProcessing ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
