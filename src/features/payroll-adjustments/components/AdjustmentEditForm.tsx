'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  SpinnerGap,
  CheckCircle,
  LockSimple,
  Info,
} from '@phosphor-icons/react'
import { updateAdjustmentAction } from '@/features/payroll-adjustments/actions/adjustment.actions'
import type { AdjustmentDetailRecord } from '@/features/payroll-adjustments/types/adjustment.types'

// ─── Payroll week helper (duplicated from AdjustmentForm) ─────────────────────

interface PayrollWeek {
  startDate: Date
  endDate: Date
  label: string
  value: string
}

function generatePayrollWeeks(): PayrollWeek[] {
  const weeks: PayrollWeek[] = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysToLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3
  const lastThursday = new Date(today)
  lastThursday.setDate(today.getDate() - daysToLastThursday)

  // Construct anchor at 00:00:00 UTC to match system standards
  const isoStr = `${lastThursday.getFullYear()}-${String(lastThursday.getMonth() + 1).padStart(2, '0')}-${String(lastThursday.getDate()).padStart(2, '0')}`
  const anchor = new Date(`${isoStr}T00:00:00Z`)

  for (let i = -11; i <= 4; i++) {
    const start = new Date(anchor)
    start.setUTCDate(anchor.getUTCDate() + i * 7)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6)

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })

    weeks.push({
      startDate: start,
      endDate: end,
      label: `${fmt(start)} – ${fmt(end)}`,
      value: start.toISOString().split('T')[0],
    })
  }

  return weeks.reverse()
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const FormSchema = z
  .object({
    adjustmentType: z.enum(['DEDUCTION', 'ADDITION']),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Amount must be positive'),
    reason: z.string().min(1, 'Reason is required'),
    recurrenceType: z.enum(['ONE_TIME', 'RECURRING']),
    weekValue: z.string().min(1, 'Select a payroll week'),
    recurrenceEndType: z.enum(['END_WEEK', 'FIXED_WEEKS', 'TOTAL_BALANCE']).optional(),
    endWeekValue: z.string().optional(),
    totalRecurrenceWeeks: z.string().optional(),
    totalBalance: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.recurrenceType === 'RECURRING') {
      if (!data.recurrenceEndType) {
        ctx.addIssue({ code: 'custom', path: ['recurrenceEndType'], message: 'Select end condition' })
      }
      if (data.recurrenceEndType === 'END_WEEK' && !data.endWeekValue) {
        ctx.addIssue({ code: 'custom', path: ['endWeekValue'], message: 'Select end week' })
      }
      if (data.recurrenceEndType === 'FIXED_WEEKS') {
        const n = parseInt(data.totalRecurrenceWeeks ?? '')
        if (!n || n < 1) {
          ctx.addIssue({ code: 'custom', path: ['totalRecurrenceWeeks'], message: 'Enter a positive number of weeks' })
        }
      }
      if (data.recurrenceEndType === 'TOTAL_BALANCE') {
        const n = parseFloat(data.totalBalance ?? '')
        if (!n || n <= 0) {
          ctx.addIssue({ code: 'custom', path: ['totalBalance'], message: 'Enter a positive balance' })
        }
      }
    }
  })

type FormValues = z.infer<typeof FormSchema>

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5"
    >
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-rose-500">{message}</p>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateToWeekValue(date: Date): string {
  return new Date(date).toISOString().split('T')[0]
}

// ─── AdjustmentEditForm ───────────────────────────────────────────────────────

interface Props {
  adjustment: AdjustmentDetailRecord
}

