'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Warning } from '@phosphor-icons/react'
import { updateEmployeeAction } from '@/features/employee-management/actions/employee.actions'

interface DeactivateDialogProps {
  employeeId: string
  employeeName: string
  isCurrentlyActive: boolean
}

export function DeactivateDialog({
  employeeId,
  employeeName,
  isCurrentlyActive,
}: DeactivateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = isCurrentlyActive ? 'Deactivate' : 'Reactivate'
  const newState = !isCurrentlyActive

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await updateEmployeeAction(employeeId, { isActive: newState })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors duration-200 active:scale-[0.98] ${
          isCurrentlyActive
            ? 'border-rose-200 text-rose-600 hover:bg-rose-50 bg-white'
            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white'
        }`}
      >
        {action}
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-zinc-200/60">
            {/* Icon */}
            <div className={`mb-4 inline-flex items-center justify-center w-10 h-10 rounded-full ${
              isCurrentlyActive ? 'bg-rose-50' : 'bg-emerald-50'
            }`}>
              <Warning
                size={20}
                weight="fill"
                className={isCurrentlyActive ? 'text-rose-500' : 'text-emerald-600'}
              />
            </div>

            <h2
              id="deactivate-title"
              className="text-base font-semibold text-zinc-900 mb-2"
            >
              {action} {employeeName}?
            </h2>

            <p className="text-sm text-zinc-500 mb-6">
              {isCurrentlyActive
                ? 'This employee will be excluded from future payroll runs. They will remain visible in the directory.'
                : 'This employee will be included in future payroll runs again.'}
            </p>

            {error && (
              <p className="text-xs text-rose-600 mb-4">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200/60 rounded-xl hover:bg-zinc-50 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors duration-200 active:scale-[0.98] disabled:opacity-70 ${
                  isCurrentlyActive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isPending ? 'Saving…' : `Confirm ${action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
