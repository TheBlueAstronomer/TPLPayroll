'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SpinnerGap } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { updateSettingsAction } from '@/features/settings/actions/settings.actions'
import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type AppSettings,
  type UpdateSettingsInput,
} from '@/features/settings/types/settings.types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const UpdateSettingsSchema = z.object({
  payrollWeekStartDay: z.enum(DAYS_OF_WEEK, {
    error: 'Select a valid day',
  }),
})

type SettingsFormValues = z.infer<typeof UpdateSettingsSchema>

// ─── Day label helper ─────────────────────────────────────────────────────────

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SettingsFormProps {
  initialSettings: AppSettings
}

// ─── SettingsForm ─────────────────────────────────────────────────────────────

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit } = useForm<SettingsFormValues>({
    resolver: zodResolver(UpdateSettingsSchema),
    defaultValues: {
      payrollWeekStartDay: initialSettings.payrollWeekStartDay,
    },
  })

  const onSubmit = (data: SettingsFormValues) => {
    startTransition(async () => {
      const input: UpdateSettingsInput = {
        payrollWeekStartDay: data.payrollWeekStartDay,
      }
      const result = await updateSettingsAction(input)
      if (result.ok) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(result.error ?? 'Failed to save settings')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
      {/* ── Section 1: Payroll Configuration ─────────────────────────────── */}
      <div className="border-t border-zinc-200/60 pt-8 pb-8">
        <h2 className="text-sm font-medium text-zinc-900 mb-6">Payroll Configuration</h2>

        <div className="max-w-md">
          <label
            htmlFor="payrollWeekStartDay"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            Payroll Week Start Day
          </label>

          <select
            id="payrollWeekStartDay"
            {...register('payrollWeekStartDay')}
            className="w-full rounded-xl border border-zinc-200/60 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors duration-150"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {DAY_LABELS[day]}
              </option>
            ))}
          </select>

          <p className="text-sm text-zinc-400 mt-2 max-w-[65ch] leading-relaxed">
            This determines the default payroll week structure. Example: Thursday → payroll week runs Thu to Wed.
          </p>
        </div>
      </div>

      {/* ── Section 2: Display Defaults (read-only) ───────────────────────── */}
      <div className="border-t border-zinc-200/60 pt-8 pb-8">
        <h2 className="text-sm font-medium text-zinc-900 mb-6">Display Defaults</h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Currency</dt>
            <dd className="font-mono text-sm text-zinc-600">₹ INR</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Document Expiry Threshold
            </dt>
            <dd className="font-mono text-sm text-zinc-600 flex items-center gap-2">
              7 days
              <span className="bg-zinc-100 text-zinc-400 rounded-full text-xs px-2 py-0.5">
                Phase 2
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="pt-8 border-t border-zinc-200/60 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl px-4 py-2 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <SpinnerGap size={15} className="animate-spin" />
              Saving…
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </form>
  )
}
