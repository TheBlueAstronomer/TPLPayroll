import * as XLSX from 'xlsx'
import type {
  ParsedAttendanceBlock,
  DailyHours,
} from '@/features/attendance-upload/types/attendance.types'

// ─── Sheet layout (fixed positions) ──────────────────────────────────────────
//
// Each sheet contains exactly 3 employee sections side by side.
// Section column bases: 0, 15, 30  (each section is 15 columns wide)
//
// Fixed rows (0-based index):
//   Row 3: Employee name      → col base+9
//   Row 4: User ID (numeric)  → col base+9  (label "User ID" at base+8)
//   Rows 12–18: Time card (7 days: Thu–Wed)
//
// Time card column offsets (relative to section base):
//   +0:  Date label (e.g. "26 Th")
//   +1:  Before Noon clock-in   (Excel time fraction 0.0–1.0)
//   +3:  Before Noon clock-out
//   +6:  After Noon clock-in
//   +8:  After Noon clock-out
//   +10: Overtime clock-in
//   +12: Overtime clock-out
//
// Regular hours/day  = (BN_OUT − BN_IN) + (AN_OUT − AN_IN), multiplied by 24
// Overtime hours/day = (OT_OUT − OT_IN) × 24

const SECTION_BASES = [0, 15, 30] as const

const ROW_NAME     = 3
const ROW_USER_ID  = 4
const ROW_TC_FIRST = 12  // first day row (Excel row 13)
const ROW_TC_LAST  = 18  // last day row  (Excel row 19)

const OFF_NAME    = 9
const OFF_USER_ID = 9
const OFF_BN_IN   = 1
const OFF_BN_OUT  = 3
const OFF_AN_IN   = 6
const OFF_AN_OUT  = 8
const OFF_OT_IN   = 10
const OFF_OT_OUT  = 12

// ─── Helpers ──────────────────────────────────────────────────────────────────

function excelTimeToHours(val: unknown): number | null {
  if (val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n * 24
}

// ─── Parse one employee section ───────────────────────────────────────────────

function parseSection(
  aoa: unknown[][],
  base: number,
  sheetName: string,
  blockIndex: number
): ParsedAttendanceBlock | null {
  const nameRow   = (aoa[ROW_NAME]    ?? []) as unknown[]
  const userIdRow = (aoa[ROW_USER_ID] ?? []) as unknown[]

  const employeeName    = String(nameRow[base + OFF_NAME] ?? '').trim()
  const rawUserId       = userIdRow[base + OFF_USER_ID]
  const userIdAsNumber  = rawUserId !== null && rawUserId !== undefined ? Number(rawUserId) : NaN
  const userIdFromSheet = isNaN(userIdAsNumber) ? undefined : userIdAsNumber

  // Skip empty sections
  if (employeeName === '' && userIdFromSheet === undefined) return null

  const dailyHours: DailyHours[] = []
  const parseErrors: string[] = []

  for (let rowIdx = ROW_TC_FIRST; rowIdx <= ROW_TC_LAST; rowIdx++) {
    const row = (aoa[rowIdx] ?? []) as unknown[]

    const bnIn  = excelTimeToHours(row[base + OFF_BN_IN])
    const bnOut = excelTimeToHours(row[base + OFF_BN_OUT])
    const anIn  = excelTimeToHours(row[base + OFF_AN_IN])
    const anOut = excelTimeToHours(row[base + OFF_AN_OUT])
    const otIn  = excelTimeToHours(row[base + OFF_OT_IN])
    const otOut = excelTimeToHours(row[base + OFF_OT_OUT])

    let regularHours = 0
    if (bnIn !== null && bnOut !== null) regularHours += bnOut - bnIn
    if (anIn !== null && anOut !== null) regularHours += anOut - anIn

    let overtimeHours = 0
    if (otIn !== null && otOut !== null) overtimeHours = otOut - otIn

    dailyHours.push({
      regularHours:  Math.round(regularHours  * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
    })
  }

  const totalRegularHours  = dailyHours.reduce((s, d) => s + d.regularHours,  0)
  const totalOvertimeHours = dailyHours.reduce((s, d) => s + d.overtimeHours, 0)

  return {
    employeeName,
    userIdFromSheet,
    site: null,
    sourceSheetName: sheetName,
    sourceEmployeeBlockIndex: blockIndex,
    totalRegularHours:  Math.round(totalRegularHours  * 100) / 100,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    dailyHours,
    parseErrors,
  }
}

// ─── Parse a single sheet ─────────────────────────────────────────────────────

function parseSheet(ws: XLSX.WorkSheet, sheetName: string): ParsedAttendanceBlock[] {
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const blocks: ParsedAttendanceBlock[] = []

  for (let i = 0; i < SECTION_BASES.length; i++) {
    const block = parseSection(aoa, SECTION_BASES[i], sheetName, i)
    if (block) blocks.push(block)
  }

  return blocks
}

// ─── parseAttendanceWorkbook ──────────────────────────────────────────────────

export interface WorkbookParseResult {
  blocks: ParsedAttendanceBlock[]
}

export function parseAttendanceWorkbook(wb: XLSX.WorkBook): WorkbookParseResult {
  const blocks: ParsedAttendanceBlock[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    blocks.push(...parseSheet(ws, sheetName))
  }

  return { blocks }
}
