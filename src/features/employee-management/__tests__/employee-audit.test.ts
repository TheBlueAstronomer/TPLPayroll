import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Employee, EmployeeWageHistory } from '@prisma/client'

// ─── Mock Prisma ─────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  default: {
    employee: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    employeeWageHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import prisma from '@/lib/prisma'
import {
  createEmployee,
  updateEmployee,
} from '@/features/employee-management/services/employee.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'uuid-1',
  employeeImportBatchId: null,
  employeeId: 'EMP-100',
  serialNumber: null,
  employeeName: 'Ravi Kumar',
  nationalId: null,
  designation: 'Guard',
  dateOfJoining: null,
  aadhaarId: null,
  policeVerificationId: null,
  phone: null,
  dateOfBirth: null,
  healthCardId: null,
  gPay: null,
  bankAccount: null,
  dateOfResignation: null,
  site: 'North Gate',
  isActive: true,
  designationShort: 'GRD',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

const makeWageHistory = (overrides: Partial<EmployeeWageHistory> = {}): EmployeeWageHistory => ({
  id: 'wh-uuid-1',
  employeeId: 'uuid-1',
  weeklySalary: 12000 as unknown as EmployeeWageHistory['weeklySalary'],
  hourlyRate: 62.5 as unknown as EmployeeWageHistory['hourlyRate'],
  effectiveFrom: new Date('2025-01-01'),
  effectiveTo: null,
  changeSource: 'MANUAL',
  employeeImportBatchId: null,
  changedBy: null,
  createdAt: new Date('2025-01-01'),
  ...overrides,
})

const validInput = {
  employeeId: 'EMP-100',
  employeeName: 'Ravi Kumar',
  designation: 'Guard',
  salary: 12000,
  hourlyRate: 62.5,
  isActive: true,
}

// ─────────────────────────────────────────────────────────────────────────────
// US-11.1: createEmployee audit log — detailsJson contains all initial fields
// ─────────────────────────────────────────────────────────────────────────────

