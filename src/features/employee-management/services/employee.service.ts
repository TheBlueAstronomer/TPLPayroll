import prisma from '@/lib/prisma'
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  BulkStatusUpdateSchema,
  BulkHourlyRateUpdateSchema,
  EmployeeServiceError,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type BulkStatusUpdateInput,
  type BulkHourlyRateUpdateInput,
  type BulkOperationResult,
  type EmployeeListOptions,
  type PaginatedEmployeeList,
  type EmployeeListItem,
  type EmployeeRecord,
  type WageHistoryEntry,
  type EmployeeStatus,
} from '@/features/employee-management/types/employee.types'

// ─── Helper: compute status ───────────────────────────────────────────────────

function computeStatus(employee: {
  isActive: boolean
  dateOfResignation: Date | null
}): EmployeeStatus {
  if (employee.dateOfResignation != null) return 'RESIGNED'
  if (!employee.isActive) return 'INACTIVE'
  return 'ACTIVE'
}

// ─── Helper: build Prisma where clause from list options ──────────────────────

function buildWhereClause(options: EmployeeListOptions) {
  const where: Record<string, unknown> = {}

  // Status filter
  if (options.status && options.status !== 'ALL') {
    if (options.status === 'ACTIVE') {
      where.isActive = true
      where.dateOfResignation = null
    } else if (options.status === 'INACTIVE') {
      where.isActive = false
      where.dateOfResignation = null
    } else if (options.status === 'RESIGNED') {
      where.dateOfResignation = { not: null }
    }
  }

  // Search filter (name OR employeeId, case-insensitive partial match)
  if (options.search && options.search.trim() !== '') {
    where.OR = [
      { employeeName: { contains: options.search, mode: 'insensitive' } },
      { employeeId: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  return where
}

// ─── createEmployee ───────────────────────────────────────────────────────────

export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeRecord> {
  // Validate input
  const parsed = CreateEmployeeSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0]
    throw new EmployeeServiceError(
      'VALIDATION_ERROR',
      firstIssue?.message ?? 'Invalid employee data'
    )
  }

  // Check for duplicate employeeId
  const existing = await prisma.employee.findUnique({
    where: { employeeId: parsed.data.employeeId },
  })
  if (existing) {
    throw new EmployeeServiceError(
      'DUPLICATE_EMPLOYEE_ID',
      `Employee ID "${parsed.data.employeeId}" already exists`
    )
  }

  const today = new Date()

  const employee = await prisma.$transaction(async (tx) => {
    // 1. Create the employee record
    const created = await tx.employee.create({
      data: {
        employeeId: parsed.data.employeeId,
        employeeName: parsed.data.employeeName,
        designation: parsed.data.designation,
        designationShort: parsed.data.designationShort ?? null,
        nationalId: parsed.data.nationalId ?? null,
        aadhaarId: parsed.data.aadhaarId ?? null,
        policeVerificationId: parsed.data.policeVerificationId ?? null,
        phone: parsed.data.phone ?? null,
        dateOfBirth: parsed.data.dateOfBirth ?? null,
        dateOfJoining: parsed.data.dateOfJoining ?? null,
        site: parsed.data.site ?? null,
        healthCardId: parsed.data.healthCardId ?? null,
        gPay: parsed.data.gPay ?? null,
        bankAccount: parsed.data.bankAccount ?? null,
        dateOfResignation: parsed.data.dateOfResignation ?? null,
        isActive: parsed.data.isActive,
      },
    })

    // 2. Create initial wage history
    await tx.employeeWageHistory.create({
      data: {
        employeeId: created.id,
        weeklySalary: parsed.data.salary,
        hourlyRate: parsed.data.hourlyRate,
        effectiveFrom: today,
        effectiveTo: null,
        changeSource: 'MANUAL',
      },
    })

    // 3. Create audit log
    await tx.auditLog.create({
      data: {
        actionType: 'CREATE',
        entityType: 'EMPLOYEE',
        entityId: created.id,
        detailsJson: {
          employeeId: created.employeeId,
          employeeName: created.employeeName,
          designation: created.designation,
          designationShort: created.designationShort ?? null,
          nationalId: created.nationalId ?? null,
          aadhaarId: created.aadhaarId ?? null,
          policeVerificationId: created.policeVerificationId ?? null,
          phone: created.phone ?? null,
          dateOfBirth: created.dateOfBirth ?? null,
          dateOfJoining: created.dateOfJoining ?? null,
          site: created.site ?? null,
          healthCardId: created.healthCardId ?? null,
          gPay: created.gPay ?? null,
          bankAccount: created.bankAccount ?? null,
          dateOfResignation: created.dateOfResignation ?? null,
          isActive: created.isActive,
          salary: parsed.data.salary,
          hourlyRate: parsed.data.hourlyRate,
          changeSource: 'MANUAL',
        },
      },
    })

    return created
  })

  return employee as EmployeeRecord
}

// ─── getEmployeeList ──────────────────────────────────────────────────────────

export async function getEmployeeList(options: EmployeeListOptions): Promise<PaginatedEmployeeList> {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const skip = (page - 1) * limit

  const where = buildWhereClause(options)

  const [totalCount, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: { employeeName: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        employeeId: true,
        employeeName: true,
        designation: true,
        designationShort: true,
        site: true,
        isActive: true,
        dateOfResignation: true,
      },
    }),
  ])

  const employees: EmployeeListItem[] = rows.map((row) => ({
    ...row,
    status: computeStatus(row),
  }))

  return { employees, totalCount, page, limit }
}

