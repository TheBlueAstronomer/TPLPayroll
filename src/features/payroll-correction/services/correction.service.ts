import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import {
  CorrectionServiceError,
  type InitiateCorrectionResult,
  type CreateRevisionInput,
  type CreateRevisionResult,
  type RevisionHistoryItem,
  type ApproveRevisionResult,
  type RevisedEmployeeRow,
} from '@/features/payroll-correction/types/correction.types'
import {
  calculateRegularPay,
  calculateOvertimePay,
  calculateNetPayable,
} from '@/features/payroll-generation/services/payroll.service'

// ─── prepareAdjustmentsForCorrection ───────────────────────────────────────────

export async function prepareAdjustmentsForCorrection(payrollRunId: string): Promise<void> {
  await prisma.payrollAdjustmentApplication.updateMany({
    where: { payrollRunId },
    data: {
      approvalStatus: 'PENDING',
      isReversed: false,
      approvedAt: null,
      skippedAt: null,
      // Note: We do NOT clear payrollRunId or payrollRevisionId as they track origin,
      // but resetting approvalStatus guarantees they show up for re-evaluation.
    },
  })
}

// ─── initiateCorrection ───────────────────────────────────────────────────────

export async function initiateCorrection(
  payrollRunId: string,
): Promise<InitiateCorrectionResult> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      revisions: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  })

  if (!run) {
    throw new CorrectionServiceError('PAYROLL_RUN_NOT_FOUND', `Payroll run "${payrollRunId}" not found`)
  }

  if (run.status !== 'APPROVED' && run.status !== 'REVISED') {
    throw new CorrectionServiceError(
      'CANNOT_CORRECT_UNAPPROVED_PAYROLL',
      `Cannot correct payroll with status "${run.status}"`,
    )
  }

  const currentRevision = run.revisions[0]
  if (!currentRevision) {
    throw new CorrectionServiceError('REVISION_NOT_FOUND', 'No current revision found for this payroll run')
  }

  // Load employee records for this revision
  const runEmployees = await prisma.payrollRunEmployee.findMany({
    where: { payrollRevisionId: currentRevision.id },
    include: {
      employee: {
        select: { employeeId: true, employeeName: true },
      },
    },
  })

  // Load adjustment applications for this week
  const adjustmentApps = await prisma.payrollAdjustmentApplication.findMany({
    where: {
      payrollWeekStartDate: run.payrollWeekStartDate,
      payrollRunId: run.id,
    },
    include: {
      payrollAdjustment: { select: { adjustmentType: true, amount: true, reason: true } },
      employee: { select: { employeeName: true, employeeId: true } },
    },
  })

  return {
    payrollRunId: run.id,
    revisionId: currentRevision.id,
    revisionNumber: currentRevision.revisionNumber,
    weekStart: run.payrollWeekStartDate,
    weekEnd: run.payrollWeekEndDate,
    totals: {
      totalRegularHours: runEmployees.reduce((s, r) => s + Number(r.regularHours), 0),
      totalOvertimeHours: runEmployees.reduce((s, r) => s + Number(r.overtimeHours), 0),
      totalRegularPay: Number(currentRevision.totalRegularPay),
      totalOvertimePay: Number(currentRevision.totalOvertimePay),
      totalAdditions: Number(currentRevision.totalAdditions),
      totalDeductions: Number(currentRevision.totalDeductions),
      totalNetPayable: Number(currentRevision.totalNetPayable),
    },
    employees: runEmployees.map((re) => ({
      employeeId: re.employeeId,
      employeeCode: re.employee.employeeId,
      employeeName: re.employee.employeeName,
      netPayable: Number(re.netPayable),
    })),
    adjustmentApplications: adjustmentApps.map((app) => ({
      applicationId: app.id,
      adjustmentId: app.payrollAdjustmentId,
      employeeId: app.employeeId,
      employeeName: app.employee.employeeName,
      employeeCode: app.employee.employeeId,
      adjustmentType: app.payrollAdjustment.adjustmentType as 'DEDUCTION' | 'ADDITION',
      amount: Number(app.payrollAdjustment.amount),
      appliedAmount: Number(app.appliedAmount),
      reason: app.payrollAdjustment.reason,
      approvalStatus: app.approvalStatus as 'PENDING' | 'APPROVED' | 'SKIPPED',
      isReversed: app.isReversed,
    })),
  }
}

