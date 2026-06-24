'use client'

import { useState, useCallback } from 'react'
import { Warning, SpinnerGap } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { bulkUpdateStatusAction } from '@/features/employee-management/actions/employee.actions'
import type { EmployeeListItem } from '@/features/employee-management/types/employee.types'

interface BulkInactiveDialogProps {
  employees: EmployeeListItem[]
  onClose: () => void
  onComplete: () => void
}

export function BulkInactiveDialog({ employees, onClose, onComplete }: BulkInactiveDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const alreadyInactive = employees.filter((e) => !e.isActive)
  const willChange = employees.filter((e) => e.isActive)

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true)

    const result = await bulkUpdateStatusAction({
      ids: employees.map((e) => e.id),
      status: 'INACTIVE',
    })

    setIsProcessing(false)

    if (result.ok) {
      const { succeeded, skipped, failed } = result.data
      if (failed === 0) {
        let msg = `${succeeded} employee${succeeded !== 1 ? 's' : ''} marked as inactive`
        if (skipped > 0) msg += `, ${skipped} already inactive`
        toast.success(msg)
      } else {
        toast.warning(`${succeeded} succeeded, ${failed} failed`)
      }
    } else {
      toast.error(result.error)
    }

    onComplete()
  }, [employees, onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-inactive-title"
    >
      {/* Backdrop */}
      <div
        className="dialog-backdrop absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Panel */}
      <div className="dialog-enter relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200/60">
        {/* Icon badge */}
        <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-50">
          <Warning size={20} weight="fill" className="text-amber-500" />
        </div>

        {/* Title */}
        <h2 id="bulk-inactive-title" className="text-base font-semibold text-zinc-900 mb-2">
          Mark {employees.length} employee{employees.length !== 1 ? 's' : ''} as Inactive?
        </h2>

        {/* Description */}
        <p className="text-sm text-zinc-500 mb-4">
          Inactive employees will be excluded from future payroll processing.
        </p>

        {/* Employee list */}
        <div className="max-h-[180px] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-100 p-3 mb-4 scrollbar-thin scrollbar-thumb-zinc-200">
          {willChange.map((emp) => (
            <div key={emp.id} className="flex items-center gap-2 py-1">
              <span className="font-mono text-xs text-zinc-400">{emp.employeeId}</span>
              <span className="text-sm text-zinc-700">{emp.employeeName}</span>
            </div>
          ))}
          {alreadyInactive.length > 0 && (
            <>
              <div className="border-t border-zinc-100 my-2" />
              <p className="text-xs text-zinc-400 mb-1">Already inactive — will be skipped:</p>
              {alreadyInactive.map((emp) => (
                <div key={emp.id} className="flex items-center gap-2 py-1 opacity-50">
                  <span className="font-mono text-xs text-zinc-400">{emp.employeeId}</span>
                  <span className="text-sm text-zinc-500 line-through">{emp.employeeName}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Processing state */}
        {isProcessing && (
          <div className="mb-4">
            <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-amber-500 progress-pulse"
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-sm text-zinc-500 text-center mt-2">
              Processing...
            </p>
          </div>
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
            disabled={isProcessing || willChange.length === 0}
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
            id="bulk-inactive-confirm"
          >
            {isProcessing && <SpinnerGap size={14} className="animate-spin" />}
            {isProcessing ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
