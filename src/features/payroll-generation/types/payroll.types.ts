// ─── Week/Attendance status ───────────────────────────────────────────────────

export type AttendanceWeekStatus = 'READY' | 'ERRORS' | 'NO_UPLOAD'
export type PayrollRunStatus = 'NOT_GENERATED' | 'APPROVED'

export interface PayrollWeekItem {
  weekId: string // YYYY-MM-DD (ISO start date)
  weekStart: Date
  weekEnd: Date
  attendanceStatus: AttendanceWeekStatus
  matchedEmployeeCount: number
  totalRegularHours: number
  totalOvertimeHours: number
  payrollStatus: PayrollRunStatus
  payrollRunId: string | null
}

// ─── Attendance readiness ─────────────────────────────────────────────────────

export type AttendanceReadinessResult =
  | {
      ready: true
      matchedEmployeeCount: number
      totalRegularHours: number
      totalOvertimeHours: number
    }
  | { ready: false; reason: 'NO_UPLOAD' | 'UNRESOLVED_ERRORS' }

// ─── Payroll calculation ──────────────────────────────────────────────────────

export interface EmployeePayrollRow {
  employeeId: string
  employeeCode: string
  employeeName: string
  designation: string
  designationShort: string | null
  site: string | null
  gPay: string | null
  bankAccount: string | null
  weeklySalaryUsed: number
  hourlyRateUsed: number
  regularHours: number
  overtimeHours: number
  regularPay: number
  overtimePay: number
  grossPay: number
  additions: number
  deductions: number
  netPayable: number
}

export interface PayrollSummaryTotals {
  totalRegularHours: number
  totalOvertimeHours: number
  totalRegularPay: number
  totalOvertimePay: number
  totalAdditions: number
  totalDeductions: number
  totalNetPayable: number
}

export interface PayrollSummary {
  weekStart: Date
  weekEnd: Date
  employees: EmployeePayrollRow[]
  totals: PayrollSummaryTotals
}

// ─── Approval ─────────────────────────────────────────────────────────────────

export interface ApprovePayrollResult {
  payrollRunId: string
  payrollRevisionId: string
  revisionNumber: number
  approvedAt: Date
  totalNetPayable: number
  employeeCount: number
}

// ─── Service error ────────────────────────────────────────────────────────────

export class PayrollServiceError extends Error {
  constructor(
    public readonly code:
      | 'NO_ATTENDANCE_UPLOAD'
      | 'ATTENDANCE_HAS_ERRORS'
      | 'NO_EMPLOYEES'
      | 'PAYROLL_ALREADY_EXISTS',
    message: string,
  ) {
    super(message)
    this.name = 'PayrollServiceError'
  }
}