export function AdjustmentEditForm({ adjustment: adj }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const weeks = generatePayrollWeeks()

  // Resolve the current start week value to match a week option
  const currentStartWeekValue = dateToWeekValue(adj.startPayrollWeekStartDate)
  const currentEndWeekValue = adj.endPayrollWeekStartDate
    ? dateToWeekValue(adj.endPayrollWeekStartDate)
    : ''

  // Ensure the existing week is always in the list (it may be older than the generated range)
  const startWeekInList = weeks.some((w) => w.value === currentStartWeekValue)
  if (!startWeekInList) {
    const start = new Date(adj.startPayrollWeekStartDate)
    const end = new Date(adj.startPayrollWeekEndDate)
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    weeks.push({
      startDate: start,
      endDate: end,
      label: `${fmt(start)} – ${fmt(end)}`,
      value: currentStartWeekValue,
    })
  }

  const hasSkippedApps = adj.applications.some((a) => a.approvalStatus === 'SKIPPED')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      adjustmentType: adj.adjustmentType,
      amount:
        adj.recurrenceEndType === 'FIXED_WEEKS' && adj.totalBalance != null
          ? String(adj.totalBalance)
          : String(adj.amount),
      reason: adj.reason,
      recurrenceType: adj.recurrenceType,
      weekValue: currentStartWeekValue,
      recurrenceEndType: adj.recurrenceEndType ?? undefined,
      endWeekValue: currentEndWeekValue || undefined,
      totalRecurrenceWeeks: adj.totalRecurrenceWeeks ? String(adj.totalRecurrenceWeeks) : undefined,
      totalBalance: adj.totalBalance ? String(adj.totalBalance) : undefined,
    },
  })

  const recurrenceType = watch('recurrenceType')
  const recurrenceEndType = watch('recurrenceEndType')
  const isFixedWeeks = recurrenceEndType === 'FIXED_WEEKS'

  const onSubmit = (values: FormValues) => {
    setSubmitError(null)

    const week = weeks.find((w) => w.value === values.weekValue)
    const endWeek = values.endWeekValue ? weeks.find((w) => w.value === values.endWeekValue) : null

    if (!week) return

    startTransition(async () => {
      const result = await updateAdjustmentAction(adj.id, {
        adjustmentType: values.adjustmentType,
        amount: parseFloat(values.amount),
        reason: values.reason,
        recurrenceType: values.recurrenceType,
        startPayrollWeekStartDate: week.startDate,
        startPayrollWeekEndDate: week.endDate,
        recurrenceEndType: values.recurrenceType === 'RECURRING' ? (values.recurrenceEndType ?? null) : null,
        endPayrollWeekStartDate: endWeek?.startDate ?? null,
        endPayrollWeekEndDate: endWeek?.endDate ?? null,
        totalRecurrenceWeeks:
          values.recurrenceEndType === 'FIXED_WEEKS'
            ? parseInt(values.totalRecurrenceWeeks ?? '0')
            : null,
        totalBalance:
          values.recurrenceEndType === 'TOTAL_BALANCE'
            ? parseFloat(values.totalBalance ?? '0')
            : null,
      })

      if (result.ok) {
        setSubmitted(true)
        setTimeout(() => router.push(`/adjustments/${adj.id}`), 1000)
      } else {
        setSubmitError(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <CheckCircle size={48} weight="fill" className="text-emerald-500" />
        <p className="text-lg font-medium text-zinc-900">Adjustment updated</p>
        <p className="text-sm text-zinc-400">Redirecting…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
      {/* ── Back link ───────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
        Edit Adjustment
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        {adj.employeeName}{' '}
        <span className="font-mono text-zinc-400">({adj.employeeCode})</span>
      </p>

      {/* ── Info banner for skipped apps ──────────────────────────────── */}
      {hasSkippedApps && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">
            This adjustment has skipped weeks. Editing the start week or amount will update the
            next pending application.
          </p>
        </div>
      )}

      {/* ── Section: Employee (read-only) ────────────────────────────────── */}
      <div className="border-t border-zinc-200/60 pt-8 pb-8">
        <h2 className="mb-5 text-sm font-semibold text-zinc-700">Employee</h2>
        <div className="max-w-sm">
          <Label>Employee</Label>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50 px-3 py-2.5">
            <LockSimple size={14} className="text-zinc-400" />
            <span className="font-mono text-xs text-zinc-500">{adj.employeeCode}</span>
            <span className="text-sm text-zinc-700">{adj.employeeName}</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">Employee cannot be changed after creation.</p>
        </div>
      </div>

      {/* ── Section: Adjustment details ───────────────────────────────────── */}
      <div className="border-t border-zinc-200/60 pt-8 pb-8">
        <h2 className="mb-5 text-sm font-semibold text-zinc-700">Adjustment Details</h2>

        {/* Type radio */}
        <div className="mb-6">
          <Label>Type *</Label>
          <div className="flex gap-6">
            {(['DEDUCTION', 'ADDITION'] as const).map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  value={t}
                  {...register('adjustmentType')}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-zinc-700">{t === 'DEDUCTION' ? 'Deduction' : 'Addition'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amount + Reason */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <div>
            <Label htmlFor="edit-amount">
              {isFixedWeeks ? 'Total Amount (₹) *' : 'Amount (₹) *'}
            </Label>
            <input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register('amount')}
              className="w-full rounded-xl border border-zinc-200/60 bg-white px-4 py-2 font-mono tabular-nums text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {isFixedWeeks && (
              <p className="mt-1 text-xs text-zinc-400">
                Will be split equally across the number of weeks
              </p>
            )}
            <FieldError message={errors.amount?.message} />
          </div>

          <div>
            <Label htmlFor="edit-reason">Reason *</Label>
            <textarea
              id="edit-reason"
              rows={2}
              placeholder="e.g. Advance recovery"
              {...register('reason')}
              className="w-full resize-none rounded-xl border border-zinc-200/60 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <FieldError message={errors.reason?.message} />
          </div>
        </div>
      </div>

      {/* ── Section: Recurrence ───────────────────────────────────────────── */}
      <div className="border-t border-zinc-200/60 pt-8 pb-8">
        <h2 className="mb-5 text-sm font-semibold text-zinc-700">Recurrence</h2>

        {/* Recurrence type radio */}
        <div className="mb-6">
          <Label>Recurrence Type *</Label>
          <div className="flex gap-6">
            {(['ONE_TIME', 'RECURRING'] as const).map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  value={r}
                  {...register('recurrenceType')}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-zinc-700">
                  {r === 'ONE_TIME' ? 'One-time' : 'Recurring'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ONE_TIME: week selector */}
        {recurrenceType === 'ONE_TIME' && (
          <div className="max-w-sm transition-all duration-200">
            <Label htmlFor="edit-weekValue">Payroll Week *</Label>
            <select
              id="edit-weekValue"
              {...register('weekValue')}
              className="w-full rounded-xl border border-zinc-200/60 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Choose week…</option>
              {weeks.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.weekValue?.message} />
          </div>
        )}

        {/* RECURRING fields */}
        {recurrenceType === 'RECURRING' && (
          <div className="space-y-5 transition-all duration-200">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              {/* Start week */}
              <div>
                <Label htmlFor="edit-startWeekValue">Start Week *</Label>
                <select
                  id="edit-startWeekValue"
                  {...register('weekValue')}
                  className="w-full rounded-xl border border-zinc-200/60 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Choose week…</option>
                  {weeks.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.weekValue?.message} />
              </div>

              {/* End condition */}
              <div>
                <Label htmlFor="edit-recurrenceEndType">End Condition *</Label>
                <select
                  id="edit-recurrenceEndType"
                  {...register('recurrenceEndType')}
                  className="w-full rounded-xl border border-zinc-200/60 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select condition…</option>
                  <option value="END_WEEK">Until end week</option>
                  <option value="FIXED_WEEKS">Fixed number of weeks</option>
                  <option value="TOTAL_BALANCE">Until balance depleted</option>
                </select>
                <FieldError message={errors.recurrenceEndType?.message} />
              </div>
            </div>

            {recurrenceEndType === 'END_WEEK' && (
              <div className="max-w-xs">
                <Label htmlFor="edit-endWeekValue">End Week *</Label>
                <select
                  id="edit-endWeekValue"
                  {...register('endWeekValue')}
                  className="w-full rounded-xl border border-zinc-200/60 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Choose week…</option>
                  {weeks.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.endWeekValue?.message} />
              </div>
            )}

            {recurrenceEndType === 'FIXED_WEEKS' && (
              <div className="max-w-[160px]">
                <Label htmlFor="edit-totalRecurrenceWeeks">Total Weeks *</Label>
                <input
                  id="edit-totalRecurrenceWeeks"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="4"
                  {...register('totalRecurrenceWeeks')}
                  className="w-full rounded-xl border border-zinc-200/60 bg-white px-4 py-2 font-mono tabular-nums text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <FieldError message={errors.totalRecurrenceWeeks?.message} />
              </div>
            )}

            {recurrenceEndType === 'TOTAL_BALANCE' && (
              <div className="max-w-[200px]">
                <Label htmlFor="edit-totalBalance">Total Balance (₹) *</Label>
                <input
                  id="edit-totalBalance"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="8000.00"
                  {...register('totalBalance')}
                  className="w-full rounded-xl border border-zinc-200/60 bg-white px-4 py-2 font-mono tabular-nums text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <FieldError message={errors.totalBalance?.message} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200/60 pt-8">
        {submitError && (
          <p className="mr-auto text-sm text-rose-500">{submitError}</p>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? (
            <>
              <SpinnerGap size={15} className="animate-spin" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}