// ─── getEmployeeById ──────────────────────────────────────────────────────────

export async function getEmployeeById(id: string): Promise<EmployeeRecord> {
  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) {
    throw new EmployeeServiceError('EMPLOYEE_NOT_FOUND', `Employee with id "${id}" not found`)
  }
  return employee as EmployeeRecord
}

// ─── getEmployeeWageHistory ───────────────────────────────────────────────────

export async function getEmployeeWageHistory(employeeId: string): Promise<WageHistoryEntry[]> {
  const entries = await prisma.employeeWageHistory.findMany({
    where: { employeeId },
    orderBy: { effectiveFrom: 'desc' },
  })

  return entries.map((e) => ({
    id: e.id,
    employeeId: e.employeeId,
    weeklySalary: Number(e.weeklySalary),
    hourlyRate: Number(e.hourlyRate),
    effectiveFrom: e.effectiveFrom,
    effectiveTo: e.effectiveTo,
    changeSource: e.changeSource,
  }))
}

// ─── updateEmployee ───────────────────────────────────────────────────────────

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput
): Promise<EmployeeRecord> {
  // Validate input
  const parsed = UpdateEmployeeSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0]
    throw new EmployeeServiceError(
      'VALIDATION_ERROR',
      firstIssue?.message ?? 'Invalid employee data'
    )
  }

  // Ensure employee exists
  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) {
    throw new EmployeeServiceError('EMPLOYEE_NOT_FOUND', `Employee with id "${id}" not found`)
  }

  // Fetch current wage history to detect wage changes
  const currentWageHistory = await prisma.employeeWageHistory.findMany({
    where: { employeeId: id },
    orderBy: { effectiveFrom: 'desc' },
    take: 1,
  })
  const currentWage = currentWageHistory[0]

  const newSalary = parsed.data.salary
  const newHourlyRate = parsed.data.hourlyRate
  const salaryChanged =
    newSalary !== undefined && currentWage && Number(currentWage.weeklySalary) !== newSalary
  const hourlyChanged =
    newHourlyRate !== undefined && currentWage && Number(currentWage.hourlyRate) !== newHourlyRate
  const wageChanged = salaryChanged || hourlyChanged

  const today = new Date()

  const nonWageFields = [
    'employeeName', 'designation', 'designationShort', 'nationalId', 'aadhaarId',
    'policeVerificationId', 'phone', 'dateOfBirth', 'dateOfJoining', 'site',
    'healthCardId', 'gPay', 'bankAccount', 'dateOfResignation', 'isActive',
  ] as const

  const changedFields: Record<string, { old: unknown; new: unknown }> = {}

  for (const field of nonWageFields) {
    const newValue = parsed.data[field]
    if (newValue === undefined) continue
    const oldVal = existing[field]
    if (String(oldVal) !== String(newValue)) {
      changedFields[field] = { old: oldVal, new: newValue }
    }
  }

  if (salaryChanged && currentWage) {
    changedFields.salary = { old: Number(currentWage.weeklySalary), new: newSalary }
  }
  if (hourlyChanged && currentWage) {
    changedFields.hourlyRate = { old: Number(currentWage.hourlyRate), new: newHourlyRate }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update the employee record
    const updatedEmployee = await tx.employee.update({
      where: { id },
      data: {
        ...(parsed.data.employeeName !== undefined && { employeeName: parsed.data.employeeName }),
        ...(parsed.data.designation !== undefined && { designation: parsed.data.designation }),
        ...(parsed.data.designationShort !== undefined && { designationShort: parsed.data.designationShort }),
        ...(parsed.data.nationalId !== undefined && { nationalId: parsed.data.nationalId }),
        ...(parsed.data.aadhaarId !== undefined && { aadhaarId: parsed.data.aadhaarId }),
        ...(parsed.data.policeVerificationId !== undefined && { policeVerificationId: parsed.data.policeVerificationId }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.dateOfBirth !== undefined && { dateOfBirth: parsed.data.dateOfBirth }),
        ...(parsed.data.dateOfJoining !== undefined && { dateOfJoining: parsed.data.dateOfJoining }),
        ...(parsed.data.site !== undefined && { site: parsed.data.site }),
        ...(parsed.data.healthCardId !== undefined && { healthCardId: parsed.data.healthCardId }),
        ...(parsed.data.gPay !== undefined && { gPay: parsed.data.gPay }),
        ...(parsed.data.bankAccount !== undefined && { bankAccount: parsed.data.bankAccount }),
        ...(parsed.data.dateOfResignation !== undefined && { dateOfResignation: parsed.data.dateOfResignation }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
    })

    // 2. Handle wage history if salary or hourly rate changed
    if (wageChanged) {
      // Close previous open wage history entry
      await tx.employeeWageHistory.updateMany({
        where: { employeeId: id, effectiveTo: null },
        data: { effectiveTo: today },
      })

      // Create new wage history entry
      const newWageHistory = await tx.employeeWageHistory.create({
        data: {
          employeeId: id,
          weeklySalary: newSalary ?? Number(currentWage.weeklySalary),
          hourlyRate: newHourlyRate ?? Number(currentWage.hourlyRate),
          effectiveFrom: today,
          effectiveTo: null,
          changeSource: 'MANUAL',
        },
      })

      await tx.auditLog.create({
        data: {
          actionType: 'UPDATE',
          entityType: 'WAGE_HISTORY',
          entityId: newWageHistory?.id ?? '',
          detailsJson: {
            employeeId: id,
            oldSalary: Number(currentWage.weeklySalary),
            newSalary: newSalary ?? Number(currentWage.weeklySalary),
            oldHourlyRate: Number(currentWage.hourlyRate),
            newHourlyRate: newHourlyRate ?? Number(currentWage.hourlyRate),
            effectiveFrom: today,
            changeSource: 'MANUAL',
          },
        },
      })
    }

    // 3. Create audit log
    await tx.auditLog.create({
      data: {
        actionType: 'UPDATE',
        entityType: 'EMPLOYEE',
        entityId: id,
        detailsJson: {
          changedFields,
          changeSource: 'MANUAL',
        },
      },
    })

    return updatedEmployee
  })

  return updated as EmployeeRecord
}

