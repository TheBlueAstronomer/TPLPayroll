import { z } from 'zod'

// ─── File validation ──────────────────────────────────────────────────────────

export type AttendanceFileErrorCode = 'UNSUPPORTED_FILE_TYPE'

// ─── Payroll week detection ───────────────────────────────────────────────────

export type PayrollWeekSource = 'SHEET_CONTENT' | 'FILE_NAME' | 'MANUAL'

export type PayrollWeekDetectionResult =
  | { source: 'MANUAL_REQUIRED' }
  | {
      source: PayrollWeekSource
      start: string // ISO date YYYY-MM-DD
      end: string   // ISO date YYYY-MM-DD
      warning?: 'NON_STANDARD_WEEK'
    }

// ─── Parsed block ─────────────────────────────────────────────────────────────

export interface DailyHours {
  regularHours: number
  overtimeHours: number
}

export interface ParsedAttendanceBlock {
  employeeName: string
  userIdFromSheet?: number   // numeric User ID from the attendance sheet
  site: string | null
  sourceSheetName: string
  sourceEmployeeBlockIndex: number
  totalRegularHours: number
  totalOvertimeHours: number
  dailyHours: DailyHours[]
  parseErrors: string[]
}

// ─── Matching ─────────────────────────────────────────────────────────────────

export type MatchStatus =
  | 'MATCHED'
  | 'UNMATCHED'
  | 'INACTIVE'
  | 'RESIGNED_BEFORE_WEEK'
  | 'MANUALLY_MATCHED'
  | 'REJECTED_UNMATCHED'

export function getBlockKey(block: { sourceSheetName: string | null; sourceEmployeeBlockIndex: number }): string {
  return `${block.sourceSheetName ?? ''}||${block.sourceEmployeeBlockIndex}`
}

export type VerificationDecision = 'APPROVED' | 'REJECTED'

export interface MatchedAttendanceRecord extends ParsedAttendanceBlock {
  matchStatus: MatchStatus
  isBlocking: boolean
  employeeDbId: string | null
  verificationDecision?: VerificationDecision
}

// ─── Import summary ───────────────────────────────────────────────────────────

export interface ImportSummary {
  total: number
  matched: number
  unmatched: number
  inactive: number
  resignedBeforeWeek: number
  rejectedUnmatched: number
  needsVerification: number
  errors: number
  isBlocked: boolean
}

// ─── Upload result ────────────────────────────────────────────────────────────

export interface AttendanceUploadResult {
  uploadId: string
  payrollWeekStartDate: Date
  payrollWeekEndDate: Date
  payrollWeekSource: PayrollWeekSource
  status: string
  isActiveForPayrollWeek: boolean
}

// ─── Zod schema for block parse errors ───────────────────────────────────────

export const BlockParseErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
})

// ─── Service error ────────────────────────────────────────────────────────────

export class AttendanceServiceError extends Error {
  constructor(
    public readonly code: AttendanceFileErrorCode | 'UPLOAD_FAILED' | 'REPLACE_FAILED',
    message: string
  ) {
    super(message)
    this.name = 'AttendanceServiceError'
  }
}

// ─── Action result ────────────────────────────────────────────────────────────

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }
