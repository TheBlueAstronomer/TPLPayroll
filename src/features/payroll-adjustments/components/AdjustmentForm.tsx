'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  MagnifyingGlass,
  SpinnerGap,
  CheckCircle,
} from '@phosphor-icons/react'
import { createAdjustmentAction } from '@/features/payroll-adjustments/actions/adjustment.actions'
import { getEmployeeListAction } from '@/features/employee-management/actions/employee.actions'
import type { EmployeeListItem } from '@/features/employee-management/types/employee.types'

// ─── Payroll week helper ──────────────────────────────────────────────────────

interface PayrollWeek {
  startDate: Date
  endDate: Date
  label: string
  value: string
}

function generatePayrollWeeks(): PayrollWeek[] {
  const weeks: PayrollWeek[] = []
  const today = new Date()
  // Thursday = 4. Find most recent Thursday.
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

// ─── Form schema (string-based for HTML inputs) ───────────────────────────────

const FormSchema = z
  .object({
    employeeId: z.string().min(1, 'Select an employee'),
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

// ─── Field label ──────────────────────────────────────────────────────────────

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

// ─── AdjustmentForm ───────────────────────────────────────────────────────────

export function AdjustmentForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [empSearch, setEmpSearch] = useState('')
  const [empOpen, setEmpOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const weeks = generatePayrollWeeks()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      adjustmentType: 'DEDUCTION',
      recurrenceType: 'ONE_TIME',
      weekValue: weeks[0]?.value ?? '',
    },
  })

  const recurrenceType = watch('recurrenceType')
  const recurrenceEndType = watch('recurrenceEndType')

  // Fetch employees for combobox
  useEffect(() => {
    const t = setTimeout(async () => {
      const result = await getEmployeeListAction({
        search: empSearch || undefined,
        limit: 20,
        status: 'ACTIVE',
      })
      if (result.ok) setEmployees(result.data.employees)
    }, 200)
    return () => clearTimeout(t)
  }, [empSearch])

  const selectEmployee = (emp: EmployeeListItem) => {
    setSelectedEmployee(emp)
    setValue('employeeId', emp.id, { shouldValidate: true })
    setEmpOpen(false)
    setEmpSearch('')
  }

  const onSubmit = (values: FormValues) => {
    setSubmitError(null)

    // Find week object
    const week = weeks.find((w) => w.value === values.weekValue)
    const endWeek = values.endWeekValue ? weeks.find((w) => w.value === values.endWeekValue) : null

    if (!week) return

    startTransition(async () => {
      const result = await createAdjustmentAction({
        employeeId: values.employeeId,
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
        setTimeout(() => router.push('/adjustments'), 1200)
      } else {
        setSubmitError(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <CheckCircle size={48} weight="fill" className="text-emerald-500" />
        <p className="text-lg font-medium text-zinc-900">Adjustment saved</p>
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
        Back to adjustments
      </button>

      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">
        New Payroll Adjustment
      </h1>

      {/* ── Section: Employee ────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200/60 pt-8 pb-8">
        <h2 className="mb-5 text-sm font-semibold text-zinc-700">Employee</h2>

        <div className="max-w-sm">
          <Label>Employee *</Label>

          {/* Hidden field for form validation */}
          <input type="hidden" {...register('employeeId')} />

          {selectedEmployee ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-500">{selectedEmployee.employeeId}</span>
                <span className="text-sm text-zinc-900">{selectedEmployee.employeeName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployee(null)
                  setValue('employeeId', '', { shouldValidate: false })
                }}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  placeholder="Search employee…"
                  value={empSearch}
                  onChange={(e) => { setEmpSearch(e.target.value); setEmpOpen(true) }}
                  onFocus={() => setEmpOpen(true)}
                  onBlur={() => setTimeout(() => setEmpOpen(false), 150)}
                  className="w-full rounded-xl border border-zinc-200/60 bg-zinc-50 py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {empOpen && employees.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-1.5 w-full rounded-xl border border-zinc-200/60 bg-white py-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onMouseDown={() => selectEmployee(emp)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50"
                    >
                      <span className="font-mono text-xs text-zinc-400">{emp.employeeId}</span>
                      <span className="text-sm text-zinc-900">{emp.employeeName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <FieldError message={errors.employeeId?.message} />
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
            <Label htmlFor="amount">Amount (₹) *</Label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register('amount')}
              className="w-full rounded-xl border border-zinc-200/60 bg-white px-4 py-2 font-mono tabular-nums text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <FieldError message={errors.amount?.message} />
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <textarea
              id="reason"
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
            <Label htmlFor="weekValue">Payroll Week *</Label>
            <select
              id="weekValue"
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
                <Label htmlFor="weekValue">Start Week *</Label>
                <select
                  id="weekValue"
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
                <Label htmlFor="recurrenceEndType">End Condition *</Label>
                <select
                  id="recurrenceEndType"
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

            {/* Conditional sub-fields */}
            {recurrenceEndType === 'END_WEEK' && (
              <div className="max-w-xs">
                <Label htmlFor="endWeekValue">End Week *</Label>
                <select
                  id="endWeekValue"
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
                <Label htmlFor="totalRecurrenceWeeks">Total Weeks *</Label>
                <input
                  id="totalRecurrenceWeeks"
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
                <Label htmlFor="totalBalance">Total Balance (₹) *</Label>
                <input
                  id="totalBalance"
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
            'Save Adjustment'
          )}
        </button>
      </div>
    </form>
  )
}
