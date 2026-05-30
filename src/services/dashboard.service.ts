import prisma from '@/lib/prisma'

/**
 * Returns the count of currently active employees (isActive = true).
 */
export async function countActiveEmployees(): Promise<number> {
  return prisma.employee.count({
    where: { isActive: true },
  })
}

/**
 * Returns the totalNetPayable from the most recently approved payroll run's
 * current revision (isCurrent = true). Returns 0 if no approved run exists.
 */
export async function getLatestPayrollTotal(): Promise<number> {
  const revision = await prisma.payrollRevision.findFirst({
    where: {
      isCurrent: true,
      status: 'APPROVED',
      payrollRun: {
        status: { in: ['APPROVED', 'REVISED'] },
      },
    },
    orderBy: {
      approvedAt: 'desc',
    },
    select: {
      totalNetPayable: true,
    },
  })

  if (!revision) return 0

  return Number(revision.totalNetPayable)
}

/**
 * Returns the count of active attendance uploads that have blocking errors.
 * An upload is considered to have blocking errors if its status is not
 * 'PROCESSED' or 'CLEAN' (i.e., it is in an error or unresolved state).
 */
export async function countPendingAttendanceErrors(): Promise<number> {
  return prisma.attendanceUpload.count({
    where: {
      isActiveForPayrollWeek: true,
      status: {
        notIn: ['PROCESSED', 'CLEAN', 'COMPLETED'],
      },
    },
  })
}

/**
 * Returns the count of PayrollAdjustmentApplication records with
 * approvalStatus = 'PENDING'.
 */
export async function countPendingAdjustmentApprovals(): Promise<number> {
  return prisma.payrollAdjustmentApplication.count({
    where: {
      approvalStatus: 'PENDING',
    },
  })
}
