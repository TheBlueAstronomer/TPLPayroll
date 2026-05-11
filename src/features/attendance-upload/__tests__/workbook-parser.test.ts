import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseAttendanceWorkbook } from '@/features/attendance-upload/services/workbook-parser.service'

// ─── Sheet layout helpers ─────────────────────────────────────────────────────
//
// Real XLS format: 3 employee sections per sheet, fixed column positions.
// Section column bases: 0, 15, 30.
//
// Row 3 (index 3): Employee name  → col base+9
// Row 4 (index 4): User ID        → col base+9
// Rows 12–18 (index 12–18): 7 days of time card data
//   base+1  = Before Noon In,  base+3  = Before Noon Out
//   base+6  = After Noon In,   base+8  = After Noon Out
//   base+10 = Overtime In,     base+12 = Overtime Out

const SECTION_BASES = [0, 15, 30] as const
const NUM_ROWS = 19   // rows 0–18

type TimeEntry = {
  bnIn?: number; bnOut?: number
  anIn?: number; anOut?: number
  otIn?: number; otOut?: number
}

interface SectionSpec {
  name: string
  userId?: number
  days?: TimeEntry[]  // up to 7 entries; defaults to all-null
}

function makeSheet(sections: (SectionSpec | null)[]): XLSX.WorkBook {
  const aoa: (unknown)[][] = Array.from({ length: NUM_ROWS }, () =>
    Array(45).fill(null)
  )

  sections.forEach((spec, sectionIdx) => {
    if (!spec) return
    const base = SECTION_BASES[sectionIdx]

    aoa[3][base + 9] = spec.name || null
    if (spec.userId !== undefined) aoa[4][base + 9] = spec.userId

    const days = spec.days ?? []
    for (let d = 0; d < 7; d++) {
      const rowIdx = 12 + d
      const day = days[d] ?? {}
      if (day.bnIn  !== undefined) aoa[rowIdx][base + 1]  = day.bnIn
      if (day.bnOut !== undefined) aoa[rowIdx][base + 3]  = day.bnOut
      if (day.anIn  !== undefined) aoa[rowIdx][base + 6]  = day.anIn
      if (day.anOut !== undefined) aoa[rowIdx][base + 8]  = day.anOut
      if (day.otIn  !== undefined) aoa[rowIdx][base + 10] = day.otIn
      if (day.otOut !== undefined) aoa[rowIdx][base + 12] = day.otOut
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return wb
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseAttendanceWorkbook', () => {
  it('parses all sheets and collects blocks', () => {
    const wb = XLSX.utils.book_new()
    for (let i = 0; i < 4; i++) {
      const aoa: unknown[][] = Array.from({ length: NUM_ROWS }, () => Array(45).fill(null))
      aoa[3][9] = `Emp Sheet${i + 1}`
      aoa[4][9] = i + 1
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      XLSX.utils.book_append_sheet(wb, ws, `Sheet${i + 1}`)
    }
    const result = parseAttendanceWorkbook(wb)
    expect(result.blocks).toHaveLength(4)
    expect(result.blocks.map((b) => b.sourceSheetName)).toContain('Sheet4')
  })

  it('parses up to 3 blocks per sheet', () => {
    const wb = makeSheet([
      { name: 'Emp A', userId: 1 },
      { name: 'Emp B', userId: 2 },
      { name: 'Emp C', userId: 3 },
    ])
    const result = parseAttendanceWorkbook(wb)
    expect(result.blocks).toHaveLength(3)
    expect(result.blocks[0].sourceEmployeeBlockIndex).toBe(0)
    expect(result.blocks[1].sourceEmployeeBlockIndex).toBe(1)
    expect(result.blocks[2].sourceEmployeeBlockIndex).toBe(2)
  })

  it('skips empty sections so last sheet with 1 employee yields 1 block', () => {
    const wb = makeSheet([{ name: 'Only One', userId: 71 }, null, null])
    const result = parseAttendanceWorkbook(wb)
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].userIdFromSheet).toBe(71)
  })
})

