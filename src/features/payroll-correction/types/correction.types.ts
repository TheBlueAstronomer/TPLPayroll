import type { EmployeePayrollRow, PayrollSummaryTotals } from '@/features/payroll-generation/types/payroll.types'

// ─── Correction types ─────────────────────────────────────────────────────────

export type CorrectionType = 'ADJUSTMENTS' | 'ATTENDANCE' | 'EMPLOYEE_DATA'

// ─── Initiation result ────────────────────────────────────────────────────────

export interface InitiateCorrectionResult {
  payrollRunId: string
  revisionId: string
  revisionNumber: number
  weekStart: Date
  weekEnd: Date
  totals: PayrollSummaryTotals
  employees: {
    employeeId: string
    employeeCode: string
    employeeName: string
    netPayable: number
  }[]
  adjustmentApplications: CorrectionAdjustmentItem[]
}

export interface CorrectionAdjustmentItem {
  applicationId: string
  adjustmentId: string
  employeeId: string
  employeeName: string
  employeeCode: string
  adjustmentType: 'DEDUCTION' | 'ADDITION'
  amount: number
  appliedAmount: number
  reason: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'SKIPPED'
  isReversed: boolean
}

// ─── Create revision input ────────────────────────────────────────────────────

export interface CreateRevisionInput {
  payrollRunId: string
  correctionReason: string | null
  correctionTypes: CorrectionType[]
  adjustmentChanges?: {
    reversed: string[]   // applicationIds to reverse
    approved: string[]   // applicationIds to re-approve (previously skipped)
  }
}

// ─── Create revision result ───────────────────────────────────────────────────

export interface CreateRevisionResult {
  payrollRunId: string
  revisionId: string
  revisionNumber: number
  totals: PayrollSummaryTotals
  employeeCount: number
}

// ─── Revised employee row (with diff) ─────────────────────────────────────────

export interface RevisedEmployeeRow extends EmployeePayrollRow {
  previousNetPayable: number | null
  previousRegularPay: number | null
  previousOvertimePay: number | null
  previousAdditions: number | null
  previousDeductions: number | null
}

// ─── Revision history ─────────────────────────────────────────────────────────

export interface RevisionHistoryItem {
  revisionId: string
  revisionNumber: number
  status: 'APPROVED' | 'SUPERSEDED'
  correctionReason: string | null
  isCurrent: boolean
  totalNetPayable: number
  totalRegularPay: number
  totalOvertimePay: number
  totalAdditions: number
  totalDeductions: number
  approvedAt: Date | null
  generatedAt: Date
}

// ─── Approve revision result ──────────────────────────────────────────────────

export interface ApproveRevisionResult {
  revisionId: string
  revisionNumber: number
  status: 'APPROVED'
  approvedAt: Date
}

// ─── Service error ────────────────────────────────────────────────────────────

export type CorrectionErrorCode =
  | 'CANNOT_CORRECT_UNAPPROVED_PAYROLL'
  | 'PAYROLL_RUN_NOT_FOUND'
  | 'NO_CORRECTION_TYPE_SELECTED'
  | 'REVISION_NOT_FOUND'
  | 'APPLICATION_NOT_FOUND'
  | 'ALREADY_REVERSED'
  | 'CANNOT_APPROVE_NON_SKIPPED'

export class CorrectionServiceError extends Error {
  constructor(
    public readonly code: CorrectionErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'CorrectionServiceError'
  }
}