// ─── reverseAdjustmentApplication ─────────────────────────────────────────────

export async function reverseAdjustmentApplication(
  applicationId: string,
): Promise<{ applicationId: string; isReversed: true }> {
  const app = await prisma.payrollAdjustmentApplication.findUnique({
    where: { id: applicationId },
  })

  if (!app) {
    throw new CorrectionServiceError('APPLICATION_NOT_FOUND', `Application "${applicationId}" not found`)
  }

  if (app.isReversed) {
    throw new CorrectionServiceError('ALREADY_REVERSED', 'Application is already reversed')
  }

  await prisma.payrollAdjustmentApplication.update({
    where: { id: applicationId },
    data: { isReversed: true },
  })

  return { applicationId, isReversed: true }
}

// ─── approveSkippedAdjustment ─────────────────────────────────────────────────

export async function approveSkippedAdjustment(
  applicationId: string,
): Promise<{ applicationId: string; approvalStatus: 'APPROVED' }> {
  const app = await prisma.payrollAdjustmentApplication.findUnique({
    where: { id: applicationId },
  })

  if (!app) {
    throw new CorrectionServiceError('APPLICATION_NOT_FOUND', `Application "${applicationId}" not found`)
  }

  if (app.approvalStatus !== 'SKIPPED') {
    throw new CorrectionServiceError(
      'CANNOT_APPROVE_NON_SKIPPED',
      `Cannot approve application with status "${app.approvalStatus}"`,
    )
  }

  await prisma.payrollAdjustmentApplication.update({
    where: { id: applicationId },
    data: {
      approvalStatus: 'APPROVED',
      appliedAt: new Date(),
    },
  })

  return { applicationId, approvalStatus: 'APPROVED' }
}

// ─── recalculateAndCreateRevision ─────────────────────────────────────────────

