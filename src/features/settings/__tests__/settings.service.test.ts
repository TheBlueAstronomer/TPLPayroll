import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  default: {
    settings: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import prisma from '@/lib/prisma'
import { getSettings, updateSettings } from '@/features/settings/services/settings.service'
import { SettingsServiceError } from '@/features/settings/types/settings.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeSettingsRecord = (payrollWeekStartDay = 'THURSDAY') => ({
  id: 'singleton',
  payrollWeekStartDay,
  updatedAt: new Date('2025-01-01'),
})

// ─────────────────────────────────────────────────────────────────────────────
// US-10.1: getSettings
// ─────────────────────────────────────────────────────────────────────────────

describe('getSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns current settings when payrollWeekStartDay = "MONDAY"', async () => {
    // GIVEN existing record with MONDAY
    vi.mocked(prisma.settings.upsert).mockResolvedValue(makeSettingsRecord('MONDAY') as never)

    // WHEN
    const result = await getSettings()

    // THEN payrollWeekStartDay is MONDAY with fixed fields
    expect(result.payrollWeekStartDay).toBe('MONDAY')
    expect(result.currency).toBe('INR')
    expect(result.docExpiryThresholdDays).toBe(7)
  })

  it('returns defaults (THURSDAY) when no record exists (upsert creates it)', async () => {
    // GIVEN upsert creates a new record with default THURSDAY
    vi.mocked(prisma.settings.upsert).mockResolvedValue(makeSettingsRecord('THURSDAY') as never)

    // WHEN
    const result = await getSettings()

    // THEN payrollWeekStartDay defaults to THURSDAY
    expect(result.payrollWeekStartDay).toBe('THURSDAY')
    expect(prisma.settings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'singleton' },
        create: { id: 'singleton' },
      }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-10.2: updateSettings
// ─────────────────────────────────────────────────────────────────────────────

describe('updateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves new payrollWeekStartDay correctly (MONDAY → DB stores MONDAY)', async () => {
    // GIVEN valid input with MONDAY
    vi.mocked(prisma.settings.update).mockResolvedValue(makeSettingsRecord('MONDAY') as never)

    // WHEN
    const result = await updateSettings({ payrollWeekStartDay: 'MONDAY' })

    // THEN DB is called with MONDAY and result reflects it
    expect(result.payrollWeekStartDay).toBe('MONDAY')
    expect(prisma.settings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'singleton' },
        data: expect.objectContaining({ payrollWeekStartDay: 'MONDAY' }),
      }),
    )
  })

  it('throws INVALID_DAY error when given invalid day', async () => {
    // GIVEN an invalid day value
    // WHEN
    await expect(
      updateSettings({ payrollWeekStartDay: 'FUNDAY' as never }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })

    // THEN prisma is not called
    expect(prisma.settings.update).not.toHaveBeenCalled()
  })

  it('returns updated value via getSettings after update', async () => {
    // GIVEN update succeeds with WEDNESDAY
    vi.mocked(prisma.settings.update).mockResolvedValue(makeSettingsRecord('WEDNESDAY') as never)
    vi.mocked(prisma.settings.upsert).mockResolvedValue(makeSettingsRecord('WEDNESDAY') as never)

    // WHEN update is called
    await updateSettings({ payrollWeekStartDay: 'WEDNESDAY' })

    // AND getSettings is called subsequently
    const current = await getSettings()

    // THEN the updated value is returned
    expect(current.payrollWeekStartDay).toBe('WEDNESDAY')
  })
})
