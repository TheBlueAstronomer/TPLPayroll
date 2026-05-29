import * as XLSX from 'xlsx'
import type { PayrollWeekDetectionResult } from '@/features/attendance-upload/types/attendance.types'

// ─── Month name → zero-based month index ─────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

// ─── Parse "6 Mar 2025" into ISO date string ──────────────────────────────────

function parseDMY(day: string, mon: string, year: string): string | null {
  const m = MONTH_MAP[mon.toLowerCase().slice(0, 3)]
  if (m === undefined) return null
  const d = parseInt(day, 10)
  const y = parseInt(year, 10)
  if (isNaN(d) || isNaN(y)) return null
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// ─── Date range pattern: "6 Mar 2025 - 12 Mar 2025" or "... to ..." ──────────

const DATE_RANGE_PATTERN =
  /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\s*(?:-|to)\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/i

function extractDateRange(text: string): { start: string; end: string } | null {
  const m = DATE_RANGE_PATTERN.exec(text)
  if (!m) return null
  const start = parseDMY(m[1], m[2], m[3])
  const end = parseDMY(m[4], m[5], m[6])
  if (!start || !end) return null
  return { start, end }
}

// ─── ISO date range pattern: "2025-03-06~2025-03-12" ─────────────────────────

const ISO_DATE_RANGE_PATTERN = /(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})/

function extractIsoDateRange(text: string): { start: string; end: string } | null {
  const m = ISO_DATE_RANGE_PATTERN.exec(text)
  return m ? { start: m[1], end: m[2] } : null
}

// ─── Standard week check: start = Thursday (4), end = Wednesday (3) ──────────

function isStandardWeek(start: string, end: string): boolean {
  const startDay = new Date(start + 'T00:00:00Z').getUTCDay()
  const endDay = new Date(end + 'T00:00:00Z').getUTCDay()
  return startDay === 4 && endDay === 3
}

// ─── Scan all cells in a workbook for a date range ────────────────────────────

function scanWorkbookForDateRange(wb: XLSX.WorkBook): { start: string; end: string } | null {
  const cellRegex = /^[A-Z]+\d+$/
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) continue
    for (const key of Object.keys(ws)) {
      if (!cellRegex.test(key)) continue
      const cell = ws[key]
      if (!cell) continue
      const text = String(cell.v ?? cell.w ?? '')
      const found = extractIsoDateRange(text) ?? extractDateRange(text)
      if (found) return found
    }
  }
  return null
}

// ─── Filename date range pattern: "06Mar_12Mar" or "06Mar2025_12Mar2025" ─────

// Infer year from current year; assume both months fall within same year/adjacent
const FILE_DATE_RANGE_PATTERN =
  /(\d{1,2})([A-Za-z]{3})(\d{4})?[_\-](\d{1,2})([A-Za-z]{3})(\d{4})?/i

function extractDateRangeFromFilename(
  fileName: string
): { start: string; end: string } | null {
  const m = FILE_DATE_RANGE_PATTERN.exec(fileName)
  if (!m) return null
  const currentYear = new Date().getFullYear().toString()
  const startYear = m[3] ?? currentYear
  const endYear = m[6] ?? currentYear
  const start = parseDMY(m[1], m[2], startYear)
  const end = parseDMY(m[4], m[5], endYear)
  if (!start || !end) return null
  return { start, end }
}

// ─── detectPayrollWeek ────────────────────────────────────────────────────────

export function detectPayrollWeek(
  wb: XLSX.WorkBook,
  fileName: string
): PayrollWeekDetectionResult {
  // 1. Try sheet content
  const fromSheet = scanWorkbookForDateRange(wb)
  if (fromSheet) {
    const result: PayrollWeekDetectionResult = {
      source: 'SHEET_CONTENT',
      start: fromSheet.start,
      end: fromSheet.end,
    }
    if (!isStandardWeek(fromSheet.start, fromSheet.end)) {
      return { ...result, warning: 'NON_STANDARD_WEEK' }
    }
    return result
  }

  // 2. Try filename
  const fromFile = extractDateRangeFromFilename(fileName)
  if (fromFile) {
    const result: PayrollWeekDetectionResult = {
      source: 'FILE_NAME',
      start: fromFile.start,
      end: fromFile.end,
    }
    if (!isStandardWeek(fromFile.start, fromFile.end)) {
      return { ...result, warning: 'NON_STANDARD_WEEK' }
    }
    return result
  }

  // 3. Manual required
  return { source: 'MANUAL_REQUIRED' }
}