describe('employee identity extraction', () => {
  it('extracts employee name from section base+9 at row 3', () => {
    const wb = makeSheet([{ name: 'Ravi Kumar', userId: 1 }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.employeeName).toBe('Ravi Kumar')
  })

  it('extracts numeric User ID from section base+9 at row 4', () => {
    const wb = makeSheet([{ name: 'Ravi Kumar', userId: 42 }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.userIdFromSheet).toBe(42)
  })

  it('sets userIdFromSheet to undefined when cell is empty', () => {
    const wb = makeSheet([{ name: 'Ravi Kumar' }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.userIdFromSheet).toBeUndefined()
  })

  it('site is always null (not present in this format)', () => {
    const wb = makeSheet([{ name: 'Ravi Kumar', userId: 1 }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.site).toBeNull()
  })

  it('sets correct sourceSheetName and sourceEmployeeBlockIndex', () => {
    const wb = makeSheet([
      { name: 'Emp A', userId: 1 },
      { name: 'Emp B', userId: 2 },
      null,
    ])
    const result = parseAttendanceWorkbook(wb)
    expect(result.blocks[0].sourceSheetName).toBe('Sheet1')
    expect(result.blocks[0].sourceEmployeeBlockIndex).toBe(0)
    expect(result.blocks[1].sourceEmployeeBlockIndex).toBe(1)
  })
})

describe('hours calculation', () => {
  it('calculates total hours and sets regular hours (capped at 8)', () => {
    // BN: 6h–9h = 3h, AN: 9.6h–13.2h = 3.6h → 6.6h total → 6.6h regular, 0h OT
    const day: TimeEntry = { bnIn: 6 / 24, bnOut: 9 / 24, anIn: 9.6 / 24, anOut: 13.2 / 24 }
    const wb = makeSheet([{ name: 'Emp', userId: 1, days: [day] }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.dailyHours[0].regularHours).toBeCloseTo(6.6, 1)
    expect(block.dailyHours[0].overtimeHours).toBe(0)
  })

  it('calculates overtime hours as any hours beyond 8', () => {
    // BN: 6h-10h = 4h, AN: 11h-16h = 5h → 9h total → 8h regular, 1h OT
    const day: TimeEntry = { bnIn: 6 / 24, bnOut: 10 / 24, anIn: 11 / 24, anOut: 16 / 24 }
    const wb = makeSheet([{ name: 'Emp', userId: 1, days: [day] }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.dailyHours[0].regularHours).toBeCloseTo(8.0, 1)
    expect(block.dailyHours[0].overtimeHours).toBeCloseTo(1.0, 1)
  })

  it('handles hours explicitly recorded in OT columns by combining them with regular hours', () => {
    // BN: 8h-12h = 4h, AN: 13h-15h = 2h, OT: 16h-19h = 3h → 9h total → 8h regular, 1h OT
    const day: TimeEntry = { bnIn: 8 / 24, bnOut: 12 / 24, anIn: 13 / 24, anOut: 15 / 24, otIn: 16 / 24, otOut: 19 / 24 }
    const wb = makeSheet([{ name: 'Emp', userId: 1, days: [day] }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.dailyHours[0].regularHours).toBeCloseTo(8.0, 1)
    expect(block.dailyHours[0].overtimeHours).toBeCloseTo(1.0, 1)
  })

  it('returns 0 for both hours on a day with no clock data (e.g. Sunday)', () => {
    const wb = makeSheet([{ name: 'Emp', userId: 1, days: [{}, {}, {}, {}] }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.dailyHours[3].regularHours).toBe(0)
    expect(block.dailyHours[3].overtimeHours).toBe(0)
  })

  it('always produces exactly 7 dailyHours entries per block', () => {
    const wb = makeSheet([{ name: 'Emp', userId: 1 }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.dailyHours).toHaveLength(7)
  })

  it('handles partial day (only Before Noon session)', () => {
    const day: TimeEntry = { bnIn: 6 / 24, bnOut: 9 / 24 }
    const wb = makeSheet([{ name: 'Emp', userId: 1, days: [day] }, null, null])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.dailyHours[0].regularHours).toBeCloseTo(3.0, 1)
    expect(block.dailyHours[0].overtimeHours).toBe(0)
  })

  it('accumulates totalRegularHours across all days', () => {
    // 7 days × 3h regular each
    const day: TimeEntry = { bnIn: 6 / 24, bnOut: 9 / 24 }
    const wb = makeSheet([
      { name: 'Emp', userId: 1, days: [day, day, day, day, day, day, day] },
      null, null,
    ])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.totalRegularHours).toBeCloseTo(21.0, 0)
  })

  it('accumulates totalOvertimeHours across all days', () => {
    // 3 days × 10h total each = 8h regular, 2h OT each -> 6h OT total
    const day: TimeEntry = { bnIn: 8 / 24, bnOut: 18 / 24 } // 10 hours
    const wb = makeSheet([
      { name: 'Emp', userId: 1, days: [day, day, day, {}, {}, {}, {}] },
      null, null,
    ])
    const [block] = parseAttendanceWorkbook(wb).blocks
    expect(block.totalOvertimeHours).toBeCloseTo(6.0, 0)
    expect(block.totalRegularHours).toBeCloseTo(24.0, 0)
  })
})

describe('real file smoke test', () => {
  it('parses the real XLS and extracts expected employees', async () => {
    const XLSX2 = await import('xlsx')
    let wb: XLSX.WorkBook
    try {
      wb = XLSX2.readFile('test_data/26Mar_01Apr - AttendReport.xls')
    } catch {
      return // file not available in CI
    }
    const result = parseAttendanceWorkbook(wb)
    expect(result.blocks.length).toBeGreaterThan(30)

    const first = result.blocks[0]
    expect(first.employeeName).toBe('Lijo Johnson')
    expect(first.userIdFromSheet).toBe(1)
    expect(first.dailyHours).toHaveLength(7)
    expect(first.totalRegularHours).toBeGreaterThanOrEqual(0)
  })
})
