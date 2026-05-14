export interface PayrollHistoryRow {
  recordId: string // PayrollRunEmployee.id
  payrollRunId: string
  payrollRevisionId: string
  employeeId: string
  employeeName: string
  employeeIdString: string // e.g. EMP-001
  weekStart: Date
  weekEnd: Date
  regularHours: number
  overtimeHours: number
  grossPay: number
  netPayable: number
  revisionNumber: number
  isCurrent: boolean
}

export interface PayrollHistoryDailyAttendance {
  date: Date
  regularHours: number
  overtimeHours: number
}

export interface PayrollHistoryAdjustment {
  type: 'ADDITION' | 'DEDUCTION'
  amount: number
  reason: string
}

export interface PayrollRecordDetail {
  recordId: string
  employeeId: string
  employeeName: string
  employeeIdString: string
  designation: string
  hourlyRate: number
  weekStart: Date
  weekEnd: Date
  revisionNumber: number
  isCurrent: boolean
  attendance: PayrollHistoryDailyAttendance[]
  totalRegularHours: number
  totalOvertimeHours: number
  regularPay: number
  overtimePay: number
  grossPay: number
  adjustments: PayrollHistoryAdjustment[]
  netPayable: number
}
