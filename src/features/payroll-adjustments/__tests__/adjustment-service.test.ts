import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Employee, PayrollAdjustment, PayrollAdjustmentApplication } from '@prisma/client'

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  default: {
    employee: {
      findUnique: vi.fn(),
    },
    payrollAdjustment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    payrollAdjustmentApplication: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import prisma from '@/lib/prisma'
import {
  createAdjustment,
  getAdjustmentList,
  getAdjustmentDetail,
  approveAdjustmentApplication,
  skipAdjustmentApplication,
} from '@/features/payroll-adjustments/services/adjustment.service'
import { AdjustmentServiceError } from '@/features/payroll-adjustments/types/adjustment.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-uuid-1',
  employeeImportBatchId: null,
  employeeId: 'EMP-001',
  serialNumber: null,
  employeeName: 'Lakshmi Venkatesh',
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
  site: null,
  isActive: true,
  designationShort: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

const makeAdjustment = (overrides: Partial<PayrollAdjustment> = {}): PayrollAdjustment => ({
  id: 'adj-uuid-1',
  employeeId: 'emp-uuid-1',
  adjustmentType: 'DEDUCTION',
  recurrenceType: 'ONE_TIME',
  amount: 500 as unknown as PayrollAdjustment['amount'],
  reason: 'Advance recovery',
  startPayrollWeekStartDate: new Date('2025-03-06'),
  startPayrollWeekEndDate: new Date('2025-03-12'),
  endPayrollWeekStartDate: null,
  endPayrollWeekEndDate: null,
  totalRecurrenceWeeks: null,
  totalBalance: null,
  remainingBalance: null,
  recurrenceEndType: null,
  status: 'ACTIVE',
  skippedCarryForwardCount: 0,
  createdBy: null,
  createdAt: new Date('2025-03-01'),
  ...overrides,
})

const makeApplication = (
  overrides: Partial<PayrollAdjustmentApplication> = {},
): PayrollAdjustmentApplication => ({
  id: 'app-uuid-1',
  payrollAdjustmentId: 'adj-uuid-1',
  payrollRunId: null,
  payrollRevisionId: null,
  employeeId: 'emp-uuid-1',
  payrollWeekStartDate: new Date('2025-03-06'),
  payrollWeekEndDate: new Date('2025-03-12'),
  appliedAmount: 500 as unknown as PayrollAdjustmentApplication['appliedAmount'],
  approvalStatus: 'PENDING',
  approvedBy: null,
  approvedAt: null,
  appliedAt: null,
  skippedAt: null,
  carriedForwardToPayrollWeekStartDate: null,
  isReversed: false,
  ...overrides,
})

const validOneTimeInput = {
  employeeId: 'emp-uuid-1',
  adjustmentType: 'DEDUCTION' as const,
  amount: 500,
  reason: 'Advance recovery',
  recurrenceType: 'ONE_TIME' as const,
  startPayrollWeekStartDate: new Date('2025-03-06'),
  startPayrollWeekEndDate: new Date('2025-03-12'),
}

// ─────────────────────────────────────────────────────────────────────────────
// US-05.1: Create one-time adjustment
// ─────────────────────────────────────────────────────────────────────────────

describe('createAdjustment — one-time', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates adjustment and application for a one-time deduction', async () => {
    // GIVEN valid one-time input for EMP-001
    const adj = makeAdjustment()
    const app = makeApplication()
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(makeEmployee())
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        payrollAdjustment: { create: vi.fn().mockResolvedValue(adj) },
        payrollAdjustmentApplication: { create: vi.fn().mockResolvedValue(app) },
      } as unknown as typeof prisma),
    )

    // WHEN
    const result = await createAdjustment(validOneTimeInput)

    // THEN a PayrollAdjustment is created with recurrenceType = ONE_TIME
    expect(result.recurrenceType).toBe('ONE_TIME')
    expect(result.adjustmentType).toBe('DEDUCTION')
    expect(result.amount).toBe(500)
  })

  it('creates a PENDING application for the start payroll week', async () => {
    // GIVEN valid one-time input
    const adj = makeAdjustment()
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(makeEmployee())

    let capturedAppCreate: unknown = null
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        payrollAdjustment: { create: vi.fn().mockResolvedValue(adj) },
        payrollAdjustmentApplication: {
          create: vi.fn().mockImplementation((args: unknown) => {
            capturedAppCreate = args
            return makeApplication()
          }),
        },
      } as unknown as typeof prisma),
    )

    await createAdjustment(validOneTimeInput)

    // THEN a PENDING application is created for March 6-12
    expect(capturedAppCreate).toMatchObject({
      data: expect.objectContaining({
        approvalStatus: 'PENDING',
        payrollWeekStartDate: new Date('2025-03-06'),
      }),
    })
  })

  it('rejects missing reason with VALIDATION_ERROR', async () => {
    // GIVEN adjustment with empty reason
    const badInput = { ...validOneTimeInput, reason: '' }
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(makeEmployee())

    await expect(createAdjustment(badInput)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })
  })

  it('accepts decimal amounts (e.g. 1250.75)', async () => {
    // GIVEN adjustment with decimal amount
    const adj = makeAdjustment({ amount: 1250.75 as unknown as PayrollAdjustment['amount'] })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(makeEmployee())

    let capturedCreate: unknown = null
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        payrollAdjustment: {
          create: vi.fn().mockImplementation((args: unknown) => {
            capturedCreate = args
            return adj
          }),
        },
        payrollAdjustmentApplication: { create: vi.fn().mockResolvedValue(makeApplication()) },
      } as unknown as typeof prisma),
    )

    await createAdjustment({ ...validOneTimeInput, amount: 1250.75 })

    expect(capturedCreate).toMatchObject({
      data: expect.objectContaining({ amount: 1250.75 }),
    })
  })

  it('throws EMPLOYEE_NOT_FOUND when employee does not exist', async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(null)

    await expect(createAdjustment(validOneTimeInput)).rejects.toMatchObject({
      code: 'EMPLOYEE_NOT_FOUND',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-05.2: Create recurring adjustment
// ─────────────────────────────────────────────────────────────────────────────

describe('createAdjustment — recurring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates recurring adjustment with END_WEEK end condition', async () => {
    // GIVEN type=RECURRING, endType=END_WEEK
    const input = {
      ...validOneTimeInput,
      recurrenceType: 'RECURRING' as const,
      recurrenceEndType: 'END_WEEK' as const,
      endPayrollWeekStartDate: new Date('2025-04-03'),
      endPayrollWeekEndDate: new Date('2025-04-09'),
    }
    const adj = makeAdjustment({
      recurrenceType: 'RECURRING',
      recurrenceEndType: 'END_WEEK',
      endPayrollWeekStartDate: new Date('2025-04-03'),
    })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(makeEmployee())
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        payrollAdjustment: { create: vi.fn().mockResolvedValue(adj) },
        payrollAdjustmentApplication: { create: vi.fn().mockResolvedValue(makeApplication()) },
      } as unknown as typeof prisma),
    )

    const result = await createAdjustment(input)

    expect(result.recurrenceType).toBe('RECURRING')
    expect(result.recurrenceEndType).toBe('END_WEEK')
    expect(result.endPayrollWeekStartDate).toEqual(new Date('2025-04-03'))
  })

  it('creates recurring adjustment with FIXED_WEEKS end condition', async () => {
    // GIVEN type=RECURRING, endType=FIXED_WEEKS, totalWeeks=4
    const input = {
      ...validOneTimeInput,
      recurrenceType: 'RECURRING' as const,
      recurrenceEndType: 'FIXED_WEEKS' as const,
      totalRecurrenceWeeks: 4,
    }
    const adj = makeAdjustment({
      recurrenceType: 'RECURRING',
      recurrenceEndType: 'FIXED_WEEKS',
      totalRecurrenceWeeks: 4,
    })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(makeEmployee())

    let capturedAdjCreate: unknown = null
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        payrollAdjustment: {
          create: vi.fn().mockImplementation((args: unknown) => {
            capturedAdjCreate = args
            return adj
          }),
        },
        payrollAdjustmentApplication: { create: vi.fn().mockResolvedValue(makeApplication()) },
      } as unknown as typeof prisma),
    )

    const result = await createAdjustment(input)

    expect(result.recurrenceEndType).toBe('FIXED_WEEKS')
    expect(result.totalRecurrenceWeeks).toBe(4)
    expect(capturedAdjCreate).toMatchObject({
      data: expect.objectContaining({ totalRecurrenceWeeks: 4 }),
    })
  })

  it('creates recurring adjustment with TOTAL_BALANCE and sets remainingBalance', async () => {
    // GIVEN type=RECURRING, endType=TOTAL_BALANCE, totalBalance=8000
    const input = {
      ...validOneTimeInput,
      amount: 2000,
      recurrenceType: 'RECURRING' as const,
      recurrenceEndType: 'TOTAL_BALANCE' as const,
      totalBalance: 8000,
    }
    const adj = makeAdjustment({
      recurrenceType: 'RECURRING',
      recurrenceEndType: 'TOTAL_BALANCE',
      totalBalance: 8000 as unknown as PayrollAdjustment['totalBalance'],
      remainingBalance: 8000 as unknown as PayrollAdjustment['remainingBalance'],
    })
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(makeEmployee())

    let capturedAdjCreate: unknown = null
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        payrollAdjustment: {
          create: vi.fn().mockImplementation((args: unknown) => {
            capturedAdjCreate = args
            return adj
          }),
        },
        payrollAdjustmentApplication: { create: vi.fn().mockResolvedValue(makeApplication()) },
      } as unknown as typeof prisma),
    )

    const result = await createAdjustment(input)

    // THEN remainingBalance = totalBalance initially
    expect(result.remainingBalance).toBe(8000)
    expect(capturedAdjCreate).toMatchObject({
      data: expect.objectContaining({
        totalBalance: 8000,
        remainingBalance: 8000,
      }),
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-05.3: Adjustments list
// ─────────────────────────────────────────────────────────────────────────────

describe('getAdjustmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all adjustments with count', async () => {
    // GIVEN 10 adjustments
    const rows = Array.from({ length: 10 }, (_, i) => ({
      ...makeAdjustment({ id: `adj-${i}` }),
      employee: { employeeName: 'Lakshmi Venkatesh', employeeId: 'EMP-001' },
    }))
    vi.mocked(prisma.payrollAdjustment.count).mockResolvedValue(10)
    vi.mocked(prisma.payrollAdjustment.findMany).mockResolvedValue(rows as never)

    const result = await getAdjustmentList({})

    expect(result.totalCount).toBe(10)
    expect(result.adjustments).toHaveLength(10)
  })

  it('filters by status ACTIVE', async () => {
    // GIVEN 7 active adjustments
    const rows = Array.from({ length: 7 }, (_, i) => ({
      ...makeAdjustment({ id: `adj-${i}`, status: 'ACTIVE' }),
      employee: { employeeName: 'Lakshmi Venkatesh', employeeId: 'EMP-001' },
    }))
    vi.mocked(prisma.payrollAdjustment.count).mockResolvedValue(7)
    vi.mocked(prisma.payrollAdjustment.findMany).mockResolvedValue(rows as never)

    const result = await getAdjustmentList({ status: 'ACTIVE' })

    expect(result.adjustments).toHaveLength(7)
    expect(prisma.payrollAdjustment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    )
  })

  it('filters by type DEDUCTION', async () => {
    // GIVEN 6 deductions
    const rows = Array.from({ length: 6 }, (_, i) => ({
      ...makeAdjustment({ id: `adj-${i}`, adjustmentType: 'DEDUCTION' }),
      employee: { employeeName: 'Lakshmi Venkatesh', employeeId: 'EMP-001' },
    }))
    vi.mocked(prisma.payrollAdjustment.count).mockResolvedValue(6)
    vi.mocked(prisma.payrollAdjustment.findMany).mockResolvedValue(rows as never)

    const result = await getAdjustmentList({ type: 'DEDUCTION' })

    expect(result.adjustments).toHaveLength(6)
    expect(prisma.payrollAdjustment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ adjustmentType: 'DEDUCTION' }),
      }),
    )
  })

  it('includes employee name in list items', async () => {
    const rows = [
      {
        ...makeAdjustment(),
        employee: { employeeName: 'Arjun Mehrotra', employeeId: 'EMP-002' },
      },
    ]
    vi.mocked(prisma.payrollAdjustment.count).mockResolvedValue(1)
    vi.mocked(prisma.payrollAdjustment.findMany).mockResolvedValue(rows as never)

    const result = await getAdjustmentList({})

    expect(result.adjustments[0].employeeName).toBe('Arjun Mehrotra')
    expect(result.adjustments[0].employeeCode).toBe('EMP-002')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-05.6: Adjustment detail
// ─────────────────────────────────────────────────────────────────────────────

describe('getAdjustmentDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns full adjustment with 4 application entries', async () => {
    // GIVEN adjustment with 4 applications
    const apps = Array.from({ length: 4 }, (_, i) => makeApplication({ id: `app-${i}` }))
    vi.mocked(prisma.payrollAdjustment.findUnique).mockResolvedValue({
      ...makeAdjustment(),
      employee: { employeeName: 'Lakshmi Venkatesh', employeeId: 'EMP-001' },
      adjustmentApplications: apps,
    } as never)

    const result = await getAdjustmentDetail('adj-uuid-1')

    expect(result.id).toBe('adj-uuid-1')
    expect(result.applications).toHaveLength(4)
  })

  it('throws ADJUSTMENT_NOT_FOUND when adjustment does not exist', async () => {
    vi.mocked(prisma.payrollAdjustment.findUnique).mockResolvedValue(null)

    await expect(getAdjustmentDetail('nonexistent')).rejects.toMatchObject({
      code: 'ADJUSTMENT_NOT_FOUND',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-05.4: Approve adjustment application
// ─────────────────────────────────────────────────────────────────────────────

describe('approveAdjustmentApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets approvalStatus to APPROVED and sets appliedAt', async () => {
    // GIVEN a PENDING application for EMP-001
    const app = makeApplication({ approvalStatus: 'PENDING' })
    const adj = makeAdjustment({ recurrenceEndType: null })
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue({
      ...app,
      payrollAdjustment: adj,
    } as never)
    vi.mocked(prisma.payrollAdjustmentApplication.update).mockResolvedValue({
      ...app,
      approvalStatus: 'APPROVED',
      appliedAt: new Date(),
    } as never)
    vi.mocked(prisma.payrollAdjustment.update).mockResolvedValue(adj)

    const result = await approveAdjustmentApplication('app-uuid-1')

    expect(result.approvalStatus).toBe('APPROVED')
    expect(result.appliedAt).toBeDefined()
    expect(prisma.payrollAdjustmentApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app-uuid-1' },
        data: expect.objectContaining({ approvalStatus: 'APPROVED' }),
      }),
    )
  })

  it('caps applied amount at remainingBalance for TOTAL_BALANCE adjustments', async () => {
    // GIVEN adjustment amount=2000, remainingBalance=1500
    const adj = makeAdjustment({
      recurrenceEndType: 'TOTAL_BALANCE',
      amount: 2000 as unknown as PayrollAdjustment['amount'],
      remainingBalance: 1500 as unknown as PayrollAdjustment['remainingBalance'],
    })
    const app = makeApplication({
      approvalStatus: 'PENDING',
      payrollAdjustmentId: adj.id,
      appliedAmount: 2000 as unknown as PayrollAdjustmentApplication['appliedAmount'],
    })
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue({
      ...app,
      payrollAdjustment: adj,
    } as never)

    let capturedAppUpdate: unknown = null
    vi.mocked(prisma.payrollAdjustmentApplication.update).mockImplementation(
      (args: unknown) => {
        capturedAppUpdate = args
        return Promise.resolve({ ...app, approvalStatus: 'APPROVED', appliedAmount: 1500 } as never)
      },
    )
    vi.mocked(prisma.payrollAdjustment.update).mockResolvedValue(adj)

    await approveAdjustmentApplication('app-uuid-1')

    // THEN applied amount = min(2000, 1500) = 1500
    expect(capturedAppUpdate).toMatchObject({
      data: expect.objectContaining({ appliedAmount: 1500 }),
    })
  })

  it('sets adjustment status to COMPLETED when remainingBalance reaches 0', async () => {
    // GIVEN adjustment amount=2000, remainingBalance=1500
    const adj = makeAdjustment({
      recurrenceEndType: 'TOTAL_BALANCE',
      amount: 2000 as unknown as PayrollAdjustment['amount'],
      remainingBalance: 1500 as unknown as PayrollAdjustment['remainingBalance'],
    })
    const app = makeApplication({ approvalStatus: 'PENDING', payrollAdjustmentId: adj.id })
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue({
      ...app,
      payrollAdjustment: adj,
    } as never)
    vi.mocked(prisma.payrollAdjustmentApplication.update).mockResolvedValue({
      ...app,
      approvalStatus: 'APPROVED',
    } as never)

    let capturedAdjUpdate: unknown = null
    vi.mocked(prisma.payrollAdjustment.update).mockImplementation((args: unknown) => {
      capturedAdjUpdate = args
      return Promise.resolve({ ...adj, status: 'COMPLETED', remainingBalance: 0 } as never)
    })

    await approveAdjustmentApplication('app-uuid-1')

    // THEN adjustment status = COMPLETED and remainingBalance = 0
    expect(capturedAdjUpdate).toMatchObject({
      data: expect.objectContaining({
        status: 'COMPLETED',
        remainingBalance: 0,
      }),
    })
  })

  it('throws APPLICATION_NOT_FOUND when application does not exist', async () => {
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue(null)

    await expect(approveAdjustmentApplication('nonexistent')).rejects.toMatchObject({
      code: 'APPLICATION_NOT_FOUND',
    })
  })

  it('throws INVALID_APPROVAL_STATUS when application is already approved', async () => {
    const app = makeApplication({ approvalStatus: 'APPROVED' })
    const adj = makeAdjustment()
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue({
      ...app,
      payrollAdjustment: adj,
    } as never)

    await expect(approveAdjustmentApplication('app-uuid-1')).rejects.toMatchObject({
      code: 'INVALID_APPROVAL_STATUS',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// US-05.5: Skip adjustment application
// ─────────────────────────────────────────────────────────────────────────────

describe('skipAdjustmentApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets approvalStatus to SKIPPED and creates next PENDING application', async () => {
    // GIVEN a PENDING application for week March 6-12
    const adj = makeAdjustment({ recurrenceType: 'RECURRING' })
    const app = makeApplication({
      approvalStatus: 'PENDING',
      payrollWeekStartDate: new Date('2025-03-06'),
      payrollWeekEndDate: new Date('2025-03-12'),
      payrollAdjustmentId: adj.id,
    })
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue({
      ...app,
      payrollAdjustment: adj,
    } as never)
    vi.mocked(prisma.payrollAdjustmentApplication.update).mockResolvedValue({
      ...app,
      approvalStatus: 'SKIPPED',
    } as never)

    let capturedNextApp: unknown = null
    vi.mocked(prisma.payrollAdjustmentApplication.create).mockImplementation((args: unknown) => {
      capturedNextApp = args
      return Promise.resolve(
        makeApplication({ approvalStatus: 'PENDING', payrollWeekStartDate: new Date('2025-03-13') }) as never,
      )
    })
    vi.mocked(prisma.payrollAdjustment.update).mockResolvedValue({ ...adj, skippedCarryForwardCount: 1 } as never)

    const result = await skipAdjustmentApplication('app-uuid-1')

    // THEN approvalStatus = SKIPPED
    expect(result.approvalStatus).toBe('SKIPPED')

    // AND a new PENDING application is created for the next payroll week (March 13-19)
    expect(capturedNextApp).toMatchObject({
      data: expect.objectContaining({
        approvalStatus: 'PENDING',
        payrollWeekStartDate: new Date('2025-03-13'),
        payrollWeekEndDate: new Date('2025-03-19'),
      }),
    })
  })

  it('increments skippedCarryForwardCount on the adjustment', async () => {
    const adj = makeAdjustment({ recurrenceType: 'RECURRING', skippedCarryForwardCount: 2 })
    const app = makeApplication({ approvalStatus: 'PENDING', payrollAdjustmentId: adj.id })
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue({
      ...app,
      payrollAdjustment: adj,
    } as never)
    vi.mocked(prisma.payrollAdjustmentApplication.update).mockResolvedValue({
      ...app,
      approvalStatus: 'SKIPPED',
    } as never)
    vi.mocked(prisma.payrollAdjustmentApplication.create).mockResolvedValue(makeApplication() as never)

    let capturedAdjUpdate: unknown = null
    vi.mocked(prisma.payrollAdjustment.update).mockImplementation((args: unknown) => {
      capturedAdjUpdate = args
      return Promise.resolve({ ...adj, skippedCarryForwardCount: 3 } as never)
    })

    await skipAdjustmentApplication('app-uuid-1')

    expect(capturedAdjUpdate).toMatchObject({
      data: expect.objectContaining({ skippedCarryForwardCount: 3 }),
    })
  })

  it('carries forward a one-time adjustment to the next payroll week', async () => {
    // GIVEN a ONE_TIME adjustment PENDING for March 6-12
    const adj = makeAdjustment({ recurrenceType: 'ONE_TIME' })
    const app = makeApplication({
      approvalStatus: 'PENDING',
      payrollWeekStartDate: new Date('2025-03-06'),
      payrollWeekEndDate: new Date('2025-03-12'),
    })
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue({
      ...app,
      payrollAdjustment: adj,
    } as never)
    vi.mocked(prisma.payrollAdjustmentApplication.update).mockResolvedValue({
      ...app,
      approvalStatus: 'SKIPPED',
    } as never)

    let capturedNextApp: unknown = null
    vi.mocked(prisma.payrollAdjustmentApplication.create).mockImplementation((args: unknown) => {
      capturedNextApp = args
      return Promise.resolve(makeApplication() as never)
    })
    vi.mocked(prisma.payrollAdjustment.update).mockResolvedValue(adj)

    await skipAdjustmentApplication('app-uuid-1')

    // THEN a new PENDING application is created for March 13-19
    expect(capturedNextApp).toMatchObject({
      data: expect.objectContaining({
        approvalStatus: 'PENDING',
        payrollWeekStartDate: new Date('2025-03-13'),
      }),
    })
  })

  it('throws APPLICATION_NOT_FOUND when application does not exist', async () => {
    vi.mocked(prisma.payrollAdjustmentApplication.findUnique).mockResolvedValue(null)

    await expect(skipAdjustmentApplication('nonexistent')).rejects.toMatchObject({
      code: 'APPLICATION_NOT_FOUND',
    })
  })
})