export async function recalculateAndCreateRevision(
  input: CreateRevisionInput,
): Promise<CreateRevisionResult> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: input.payrollRunId },
    include: {
      revisions: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  })

  if (!run) {
    throw new CorrectionServiceError('PAYROLL_RUN_NOT_FOUND', `Payroll run "${input.payrollRunId}" not found`)
  }

  if (input.correctionTypes.length === 0) {
    throw new CorrectionServiceError('NO_CORRECTION_TYPE_SELECTED', 'At least one correction type must be selected')
  }

  const currentRevision = run.revisions[0]
  if (!currentRevision) {
    throw new CorrectionServiceError('REVISION_NOT_FOUND', 'No current revision found')
  }

  const weekStart = run.payrollWeekStartDate
  const weekEnd = run.payrollWeekEndDate

  // Fetch the active attendance upload for this week
  const upload = await prisma.attendanceUpload.findFirst({
    where: {
      payrollWeekStartDate: weekStart,
      payrollWeekEndDate: weekEnd,
      isActiveForPayrollWeek: true,
    },
  })

  // Fetch attendance records
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { attendanceUploadId: upload?.id ?? '' },
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

  // Group attendance by employee
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

  // Get previous revision's employee data for diff tracking
  const previousEmployees = await prisma.payrollRunEmployee.findMany({
    where: { payrollRevisionId: currentRevision.id },
  })
  const prevByEmployee = new Map(previousEmployees.map((pe) => [pe.employeeId, pe]))

  // Apply adjustment changes (reversals)
  if (input.adjustmentChanges?.reversed?.length) {
    await prisma.payrollAdjustmentApplication.updateMany({
      where: { id: { in: input.adjustmentChanges.reversed } },
      data: { isReversed: true },
    })
  }

  // Apply adjustment changes (re-approvals)
  if (input.adjustmentChanges?.approved?.length) {
    await prisma.payrollAdjustmentApplication.updateMany({
      where: { id: { in: input.adjustmentChanges.approved } },
      data: { approvalStatus: 'APPROVED', appliedAt: new Date() },
    })
  }

  // Get approved, non-reversed adjustment applications for this week
  const approvedApplications = await prisma.payrollAdjustmentApplication.findMany({
    where: {
      payrollWeekStartDate: weekStart,
      approvalStatus: 'APPROVED',
      isReversed: false,
      employeeId: { in: [...employeeMap.keys()] },
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

  // Calculate payroll for each employee
  const employeeRows: RevisedEmployeeRow[] = []

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

    const prev = prevByEmployee.get(employee.id)

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
      previousNetPayable: prev ? Number(prev.netPayable) : null,
      previousRegularPay: prev ? Number(prev.regularPay) : null,
      previousOvertimePay: prev ? Number(prev.overtimePay) : null,
      previousAdditions: prev ? Number(prev.additions) : null,
      previousDeductions: prev ? Number(prev.deductions) : null,
    })
  }

  // Calculate totals
  const totals = {
    totalRegularHours: employeeRows.reduce((s, r) => s + r.regularHours, 0),
    totalOvertimeHours: employeeRows.reduce((s, r) => s + r.overtimeHours, 0),
    totalRegularPay: employeeRows.reduce((s, r) => s + r.regularPay, 0),
    totalOvertimePay: employeeRows.reduce((s, r) => s + r.overtimePay, 0),
    totalAdditions: employeeRows.reduce((s, r) => s + r.additions, 0),
    totalDeductions: employeeRows.reduce((s, r) => s + r.deductions, 0),
    totalNetPayable: employeeRows.reduce((s, r) => s + r.netPayable, 0),
  }

  const newRevisionNumber = currentRevision.revisionNumber + 1
  const now = new Date()

  const newRevisionId = randomUUID()

  // Create new revision in an array transaction
  const promises = [
    // Supersede current revision
    prisma.payrollRevision.update({
      where: { id: currentRevision.id },
      data: { isCurrent: false, status: 'SUPERSEDED' },
    }),

    // Create new revision
    prisma.payrollRevision.create({
      data: {
        id: newRevisionId,
        payrollRunId: run.id,
        revisionNumber: newRevisionNumber,
        status: 'APPROVED',
        isCurrent: true,
        correctionReason: input.correctionReason,
        totalRegularPay: totals.totalRegularPay,
        totalOvertimePay: totals.totalOvertimePay,
        totalAdditions: totals.totalAdditions,
        totalDeductions: totals.totalDeductions,
        totalNetPayable: totals.totalNetPayable,
        generatedAt: now,
        approvedAt: now,
      },
    }),

    // Create new employee records
    prisma.payrollRunEmployee.createMany({
      data: employeeRows.map((emp) => ({
        payrollRunId: run.id,
        payrollRevisionId: newRevisionId,
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

    // Update PayrollRun
    prisma.payrollRun.update({
      where: { id: run.id },
      data: {
        currentRevisionNumber: newRevisionNumber,
        status: 'REVISED',
        totalRegularPay: totals.totalRegularPay,
        totalOvertimePay: totals.totalOvertimePay,
        totalAdditions: totals.totalAdditions,
        totalDeductions: totals.totalDeductions,
        totalNetPayable: totals.totalNetPayable,
      },
    }),
  ]

  await prisma.$transaction(promises)

  return {
    payrollRunId: run.id,
    revisionId: newRevisionId,
    revisionNumber: newRevisionNumber,
    totals,
    employeeCount: employeeRows.length,
  }
}

// ─── approveRevision ──────────────────────────────────────────────────────────

export async function approveRevision(
  revisionId: string,
): Promise<ApproveRevisionResult> {
  const revision = await prisma.payrollRevision.findUnique({
    where: { id: revisionId },
  })

  if (!revision) {
    throw new CorrectionServiceError('REVISION_NOT_FOUND', `Revision "${revisionId}" not found`)
  }

  const now = new Date()

  const updated = await prisma.payrollRevision.update({
    where: { id: revisionId },
    data: {
      status: 'APPROVED',
      approvedAt: now,
    },
  })

  return {
    revisionId: updated.id,
    revisionNumber: updated.revisionNumber,
    status: 'APPROVED',
    approvedAt: now,
  }
}

// ─── getRevisionHistory ───────────────────────────────────────────────────────

export async function getRevisionHistory(
  payrollRunId: string,
): Promise<RevisionHistoryItem[]> {
  const revisions = await prisma.payrollRevision.findMany({
    where: { payrollRunId },
    orderBy: { revisionNumber: 'desc' },
  })

  return revisions.map((r) => ({
    revisionId: r.id,
    revisionNumber: r.revisionNumber,
    status: r.status as 'APPROVED' | 'SUPERSEDED',
    correctionReason: r.correctionReason,
    isCurrent: r.isCurrent,
    totalNetPayable: Number(r.totalNetPayable),
    totalRegularPay: Number(r.totalRegularPay),
    totalOvertimePay: Number(r.totalOvertimePay),
    totalAdditions: Number(r.totalAdditions),
    totalDeductions: Number(r.totalDeductions),
    approvedAt: r.approvedAt,
    generatedAt: r.generatedAt,
  }))
}

// ─── getRevisionEmployees ─────────────────────────────────────────────────────

export async function getRevisionEmployees(
  revisionId: string,
  previousRevisionId?: string,
): Promise<RevisedEmployeeRow[]> {
  const employees = await prisma.payrollRunEmployee.findMany({
    where: { payrollRevisionId: revisionId },
    include: {
      employee: {
        select: {
          employeeId: true,
          employeeName: true,
          designation: true,
          designationShort: true,
          site: true,
          gPay: true,
          bankAccount: true,
        },
      },
    },
    orderBy: { employee: { employeeId: 'asc' } },
  })

  // Load previous revision employees for diff if provided
  let prevByEmployee = new Map<string, { netPayable: number; regularPay: number; overtimePay: number; additions: number; deductions: number }>()
  if (previousRevisionId) {
    const prevEmployees = await prisma.payrollRunEmployee.findMany({
      where: { payrollRevisionId: previousRevisionId },
    })
    prevByEmployee = new Map(
      prevEmployees.map((pe) => [
        pe.employeeId,
        {
          netPayable: Number(pe.netPayable),
          regularPay: Number(pe.regularPay),
          overtimePay: Number(pe.overtimePay),
          additions: Number(pe.additions),
          deductions: Number(pe.deductions),
        },
      ]),
    )
  }

  return employees.map((re) => {
    const prev = prevByEmployee.get(re.employeeId)
    return {
      employeeId: re.employeeId,
      employeeCode: re.employee.employeeId,
      employeeName: re.employee.employeeName,
      designation: re.employee.designation,
      designationShort: re.employee.designationShort,
      site: re.employee.site,
      gPay: re.employee.gPay,
      bankAccount: re.employee.bankAccount,
      weeklySalaryUsed: Number(re.weeklySalaryUsed),
      hourlyRateUsed: Number(re.hourlyRateUsed),
      regularHours: Number(re.regularHours),
      overtimeHours: Number(re.overtimeHours),
      regularPay: Number(re.regularPay),
      overtimePay: Number(re.overtimePay),
      grossPay: Number(re.regularPay) + Number(re.overtimePay),
      additions: Number(re.additions),
      deductions: Number(re.deductions),
      netPayable: Number(re.netPayable),
      previousNetPayable: prev?.netPayable ?? null,
      previousRegularPay: prev?.regularPay ?? null,
      previousOvertimePay: prev?.overtimePay ?? null,
      previousAdditions: prev?.additions ?? null,
      previousDeductions: prev?.deductions ?? null,
    }
  })
}
