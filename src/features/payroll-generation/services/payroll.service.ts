import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import {
  PayrollServiceError,
  type PayrollWeekItem,
  type AttendanceReadinessResult,
  type EmployeePayrollRow,
  type PayrollSummary,
  type PayrollSummaryTotals,
  type ApprovePayrollResult,
} from '@/features/payroll-generation/types/payroll.types'
import type { WeeklyReviewItem } from '@/features/payroll-adjustments/types/adjustment.types'
import { getAdjustmentsForWeekReview } from '@/features/payroll-adjustments/services/adjustment.service'

// ─── Pure calculation helpers (exported for unit testing) ────────────────────

export function calculateRegularPay(
  dailyRegularHours: number[],
  hourlyRate: number,
): { regularHours: number; regularPay: number } {
  const regularHours = dailyRegularHours.reduce((sum, h) => sum + h, 0)
  const regularPay = regularHours * hourlyRate
  return { regularHours, regularPay }
}

export function calculateOvertimePay(
  dailyOvertimeHours: number[],
  hourlyRate: number,
): { overtimeHours: number; overtimePay: number } {
  const overtimeHours = dailyOvertimeHours.reduce((sum, h) => sum + h, 0)
  const overtimePay = overtimeHours * hourlyRate
  return { overtimeHours, overtimePay }
}

export function calculateNetPayable(
  grossPay: number,
  additions: number,
  deductions: number,
): number {
  return grossPay + additions - deductions
}

// ─── getAvailablePayrollWeeks ─────────────────────────────────────────────────

export async function getAvailablePayrollWeeks(): Promise<PayrollWeekItem[]> {
  const uploads = await prisma.attendanceUpload.findMany({
    where: { isActiveForPayrollWeek: true },
    orderBy: { payrollWeekStartDate: 'desc' },
    take: 20,
  })

  if (uploads.length === 0) return []

  const weekStarts = uploads.map((u) => u.payrollWeekStartDate)

  const [payrollRuns, recordGroups, hourSums] = await Promise.all([
    prisma.payrollRun.findMany({
      where: { payrollWeekStartDate: { in: weekStarts }, status: { in: ['APPROVED', 'REVISED'] } },
      select: { id: true, payrollWeekStartDate: true, status: true },
    }),
    prisma.attendanceRecord.groupBy({
      by: ['attendanceUploadId', 'employeeId'],
      where: { attendanceUploadId: { in: uploads.map((u) => u.id) } },
    }),
    prisma.attendanceRecord.groupBy({
      by: ['attendanceUploadId'],
      where: { attendanceUploadId: { in: uploads.map((u) => u.id) } },
      _sum: { regularHours: true, overtimeHours: true },
    }),
  ])

  const runByWeek = new Map(payrollRuns.map((r) => [r.payrollWeekStartDate.toISOString(), { id: r.id, status: r.status }]))

  const employeesByUpload = new Map<string, Set<string>>()
  for (const r of recordGroups) {
    if (!employeesByUpload.has(r.attendanceUploadId)) {
      employeesByUpload.set(r.attendanceUploadId, new Set())
    }
    employeesByUpload.get(r.attendanceUploadId)!.add(r.employeeId)
  }

  const hoursByUpload = new Map(
    hourSums.map((h) => [
      h.attendanceUploadId,
      {
        regularHours: Number(h._sum.regularHours ?? 0),
        overtimeHours: Number(h._sum.overtimeHours ?? 0),
      },
    ]),
  )

  return uploads.map((u): PayrollWeekItem => {
    const weekId = u.payrollWeekStartDate.toISOString().slice(0, 10)
    const runInfo = runByWeek.get(u.payrollWeekStartDate.toISOString()) ?? null
    const payrollRunId = runInfo?.id ?? null
    const hours = hoursByUpload.get(u.id) ?? { regularHours: 0, overtimeHours: 0 }
    const matchedEmployeeCount = employeesByUpload.get(u.id)?.size ?? 0

    return {
      weekId,
      weekStart: u.payrollWeekStartDate,
      weekEnd: u.payrollWeekEndDate,
      attendanceStatus: (u.status === 'ERRORS' ? 'ERRORS' : 'READY') as PayrollWeekItem['attendanceStatus'],
      matchedEmployeeCount,
      totalRegularHours: hours.regularHours,
      totalOvertimeHours: hours.overtimeHours,
      payrollStatus: runInfo
        ? (runInfo.status === 'REVISED' ? 'REVISED' as const : 'APPROVED' as const)
        : 'NOT_GENERATED' as const,
      payrollRunId,
    }
  })
}

// ─── checkAttendanceReadiness ─────────────────────────────────────────────────

