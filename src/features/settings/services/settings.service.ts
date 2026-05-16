import prisma from '@/lib/prisma'
import {
  UpdateSettingsSchema,
  SettingsServiceError,
  type AppSettings,
  type UpdateSettingsInput,
  type DayOfWeek,
} from '@/features/settings/types/settings.types'

// ─── Helper ───────────────────────────────────────────────────────────────────

function toAppSettings(payrollWeekStartDay: string): AppSettings {
  return {
    payrollWeekStartDay: payrollWeekStartDay as DayOfWeek,
    currency: 'INR',
    docExpiryThresholdDays: 7,
  }
}

// ─── getSettings ──────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const record = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  return toAppSettings(record.payrollWeekStartDay)
}

// ─── updateSettings ───────────────────────────────────────────────────────────

export async function updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
  const parsed = UpdateSettingsSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues?.[0]
    throw new SettingsServiceError('VALIDATION_ERROR', first?.message ?? 'Invalid settings data')
  }

  const { payrollWeekStartDay } = parsed.data

  const record = await prisma.settings.update({
    where: { id: 'singleton' },
    data: { payrollWeekStartDay },
  })

  return toAppSettings(record.payrollWeekStartDay)
}