// ─── bulkUpdateStatus ─────────────────────────────────────────────────────────

export async function bulkUpdateStatus(input: BulkStatusUpdateInput): Promise<BulkOperationResult> {
  const parsed = BulkStatusUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0]
    throw new EmployeeServiceError(
      'VALIDATION_ERROR',
      firstIssue?.message ?? 'Invalid bulk status update data'
    )
  }

  const result: BulkOperationResult = { succeeded: 0, skipped: 0, failed: 0, errors: [] }

  for (const id of parsed.data.ids) {
    try {
      // Fetch employee
      const employee = await prisma.employee.findUnique({ where: { id } })
      if (!employee) {
        result.failed++
        result.errors.push({ employeeId: id, error: `Employee with id "${id}" not found` })
        continue
      }

      if (parsed.data.status === 'INACTIVE') {
        // Skip already-inactive employees
        if (!employee.isActive) {
          result.skipped++
          continue
        }

        await prisma.$transaction(async (tx) => {
          await tx.employee.update({
            where: { id },
            data: { isActive: false },
          })
          await tx.auditLog.create({
            data: {
              actionType: 'UPDATE',
              entityType: 'EMPLOYEE',
              entityId: id,
              detailsJson: {
                bulkAction: 'MARK_INACTIVE',
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                changeSource: 'BULK',
              },
            },
          })
        })
      } else {
        // RESIGNED
        await prisma.$transaction(async (tx) => {
          await tx.employee.update({
            where: { id },
            data: { dateOfResignation: parsed.data.dateOfResignation! },
          })
          await tx.auditLog.create({
            data: {
              actionType: 'UPDATE',
              entityType: 'EMPLOYEE',
              entityId: id,
              detailsJson: {
                bulkAction: 'MARK_RESIGNED',
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                dateOfResignation: parsed.data.dateOfResignation,
                changeSource: 'BULK',
              },
            },
          })
        })
      }

      result.succeeded++
    } catch (error) {
      result.failed++
      result.errors.push({
        employeeId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

// ─── bulkUpdateHourlyRate ─────────────────────────────────────────────────────

export async function bulkUpdateHourlyRate(input: BulkHourlyRateUpdateInput): Promise<BulkOperationResult> {
  const parsed = BulkHourlyRateUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0]
    throw new EmployeeServiceError(
      'VALIDATION_ERROR',
      firstIssue?.message ?? 'Invalid bulk hourly rate update data'
    )
  }

  const effectiveDate = parsed.data.effectiveFrom ?? new Date()
  const result: BulkOperationResult = { succeeded: 0, skipped: 0, failed: 0, errors: [] }

  for (const id of parsed.data.ids) {
    try {
      // Fetch employee
      const employee = await prisma.employee.findUnique({ where: { id } })
      if (!employee) {
        result.failed++
        result.errors.push({ employeeId: id, error: `Employee with id "${id}" not found` })
        continue
      }

      // Fetch current wage history
      const currentWageEntries = await prisma.employeeWageHistory.findMany({
        where: { employeeId: id },
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      })
      const currentWage = currentWageEntries[0]

      // Skip if rate already matches
      if (currentWage && Number(currentWage.hourlyRate) === parsed.data.newHourlyRate) {
        result.skipped++
        continue
      }

      await prisma.$transaction(async (tx) => {
        // Close previous open wage history entry
        await tx.employeeWageHistory.updateMany({
          where: { employeeId: id, effectiveTo: null },
          data: { effectiveTo: effectiveDate },
        })

        // Create new wage history entry
        const newWageEntry = await tx.employeeWageHistory.create({
          data: {
            employeeId: id,
            weeklySalary: currentWage ? Number(currentWage.weeklySalary) : 0,
            hourlyRate: parsed.data.newHourlyRate,
            effectiveFrom: effectiveDate,
            effectiveTo: null,
            changeSource: 'BULK',
          },
        })

        // Create audit log
        await tx.auditLog.create({
          data: {
            actionType: 'UPDATE',
            entityType: 'WAGE_HISTORY',
            entityId: newWageEntry?.id ?? '',
            detailsJson: {
              bulkAction: 'CHANGE_HOURLY_RATE',
              employeeId: employee.employeeId,
              employeeName: employee.employeeName,
              oldHourlyRate: currentWage ? Number(currentWage.hourlyRate) : null,
              newHourlyRate: parsed.data.newHourlyRate,
              effectiveFrom: effectiveDate,
              changeSource: 'BULK',
            },
          },
        })
      })

      result.succeeded++
    } catch (error) {
      result.failed++
      result.errors.push({
        employeeId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}