export async function checkAttendanceReadiness(
  weekStart: Date,
  weekEnd: Date,
): Promise<AttendanceReadinessResult> {
  const upload = await prisma.attendanceUpload.findFirst({
    where: {
      payrollWeekStartDate: weekStart,
      payrollWeekEndDate: weekEnd,
      isActiveForPayrollWeek: true,
    },
  })

  if (!upload) return { ready: false, reason: 'NO_UPLOAD' }
  if (upload.status === 'ERRORS') return { ready: false, reason: 'UNRESOLVED_ERRORS' }

  const records = await prisma.attendanceRecord.findMany({
    where: { attendanceUploadId: upload.id },
    select: { employeeId: true, regularHours: true, overtimeHours: true },
  })

  const employeeIds = new Set(records.map((r) => r.employeeId))
  const totalRegularHours = records.reduce((sum, r) => sum + Number(r.regularHours), 0)
  const totalOvertimeHours = records.reduce((sum, r) => sum + Number(r.overtimeHours), 0)

  return {
    ready: true,
    matchedEmployeeCount: employeeIds.size,
    totalRegularHours,
    totalOvertimeHours,
  }
}

// ─── getPendingAdjustmentsForWeek ─────────────────────────────────────────────

export async function getPendingAdjustmentsForWeek(
  weekStart: Date,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _weekEnd: Date,
): Promise<WeeklyReviewItem[]> {
  return getAdjustmentsForWeekReview(weekStart)
}

// ─── calculatePayroll ─────────────────────────────────────────────────────────

export async function calculatePayroll(
  weekStart: Date,
  weekEnd: Date,
): Promise<PayrollSummary> {
  const upload = await prisma.attendanceUpload.findFirst({
    where: {
      payrollWeekStartDate: weekStart,
      payrollWeekEndDate: weekEnd,
      isActiveForPayrollWeek: true,
    },
  })

  if (!upload) {
    throw new PayrollServiceError('NO_ATTENDANCE_UPLOAD', 'No attendance upload found for this week')
  }
  if (upload.status === 'ERRORS') {
    throw new PayrollServiceError('ATTENDANCE_HAS_ERRORS', 'Attendance has unresolved errors')
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { attendanceUploadId: upload.id },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          employeeName: true,
          designation: true,
          designationShort: true,
          site: true,
          gPay: true,
          bankAccount: true,
          wageHistory: {
            where: {
              effectiveFrom: { lte: weekEnd },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: weekStart } }],
            },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ employeeId: 'asc' }, { attendanceDate: 'asc' }],
  })

  if (attendanceRecords.length === 0) {
    throw new PayrollServiceError('NO_EMPLOYEES', 'No attendance records found for this week')
  }

  type EmployeeGroup = {
    employee: (typeof attendanceRecords)[0]['employee']
    records: (typeof attendanceRecords)[0][]
  }

  const employeeMap = new Map<string, EmployeeGroup>()
  for (const record of attendanceRecords) {
    const key = record.employeeId
    if (!employeeMap.has(key)) {
      employeeMap.set(key, { employee: record.employee, records: [] })
    }
    employeeMap.get(key)!.records.push(record)
  }

  const approvedApplications = await prisma.payrollAdjustmentApplication.findMany({
    where: {
      payrollWeekStartDate: weekStart,
      approvalStatus: 'APPROVED',
      employeeId: { in: [...employeeMap.keys()] },
      payrollAdjustment: { status: { not: 'CANCELLED' } },
    },
    include: {
      payrollAdjustment: { select: { adjustmentType: true } },
    },
  })

  type AdjGroup = { additions: number; deductions: number }
  const adjByEmployee = new Map<string, AdjGroup>()
  for (const app of approvedApplications) {
    if (!adjByEmployee.has(app.employeeId)) {
      adjByEmployee.set(app.employeeId, { additions: 0, deductions: 0 })
    }
    const group = adjByEmployee.get(app.employeeId)!
    const amount = Number(app.appliedAmount)
    if (app.payrollAdjustment.adjustmentType === 'ADDITION') {
      group.additions += amount
    } else {
      group.deductions += amount
    }
  }

  const employeeRows: EmployeePayrollRow[] = []

  for (const [, group] of employeeMap) {
    const { employee, records } = group
    const wage = employee.wageHistory[0]
    if (!wage) continue

    const hourlyRate = Number(wage.hourlyRate)
    const weeklySalary = Number(wage.weeklySalary)

    const dailyRegular = records.map((r) => Number(r.regularHours))
    const dailyOT = records.map((r) => Number(r.overtimeHours))

    const { regularHours, regularPay } = calculateRegularPay(dailyRegular, hourlyRate)
    const { overtimeHours, overtimePay } = calculateOvertimePay(dailyOT, hourlyRate)
    const grossPay = regularPay + overtimePay

    const adjs = adjByEmployee.get(employee.id) ?? { additions: 0, deductions: 0 }
    const netPayable = calculateNetPayable(grossPay, adjs.additions, adjs.deductions)

    employeeRows.push({
      employeeId: employee.id,
      employeeCode: employee.employeeId,
      employeeName: employee.employeeName,
      designation: employee.designation,
      designationShort: employee.designationShort,
      site: employee.site,
      gPay: employee.gPay,
      bankAccount: employee.bankAccount,
      weeklySalaryUsed: weeklySalary,
      hourlyRateUsed: hourlyRate,
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      grossPay,
      additions: adjs.additions,
      deductions: adjs.deductions,
      netPayable,
    })
  }

  if (employeeRows.length === 0) {
    throw new PayrollServiceError('NO_EMPLOYEES', 'No employees with valid wage history for this week')
  }

  const totals: PayrollSummaryTotals = {
    totalRegularHours: employeeRows.reduce((s, r) => s + r.regularHours, 0),
    totalOvertimeHours: employeeRows.reduce((s, r) => s + r.overtimeHours, 0),
    totalRegularPay: employeeRows.reduce((s, r) => s + r.regularPay, 0),
    totalOvertimePay: employeeRows.reduce((s, r) => s + r.overtimePay, 0),
    totalAdditions: employeeRows.reduce((s, r) => s + r.additions, 0),
    totalDeductions: employeeRows.reduce((s, r) => s + r.deductions, 0),
    totalNetPayable: employeeRows.reduce((s, r) => s + r.netPayable, 0),
  }

  return { weekStart, weekEnd, employees: employeeRows, totals }
}

