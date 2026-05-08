import { describe, it, expect } from 'vitest'
import { computeImportSummary } from '@/features/attendance-upload/services/import-summary.service'
import type { MatchedAttendanceRecord } from '@/features/attendance-upload/types/attendance.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<MatchedAttendanceRecord> = {}
): MatchedAttendanceRecord {
  return {
    employeeName: 'Ravi Kumar',
    site: null,
    sourceSheetName: 'Sheet1',
    sourceEmployeeBlockIndex: 0,
    totalRegularHours: 40,
    totalOvertimeHours: 0,
    dailyHours: Array(7).fill({ regularHours: 0, overtimeHours: 0 }),
    parseErrors: [],
    matchStatus: 'MATCHED',
    isBlocking: false,
    employeeDbId: 'uuid-1',
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeImportSummary', () => {
  it('returns correct counts for mixed results', () => {
    const records: MatchedAttendanceRecord[] = [
      ...Array(15).fill(null).map(() => makeRecord()),
      ...Array(2).fill(null).map((_, i) =>
        makeRecord({ employeeName: `Unknown ${i}`, matchStatus: 'UNMATCHED', isBlocking: true, employeeDbId: null })
      ),
      makeRecord({ matchStatus: 'INACTIVE', isBlocking: true }),
      makeRecord({ matchStatus: 'RESIGNED_BEFORE_WEEK', isBlocking: true }),
    ]
    const summary = computeImportSummary(records)
    expect(summary.total).toBe(19)
    expect(summary.matched).toBe(15)
    expect(summary.unmatched).toBe(2)
    expect(summary.inactive).toBe(1)
    expect(summary.resignedBeforeWeek).toBe(1)
    expect(summary.isBlocked).toBe(true)
  })

  it('isBlocked=false when all employees matched', () => {
    const records = Array(15).fill(null).map(() => makeRecord())
    const summary = computeImportSummary(records)
    expect(summary.matched).toBe(15)
    expect(summary.unmatched).toBe(0)
    expect(summary.inactive).toBe(0)
    expect(summary.resignedBeforeWeek).toBe(0)
    expect(summary.isBlocked).toBe(false)
  })

  it('counts parse errors from blocks with parseErrors', () => {
    const records = [
      makeRecord({ parseErrors: ['Invalid regular hours'] }),
      makeRecord(),
    ]
    const summary = computeImportSummary(records)
    expect(summary.errors).toBe(1)
    expect(summary.isBlocked).toBe(true)
  })

  it('isBlocked=true when any record is blocking', () => {
    const records = [
      makeRecord(),
      makeRecord({ matchStatus: 'UNMATCHED', isBlocking: true, employeeDbId: null }),
    ]
    const summary = computeImportSummary(records)
    expect(summary.isBlocked).toBe(true)
  })

  it('returns zero counts for empty records', () => {
    const summary = computeImportSummary([])
    expect(summary.total).toBe(0)
    expect(summary.matched).toBe(0)
    expect(summary.isBlocked).toBe(false)
  })
})
