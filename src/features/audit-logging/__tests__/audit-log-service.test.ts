import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AuditLogRecord } from '../types/audit-log.types'

// ─── Mock Prisma ─────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import prisma from '@/lib/prisma'
import { getAuditLogs } from '@/features/audit-logging/services/audit-log.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeAuditLog = (overrides: Partial<AuditLogRecord> = {}): AuditLogRecord => ({
  id: 'log-uuid-1',
  actionType: 'CREATE',
  entityType: 'EMPLOYEE',
  entityId: 'emp-uuid-1',
  detailsJson: {},
  createdAt: new Date('2025-05-01T10:00:00Z'),
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────────────────
// US-11.4: getAuditLogs
// ─────────────────────────────────────────────────────────────────────────────

describe('getAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns logs in reverse chronological order', async () => {
    // GIVEN 5 audit logs created at different times
    const logs = [
      makeAuditLog({ id: 'log-5', createdAt: new Date('2025-05-05T10:00:00Z') }),
      makeAuditLog({ id: 'log-4', createdAt: new Date('2025-05-04T10:00:00Z') }),
      makeAuditLog({ id: 'log-3', createdAt: new Date('2025-05-03T10:00:00Z') }),
      makeAuditLog({ id: 'log-2', createdAt: new Date('2025-05-02T10:00:00Z') }),
      makeAuditLog({ id: 'log-1', createdAt: new Date('2025-05-01T10:00:00Z') }),
    ]
    vi.mocked(prisma.auditLog.count).mockResolvedValue(5)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(logs as never)

    // WHEN
    await getAuditLogs()

    // THEN prisma.auditLog.findMany was called with orderBy: { createdAt: 'desc' }
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('returns paginated results with correct page and limit', async () => {
    // GIVEN 50 audit logs
    const logs = Array.from({ length: 20 }, (_, i) =>
      makeAuditLog({ id: `log-${i + 21}` })
    )
    vi.mocked(prisma.auditLog.count).mockResolvedValue(50)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(logs as never)

    // WHEN getAuditLogs({ page: 2, limit: 20 }) is called
    const result = await getAuditLogs({ page: 2, limit: 20 })

    // THEN result.page === 2 AND result.limit === 20
    expect(result.page).toBe(2)
    expect(result.limit).toBe(20)

    // AND prisma.auditLog.findMany was called with skip: 20, take: 20
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      })
    )
  })

  it('filters by entityType=WAGE_HISTORY', async () => {
    // GIVEN 10 EMPLOYEE logs and 5 WAGE_HISTORY logs
    const wageHistoryLogs = Array.from({ length: 5 }, (_, i) =>
      makeAuditLog({ id: `log-wh-${i}`, entityType: 'WAGE_HISTORY' })
    )
    vi.mocked(prisma.auditLog.count).mockResolvedValue(5)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(wageHistoryLogs as never)

    // WHEN getAuditLogs({ entityType: 'WAGE_HISTORY' }) is called
    await getAuditLogs({ entityType: 'WAGE_HISTORY' })

    // THEN prisma.auditLog.findMany was called with where.entityType = 'WAGE_HISTORY'
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entityType: 'WAGE_HISTORY' }),
      })
    )
  })

  it('filters by actionType=CREATE', async () => {
    // GIVEN 8 CREATE logs and 12 UPDATE logs
    const createLogs = Array.from({ length: 8 }, (_, i) =>
      makeAuditLog({ id: `log-c-${i}`, actionType: 'CREATE' })
    )
    vi.mocked(prisma.auditLog.count).mockResolvedValue(8)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(createLogs as never)

    // WHEN getAuditLogs({ actionType: 'CREATE' }) is called
    await getAuditLogs({ actionType: 'CREATE' })

    // THEN prisma.auditLog.findMany was called with where.actionType = 'CREATE'
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ actionType: 'CREATE' }),
      })
    )
  })

  it('returns totalCount from count query', async () => {
    // GIVEN prisma.auditLog.count returns 42
    vi.mocked(prisma.auditLog.count).mockResolvedValue(42)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([] as never)

    // WHEN getAuditLogs() is called
    const result = await getAuditLogs()

    // THEN result.totalCount === 42
    expect(result.totalCount).toBe(42)
  })

  it('uses default page 1 and limit 20 when not specified', async () => {
    // GIVEN no options provided
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([] as never)

    // WHEN getAuditLogs() is called with no options
    const result = await getAuditLogs()

    // THEN prisma.auditLog.findMany was called with skip: 0, take: 20
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      })
    )

    // AND defaults are reflected in result
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('does not apply entityType filter when not specified', async () => {
    // GIVEN no options provided
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([] as never)

    // WHEN getAuditLogs() is called with no options
    await getAuditLogs()

    // THEN prisma.auditLog.findMany was called with where = {}
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    )
  })
})
