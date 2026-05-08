import prisma from '@/lib/prisma'
import {
  CreateAdjustmentSchema,
  AdjustmentServiceError,
  type CreateAdjustmentInput,
  type AdjustmentListOptions,
  type PaginatedAdjustmentList,
  type AdjustmentListItem,
  type AdjustmentDetailRecord,
  type AdjustmentApplicationRecord,
  type WeeklyReviewItem,
} from '@/features/payroll-adjustments/types/adjustment.types'

// ─── Helper: add 7 days ───────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ─── Helper: build where clause ───────────────────────────────────────────────

function buildWhereClause(options: AdjustmentListOptions) {
  const where: Record<string, unknown> = {}

  if (options.status && options.status !== 'ALL') {
    where.status = options.status
  }
  if (options.type && options.type !== 'ALL') {
    where.adjustmentType = options.type
  }
  if (options.search?.trim()) {
    where.employee = {
      employeeName: { contains: options.search.trim(), mode: 'insensitive' },
    }
  }

  return where
}

// ─── createAdjustment ─────────────────────────────────────────────────────────

export async function createAdjustment(input: CreateAdjustmentInput) {
  const parsed = CreateAdjustmentSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues?.[0]
    throw new AdjustmentServiceError('VALIDATION_ERROR', first?.message ?? 'Invalid adjustment data')
  }

  const employee = await prisma.employee.findUnique({ where: { id: parsed.data.employeeId } })
  if (!employee) {
    throw new AdjustmentServiceError('EMPLOYEE_NOT_FOUND', 'Employee not found')
  }

  const d = parsed.data

  const isTotalBalance = d.recurrenceType === 'RECURRING' && d.recurrenceEndType === 'TOTAL_BALANCE'

  const result = await prisma.$transaction(async (tx) => {
    const adjustment = await tx.payrollAdjustment.create({
      data: {
        employeeId: d.employeeId,
        adjustmentType: d.adjustmentType,
        recurrenceType: d.recurrenceType,
        amount: d.amount,
        reason: d.reason,
        startPayrollWeekStartDate: d.startPayrollWeekStartDate,
        startPayrollWeekEndDate: d.startPayrollWeekEndDate,
        recurrenceEndType: d.recurrenceEndType ?? null,
        endPayrollWeekStartDate: d.endPayrollWeekStartDate ?? null,
        endPayrollWeekEndDate: d.endPayrollWeekEndDate ?? null,
        totalRecurrenceWeeks: d.totalRecurrenceWeeks ?? null,
        totalBalance: d.totalBalance ?? null,
        remainingBalance: isTotalBalance ? (d.totalBalance ?? null) : null,
        status: 'ACTIVE',
        skippedCarryForwardCount: 0,
      },
    })

    await tx.payrollAdjustmentApplication.create({
      data: {
        payrollAdjustmentId: adjustment.id,
        employeeId: d.employeeId,
        payrollWeekStartDate: d.startPayrollWeekStartDate,
        payrollWeekEndDate: d.startPayrollWeekEndDate,
        appliedAmount: d.amount,
        approvalStatus: 'PENDING',
      },
    })

    return adjustment
  })

  return {
    ...result,
    amount: Number(result.amount),
    totalBalance: result.totalBalance != null ? Number(result.totalBalance) : null,
    remainingBalance: result.remainingBalance != null ? Number(result.remainingBalance) : null,
  }
}

// ─── getAdjustmentList ────────────────────────────────────────────────────────