// ─── approvePayroll ───────────────────────────────────────────────────────────

export async function approvePayroll(summary: PayrollSummary): Promise<ApprovePayrollResult> {
  const existing = await prisma.payrollRun.findFirst({
    where: {
      payrollWeekStartDate: summary.weekStart,
      payrollWeekEndDate: summary.weekEnd,
      status: { in: ['APPROVED', 'REVISED'] },
    },
  })

  if (existing) {
    throw new PayrollServiceError('PAYROLL_ALREADY_EXISTS', 'Payroll for this week is already approved')
  }

  const { totals, weekStart, weekEnd, employees } = summary
  const now = new Date()

  const runId = randomUUID()
  const revisionId = randomUUID()

  const promises = [
    prisma.payrollRun.create({
      data: {
        id: runId,
        payrollWeekStartDate: weekStart,
        payrollWeekEndDate: weekEnd,
        status: 'APPROVED',
        currentRevisionNumber: 1,
        totalRegularPay: totals.totalRegularPay,
        totalOvertimePay: totals.totalOvertimePay,
        totalAdditions: totals.totalAdditions,
        totalDeductions: totals.totalDeductions,
        totalNetPayable: totals.totalNetPayable,
        approvedAt: now,
      },
    }),

    prisma.payrollRevision.create({
      data: {
        id: revisionId,
        payrollRunId: runId,
        revisionNumber: 1,
        status: 'APPROVED',
        isCurrent: true,
        totalRegularPay: totals.totalRegularPay,
        totalOvertimePay: totals.totalOvertimePay,
        totalAdditions: totals.totalAdditions,
        totalDeductions: totals.totalDeductions,
        totalNetPayable: totals.totalNetPayable,
        approvedAt: now,
      },
    }),

    prisma.payrollRunEmployee.createMany({
      data: employees.map((emp) => ({
        payrollRunId: runId,
        payrollRevisionId: revisionId,
        employeeId: emp.employeeId,
        weeklySalaryUsed: emp.weeklySalaryUsed,
        hourlyRateUsed: emp.hourlyRateUsed,
        regularHours: emp.regularHours,
        overtimeHours: emp.overtimeHours,
        regularPay: emp.regularPay,
        overtimePay: emp.overtimePay,
        additions: emp.additions,
        deductions: emp.deductions,
        netPayable: emp.netPayable,
      })),
    }),

    prisma.payrollAdjustmentApplication.updateMany({
      where: {
        payrollWeekStartDate: weekStart,
        approvalStatus: 'APPROVED',
        payrollRunId: null,
      },
      data: {
        payrollRunId: runId,
        payrollRevisionId: revisionId,
      },
    }),
  ]

  await prisma.$transaction(promises, { timeout: 30000 })

  return {
    payrollRunId: runId,
    payrollRevisionId: revisionId,
    revisionNumber: 1,
    approvedAt: now,
    totalNetPayable: Number(totals.totalNetPayable),
    employeeCount: employees.length,
  }
}
