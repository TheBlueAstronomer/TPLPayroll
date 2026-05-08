import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { detectPayrollWeek } from '@/features/attendance-upload/services/week-detector.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWorkbookWithCell(cellContent: string): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([[cellContent]])
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return wb
}

function makeEmptyWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([['']])
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return wb
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('detectPayrollWeek', () => {
  describe('from sheet content', () => {
    it('detects dates from "6 Mar 2025 - 12 Mar 2025" format', () => {
      const wb = makeWorkbookWithCell('6 Mar 2025 - 12 Mar 2025')
      const result = detectPayrollWeek(wb, 'attendance.xlsx')
      expect(result).toMatchObject({
        source: 'SHEET_CONTENT',
        start: '2025-03-06',
        end: '2025-03-12',
      })
    })

    it('detects dates from "6 Mar 2025 to 12 Mar 2025" format', () => {
      const wb = makeWorkbookWithCell('6 Mar 2025 to 12 Mar 2025')
      const result = detectPayrollWeek(wb, 'attendance.xlsx')
      expect(result).toMatchObject({
        source: 'SHEET_CONTENT',
        start: '2025-03-06',
        end: '2025-03-12',
      })
    })

    it('flags non-Thursday-to-Wednesday week with NON_STANDARD_WEEK', () => {
      // Monday 10 Mar to Sunday 16 Mar — not standard Thu–Wed
      const wb = makeWorkbookWithCell('10 Mar 2025 - 16 Mar 2025')
      const result = detectPayrollWeek(wb, 'attendance.xlsx')
      expect(result).toMatchObject({
        source: 'SHEET_CONTENT',
        start: '2025-03-10',
        end: '2025-03-16',
        warning: 'NON_STANDARD_WEEK',
      })
    })

    it('does not warn when week is Thursday to Wednesday', () => {
      // Thu 6 Mar to Wed 12 Mar — standard week
      const wb = makeWorkbookWithCell('6 Mar 2025 - 12 Mar 2025')
      const result = detectPayrollWeek(wb, 'attendance.xlsx')
      if (result.source === 'MANUAL_REQUIRED') throw new Error('Expected dates')
      expect(result.warning).toBeUndefined()
    })
  })

  describe('from filename', () => {
    it('detects dates from filename "attendance_06Mar_12Mar.xlsx" using current year', () => {
      const currentYear = new Date().getFullYear()
      const wb = makeEmptyWorkbook()
      const result = detectPayrollWeek(wb, 'attendance_06Mar_12Mar.xlsx')
      expect(result).toMatchObject({
        source: 'FILE_NAME',
        start: `${currentYear}-03-06`,
        end: `${currentYear}-03-12`,
      })
    })

    it('detects dates from filename with explicit year "attendance_06Mar2025_12Mar2025.xlsx"', () => {
      const wb = makeEmptyWorkbook()
      const result = detectPayrollWeek(wb, 'attendance_06Mar2025_12Mar2025.xlsx')
      expect(result).toMatchObject({
        source: 'FILE_NAME',
        start: '2025-03-06',
        end: '2025-03-12',
      })
    })
  })

  describe('manual required', () => {
    it('returns MANUAL_REQUIRED when no dates found anywhere', () => {
      const wb = makeEmptyWorkbook()
      const result = detectPayrollWeek(wb, 'no_dates_here.xlsx')
      expect(result).toEqual({ source: 'MANUAL_REQUIRED' })
    })
  })
})