export async function getAdjustmentList(options: AdjustmentListOptions): Promise<PaginatedAdjustmentList> {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const skip = (page - 1) * limit
  const where = buildWhereClause(options)

  const [totalCount, rows] = await Promise.all([
    prisma.payrollAdjustment.count({ where }),
    prisma.payrollAdjustment.findMany({
      where,
      include: {
        employee: { select: { employeeName: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  const adjustments: AdjustmentListItem[] = rows.map((row) => ({
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee.employeeName,
    employeeCode: row.employee.employeeId,
    adjustmentType: row.adjustmentType as AdjustmentListItem['adjustmentType'],
    recurrenceType: row.recurrenceType as AdjustmentListItem['recurrenceType'],
    amount: Number(row.amount),
    reason: row.reason,
    status: row.status as AdjustmentListItem['status'],
    skippedCarryForwardCount: row.skippedCarryForwardCount,
    startPayrollWeekStartDate: row.startPayrollWeekStartDate,
    startPayrollWeekEndDate: row.startPayrollWeekEndDate,
    createdAt: row.createdAt,
  }))

  return { adjustments, totalCount, page, limit }
}

// ─── getAdjustmentDetail ──────────────────────────────────────────────────────

export async function getAdjustmentDetail(id: string): Promise<AdjustmentDetailRecord> {
  const adj = await prisma.payrollAdjustment.findUnique({
    where: { id },
    include: {
      employee: { select: { employeeName: true, employeeId: true } },
      adjustmentApplications: { orderBy: { payrollWeekStartDate: 'asc' } },
    },
  })

  if (!adj) {
    throw new AdjustmentServiceError('ADJUSTMENT_NOT_FOUND', `Adjustment "${id}" not found`)
  }

  const applications: AdjustmentApplicationRecord[] = adj.adjustmentApplications.map((a) => ({
    id: a.id,
    payrollAdjustmentId: a.payrollAdjustmentId,
    employeeId: a.employeeId,
    payrollWeekStartDate: a.payrollWeekStartDate,
    payrollWeekEndDate: a.payrollWeekEndDate,
    appliedAmount: Number(a.appliedAmount),
    approvalStatus: a.approvalStatus as AdjustmentApplicationRecord['approvalStatus'],
    approvedAt: a.approvedAt,
    appliedAt: a.appliedAt,
    skippedAt: a.skippedAt,
    carriedForwardToPayrollWeekStartDate: a.carriedForwardToPayrollWeekStartDate,
    isReversed: a.isReversed,
  }))

  return {
    id: adj.id,
    employeeId: adj.employeeId,
    employeeName: adj.employee.employeeName,
    employeeCode: adj.employee.employeeId,
    adjustmentType: adj.adjustmentType as AdjustmentDetailRecord['adjustmentType'],
    recurrenceType: adj.recurrenceType as AdjustmentDetailRecord['recurrenceType'],
    amount: Number(adj.amount),
    reason: adj.reason,
    status: adj.status as AdjustmentDetailRecord['status'],
    startPayrollWeekStartDate: adj.startPayrollWeekStartDate,
    startPayrollWeekEndDate: adj.startPayrollWeekEndDate,
    endPayrollWeekStartDate: adj.endPayrollWeekStartDate,
    endPayrollWeekEndDate: adj.endPayrollWeekEndDate,
    totalRecurrenceWeeks: adj.totalRecurrenceWeeks,
    totalBalance: adj.totalBalance != null ? Number(adj.totalBalance) : null,
    remainingBalance: adj.remainingBalance != null ? Number(adj.remainingBalance) : null,
    recurrenceEndType: adj.recurrenceEndType as AdjustmentDetailRecord['recurrenceEndType'],
    skippedCarryForwardCount: adj.skippedCarryForwardCount,
    createdAt: adj.createdAt,
    applications,
  }
}

// ─── approveAdjustmentApplication ────────────────────────────────────────────

export async function approveAdjustmentApplication(applicationId: string) {
  const app = await prisma.payrollAdjustmentApplication.findUnique({
    where: { id: applicationId },
    include: { payrollAdjustment: true },
  })

  if (!app) {
    throw new AdjustmentServiceError('APPLICATION_NOT_FOUND', `Application "${applicationId}" not found`)
  }
  if (app.approvalStatus !== 'PENDING') {
    throw new AdjustmentServiceError(
      'INVALID_APPROVAL_STATUS',
      `Application is already ${app.approvalStatus.toLowerCase()}`,
    )
  }

  const adj = app.payrollAdjustment
  const isTotalBalance = adj.recurrenceEndType === 'TOTAL_BALANCE'

  let appliedAmount = Number(adj.amount)
  let newRemainingBalance: number | null = null
  let adjustmentCompleted = false

  if (isTotalBalance && adj.remainingBalance != null) {
    const remaining = Number(adj.remainingBalance)
    appliedAmount = Math.min(appliedAmount, remaining)
    newRemainingBalance = remaining - appliedAmount
    adjustmentCompleted = newRemainingBalance <= 0
  }

  const now = new Date()

  const updated = await prisma.payrollAdjustmentApplication.update({
    where: { id: applicationId },
    data: {
      approvalStatus: 'APPROVED',
      appliedAt: now,
      appliedAmount,
    },
  })

  if (isTotalBalance) {
    await prisma.payrollAdjustment.update({
      where: { id: adj.id },
      data: {
        remainingBalance: newRemainingBalance ?? 0,
        ...(adjustmentCompleted ? { status: 'COMPLETED' } : {}),
      },
    })
  }

  return {
    ...updated,
    appliedAmount: Number(updated.appliedAmount),
    approvalStatus: updated.approvalStatus as 'APPROVED',
    appliedAt: updated.appliedAt,
  }
}

// ─── skipAdjustmentApplication ───────────────────────────────────────────────

export async function skipAdjustmentApplication(applicationId: string) {
  const app = await prisma.payrollAdjustmentApplication.findUnique({
    where: { id: applicationId },
    include: { payrollAdjustment: true },
  })

  if (!app) {
    throw new AdjustmentServiceError('APPLICATION_NOT_FOUND', `Application "${applicationId}" not found`)
  }
  if (app.approvalStatus !== 'PENDING') {
    throw new AdjustmentServiceError(
      'INVALID_APPROVAL_STATUS',
      `Application is already ${app.approvalStatus.toLowerCase()}`,
    )
  }

  const adj = app.payrollAdjustment
  const now = new Date()

  const nextWeekStart = addDays(app.payrollWeekStartDate, 7)
  const nextWeekEnd = addDays(app.payrollWeekEndDate, 7)

  const updated = await prisma.payrollAdjustmentApplication.update({
    where: { id: applicationId },
    data: {
      approvalStatus: 'SKIPPED',
      skippedAt: now,
      carriedForwardToPayrollWeekStartDate: nextWeekStart,
    },
  })

  await prisma.payrollAdjustmentApplication.create({
    data: {
      payrollAdjustmentId: adj.id,
      employeeId: app.employeeId,
      payrollWeekStartDate: nextWeekStart,
      payrollWeekEndDate: nextWeekEnd,
      appliedAmount: Number(adj.amount),
      approvalStatus: 'PENDING',
    },
  })

  await prisma.payrollAdjustment.update({
    where: { id: adj.id },
    data: {
      skippedCarryForwardCount: adj.skippedCarryForwardCount + 1,
    },
  })

  return {
    ...updated,
    approvalStatus: updated.approvalStatus as 'SKIPPED',
    skippedAt: updated.skippedAt,
    appliedAmount: Number(updated.appliedAmount),
  }
}

// ─── getAdjustmentsForWeekReview (used by F06) ────────────────────────────────

export async function getAdjustmentsForWeekReview(
  weekStartDate: Date,
): Promise<WeeklyReviewItem[]> {
  const rows = await prisma.payrollAdjustmentApplication.findMany({
    where: {
      payrollWeekStartDate: weekStartDate,
      approvalStatus: 'PENDING',
    },
    include: {
      payrollAdjustment: true,
      employee: { select: { employeeName: true, employeeId: true } },
    },
  })

  return rows.map((row) => {
    const adjAmount = Number(row.payrollAdjustment.amount)
    const remaining =
      row.payrollAdjustment.recurrenceEndType === 'TOTAL_BALANCE' &&
      row.payrollAdjustment.remainingBalance != null
        ? Number(row.payrollAdjustment.remainingBalance)
        : null
    const appliedAmount = remaining != null ? Math.min(adjAmount, remaining) : adjAmount

    return {
      applicationId: row.id,
      adjustmentId: row.payrollAdjustmentId,
      employeeId: row.employeeId,
      employeeName: row.employee.employeeName,
      employeeCode: row.employee.employeeId,
      adjustmentType: row.payrollAdjustment.adjustmentType as WeeklyReviewItem['adjustmentType'],
      amount: adjAmount,
      appliedAmount,
      reason: row.payrollAdjustment.reason,
      recurrenceType: row.payrollAdjustment.recurrenceType as WeeklyReviewItem['recurrenceType'],
      approvalStatus: row.approvalStatus as WeeklyReviewItem['approvalStatus'],
      payrollWeekStartDate: row.payrollWeekStartDate,
      payrollWeekEndDate: row.payrollWeekEndDate,
    }
  })
}