describe('createEmployee — audit log detailsJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores all initial fields in detailsJson', async () => {
    // GIVEN employee created with employeeName="Ravi Kumar", designation="Guard",
    //       salary=12000, hourlyRate=62.5
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(null)

    let capturedAuditLog: unknown = null
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const mockTx = {
        employee: { create: vi.fn().mockResolvedValue(makeEmployee()) },
        employeeWageHistory: { create: vi.fn().mockResolvedValue(makeWageHistory()) },
        auditLog: {
          create: vi.fn().mockImplementation((args: unknown) => {
            capturedAuditLog = args
          }),
        },
      }
      return fn(mockTx as unknown as typeof prisma)
    })

    // WHEN createEmployee is called
    await createEmployee(validInput)

    // THEN detailsJson contains { employeeName, designation, salary, hourlyRate }
    expect(capturedAuditLog).toMatchObject({
      data: expect.objectContaining({
        detailsJson: expect.objectContaining({
          employeeName: 'Ravi Kumar',
          designation: 'Guard',
          salary: 12000,
          hourlyRate: 62.5,
        }),
      }),
    })
  })

  it('stores changeSource MANUAL in detailsJson', async () => {
    // GIVEN valid employee data
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(null)

    let capturedAuditLog: unknown = null
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const mockTx = {
        employee: { create: vi.fn().mockResolvedValue(makeEmployee()) },
        employeeWageHistory: { create: vi.fn().mockResolvedValue(makeWageHistory()) },
        auditLog: {
          create: vi.fn().mockImplementation((args: unknown) => {
            capturedAuditLog = args
          }),
        },
      }
      return fn(mockTx as unknown as typeof prisma)
    })

    // WHEN createEmployee is called
    await createEmployee(validInput)

    // THEN detailsJson includes changeSource: 'MANUAL'
    expect(capturedAuditLog).toMatchObject({
      data: expect.objectContaining({
        detailsJson: expect.objectContaining({
          changeSource: 'MANUAL',
        }),
      }),
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-11.2: updateEmployee — EMPLOYEE audit log changedFields diff
// ─────────────────────────────────────────────────────────────────────────────

describe('updateEmployee — EMPLOYEE audit log changedFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates EMPLOYEE audit log with changedFields diff when phone changes', async () => {
    // GIVEN employee with phone="9876543210"
    const existing = makeEmployee({ phone: '9876543210' })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(existing)
    vi.mocked(prisma.employeeWageHistory.findMany).mockResolvedValue([makeWageHistory()])

    const auditLogCalls: unknown[] = []
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const mockTx = {
        employee: { update: vi.fn().mockResolvedValue(makeEmployee({ phone: '1111111111' })) },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        auditLog: {
          create: vi.fn().mockImplementation((args: unknown) => {
            auditLogCalls.push(args)
          }),
        },
      }
      return fn(mockTx as unknown as typeof prisma)
    })

    // WHEN updateEmployee is called with { phone: "1111111111" }
    await updateEmployee('uuid-1', { phone: '1111111111' })

    // THEN EMPLOYEE auditLog.create is called with actionType = "UPDATE", entityType = "EMPLOYEE"
    const employeeAuditCall = (auditLogCalls as Array<{ data: { actionType: string; entityType: string; detailsJson: { changedFields?: Record<string, { old: unknown; new: unknown }> } } }>).find(
      (call) => call.data.entityType === 'EMPLOYEE'
    )
    expect(employeeAuditCall).toBeDefined()
    expect(employeeAuditCall).toMatchObject({
      data: expect.objectContaining({
        actionType: 'UPDATE',
        entityType: 'EMPLOYEE',
      }),
    })

    // AND detailsJson.changedFields.phone = { old: "9876543210", new: "1111111111" }
    expect(employeeAuditCall).toMatchObject({
      data: expect.objectContaining({
        detailsJson: expect.objectContaining({
          changedFields: expect.objectContaining({
            phone: { old: '9876543210', new: '1111111111' },
          }),
        }),
      }),
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-11.3: updateEmployee — WAGE_HISTORY audit log on wage changes
// ─────────────────────────────────────────────────────────────────────────────

describe('updateEmployee — WAGE_HISTORY audit log', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates separate WAGE_HISTORY audit log when salary changes', async () => {
    // GIVEN employee with salary=12000
    const existing = makeEmployee()
    const existingWage = makeWageHistory({ weeklySalary: 12000 as unknown as EmployeeWageHistory['weeklySalary'] })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(existing)
    vi.mocked(prisma.employeeWageHistory.findMany).mockResolvedValue([existingWage])

    const auditLogCalls: unknown[] = []
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const mockTx = {
        employee: { update: vi.fn().mockResolvedValue(existing) },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        auditLog: {
          create: vi.fn().mockImplementation((args: unknown) => {
            auditLogCalls.push(args)
          }),
        },
      }
      return fn(mockTx as unknown as typeof prisma)
    })

    // WHEN updateEmployee is called with { salary: 14000 }
    await updateEmployee('uuid-1', { salary: 14000 })

    // THEN auditLog.create is called TWICE
    expect(auditLogCalls).toHaveLength(2)

    // First call: entityType = "EMPLOYEE"
    const employeeCall = (auditLogCalls as Array<{ data: { entityType: string } }>).find(
      (call) => call.data.entityType === 'EMPLOYEE'
    )
    expect(employeeCall).toBeDefined()

    // Second call: entityType = "WAGE_HISTORY" with detailsJson containing oldSalary, newSalary
    const wageHistoryCall = (auditLogCalls as Array<{ data: { entityType: string; detailsJson: Record<string, unknown> } }>).find(
      (call) => call.data.entityType === 'WAGE_HISTORY'
    )
    expect(wageHistoryCall).toBeDefined()
    expect(wageHistoryCall).toMatchObject({
      data: expect.objectContaining({
        entityType: 'WAGE_HISTORY',
        detailsJson: expect.objectContaining({
          oldSalary: 12000,
          newSalary: 14000,
        }),
      }),
    })
  })

  it('WAGE_HISTORY audit log includes effectiveFrom and employeeId when hourlyRate changes', async () => {
    // GIVEN employee with hourlyRate=62.50
    const existing = makeEmployee()
    const existingWage = makeWageHistory({ hourlyRate: 62.5 as unknown as EmployeeWageHistory['hourlyRate'] })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(existing)
    vi.mocked(prisma.employeeWageHistory.findMany).mockResolvedValue([existingWage])

    const auditLogCalls: unknown[] = []
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const mockTx = {
        employee: { update: vi.fn().mockResolvedValue(existing) },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        auditLog: {
          create: vi.fn().mockImplementation((args: unknown) => {
            auditLogCalls.push(args)
          }),
        },
      }
      return fn(mockTx as unknown as typeof prisma)
    })

    // WHEN updateEmployee is called with { hourlyRate: 75.00 }
    await updateEmployee('uuid-1', { hourlyRate: 75.0 })

    // THEN WAGE_HISTORY auditLog detailsJson includes employeeId, effectiveFrom, oldHourlyRate, newHourlyRate
    const wageHistoryCall = (auditLogCalls as Array<{ data: { entityType: string; detailsJson: Record<string, unknown> } }>).find(
      (call) => call.data.entityType === 'WAGE_HISTORY'
    )
    expect(wageHistoryCall).toBeDefined()
    expect(wageHistoryCall).toMatchObject({
      data: expect.objectContaining({
        detailsJson: expect.objectContaining({
          employeeId: 'uuid-1',
          effectiveFrom: expect.any(Date),
          oldHourlyRate: 62.5,
          newHourlyRate: 75.0,
        }),
      }),
    })
  })

  it('does NOT create WAGE_HISTORY audit log for non-wage changes', async () => {
    // GIVEN employee phone changes
    const existing = makeEmployee({ phone: '9876543210' })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(existing)
    vi.mocked(prisma.employeeWageHistory.findMany).mockResolvedValue([makeWageHistory()])

    const auditLogCalls: unknown[] = []
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const mockTx = {
        employee: { update: vi.fn().mockResolvedValue(makeEmployee({ phone: '9999999999' })) },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        auditLog: {
          create: vi.fn().mockImplementation((args: unknown) => {
            auditLogCalls.push(args)
          }),
        },
      }
      return fn(mockTx as unknown as typeof prisma)
    })

    // WHEN updateEmployee is called with { phone: "9999999999" }
    await updateEmployee('uuid-1', { phone: '9999999999' })

    // THEN auditLog.create is called exactly ONCE (EMPLOYEE only)
    expect(auditLogCalls).toHaveLength(1)

    const singleCall = auditLogCalls[0] as { data: { entityType: string } }
    expect(singleCall.data.entityType).toBe('EMPLOYEE')
  })
})
