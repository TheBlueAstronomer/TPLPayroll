import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as XLSX from 'xlsx'
import type { Employee, EmployeeWageHistory } from '@prisma/client'

// ─── Mock Prisma ─────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  default: {
    employee: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    employeeWageHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    employeeImportBatch: {
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// ─── Mock fs ─────────────────────────────────────────────────────────────────
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    unlinkSync: vi.fn(),
  }
})

import prisma from '@/lib/prisma'
import {
  mapActiveValue,
  validateImportFile,
  parseImportFile,
  executeImport,
} from '@/features/employee-import-export/services/import.service'
import { ImportExportServiceError } from '@/features/employee-import-export/types/import-export.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeXlsxBuffer(sheetName: string, rows: Record<string, unknown>[]): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

function makeValidRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    'Employee ID': 'EMP-001',
    'Employee Name': 'Ravi Kumar',
    'Designation': 'Guard',
    'Salary': 12000,
    'Hourly Rate': 62.5,
    'Active': 'Active',
    'Site': 'North Gate',
    ...overrides,
  }
}

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'uuid-1',
  employeeImportBatchId: null,
  employeeId: 'EMP-001',
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
  designationShort: null,
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
  changeSource: 'IMPORT',
  employeeImportBatchId: null,
  changedBy: null,
  createdAt: new Date('2025-01-01'),
  ...overrides,
})

// ─── Reset mocks before each test ────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// ═════════════════════════════════════════════════════════════════════════════
// US-03.4: mapActiveValue
// ═════════════════════════════════════════════════════════════════════════════

describe('mapActiveValue', () => {
  it('maps "Active" to true', () => {
    expect(mapActiveValue('Active')).toBe(true)
  })

  it('maps "active" (lowercase) to true', () => {
    expect(mapActiveValue('active')).toBe(true)
  })

  it('maps "ACTIVE" (uppercase) to true', () => {
    expect(mapActiveValue('ACTIVE')).toBe(true)
  })

  it('maps "Inactive" to false', () => {
    expect(mapActiveValue('Inactive')).toBe(false)
  })

  it('maps "inactive" (lowercase) to false', () => {
    expect(mapActiveValue('inactive')).toBe(false)
  })

  it('maps "INACTIVE" (uppercase) to false', () => {
    expect(mapActiveValue('INACTIVE')).toBe(false)
  })

  it('returns error for blank value', () => {
    const result = mapActiveValue('')
    expect(result).toBe('INVALID_ACTIVE_VALUE')
  })

  it('returns error for unrecognized value', () => {
    const result = mapActiveValue('Yes')
    expect(result).toBe('INVALID_ACTIVE_VALUE')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// US-03.1: validateImportFile
// ═════════════════════════════════════════════════════════════════════════════

describe('validateImportFile', () => {
  it('rejects non-xlsx files', () => {
    const csvBuffer = Buffer.from('id,name\n1,Test')
    const result = validateImportFile(csvBuffer, 'employees.csv')
    expect(result).toEqual({ ok: false, error: 'UNSUPPORTED_FILE_TYPE' })
  })

  it('rejects xlsx without correct sheet name', () => {
    const buf = makeXlsxBuffer('Sheet1', [makeValidRow()])
    const result = validateImportFile(buf, 'employees.xlsx')
    expect(result).toEqual({ ok: false, error: 'SHEET_NOT_FOUND' })
  })

  it('accepts valid xlsx with "Employee Master List" sheet', () => {
    const buf = makeXlsxBuffer('Employee Master List', [makeValidRow()])
    const result = validateImportFile(buf, 'employees.xlsx')
    expect(result).toEqual({ ok: true })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// US-03.2: parseImportFile
// ═════════════════════════════════════════════════════════════════════════════

describe('parseImportFile', () => {
  it('categorizes rows correctly: valid, invalid, duplicate', async () => {
    const rows = [
      makeValidRow({ 'Employee ID': 'EMP-001' }),
      makeValidRow({ 'Employee ID': 'EMP-002' }),
      makeValidRow({ 'Employee ID': 'EMP-003' }),
      makeValidRow({ 'Employee ID': 'EMP-004' }),
      makeValidRow({ 'Employee ID': 'EMP-005' }),
      makeValidRow({ 'Employee ID': 'EMP-006' }),
      makeValidRow({ 'Employee ID': 'EMP-007' }),
      makeValidRow({ 'Employee ID': 'EMP-008' }),
      makeValidRow({ 'Employee ID': 'EMP-009' }),
      makeValidRow({ 'Employee ID': 'EMP-010' }),
      // 3 invalid: missing Employee ID
      makeValidRow({ 'Employee ID': '' }),
      makeValidRow({ 'Employee ID': '' }),
      makeValidRow({ 'Employee ID': '' }),
      // 2 duplicate IDs
      makeValidRow({ 'Employee ID': 'EMP-001' }),
      makeValidRow({ 'Employee ID': 'EMP-002' }),
    ]
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])

    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await parseImportFile(buf)

    expect(result.validRows.length).toBe(10)
    expect(result.invalidRows.length).toBe(3)
    expect(result.duplicateIdRows.length).toBe(2)
    expect(result.totalRows).toBe(15)
  })

  it('returns error details per invalid row', async () => {
    const rows = [
      {
        'Employee ID': '',
        'Employee Name': '',
        'Designation': 'Guard',
        'Salary': 'not-a-number',
        'Hourly Rate': 62.5,
        'Active': 'Active',
      },
    ]
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])

    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await parseImportFile(buf)

    expect(result.invalidRows.length).toBe(1)
    expect(result.invalidRows[0].errors).toContain('MISSING_EMPLOYEE_ID')
    expect(result.invalidRows[0].errors).toContain('MISSING_EMPLOYEE_NAME')
    expect(result.invalidRows[0].errors).toContain('INVALID_SALARY')
  })

  it('marks existing employees as UPDATE action', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([makeEmployee()])

    const rows = [makeValidRow({ 'Employee ID': 'EMP-001' })]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await parseImportFile(buf)

    expect(result.validRows[0].action).toBe('UPDATE')
  })

  it('marks new employees as CREATE action', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])

    const rows = [makeValidRow({ 'Employee ID': 'EMP-999' })]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await parseImportFile(buf)

    expect(result.validRows[0].action).toBe('CREATE')
  })

  it('counts duplicate Employee ID rows across the file', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])

    const rows = [
      makeValidRow({ 'Employee ID': 'EMP-010' }),
      makeValidRow({ 'Employee ID': 'EMP-010' }),
    ]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await parseImportFile(buf)

    // First occurrence → validRows; second occurrence → duplicateIdRows only
    expect(result.validRows.length).toBe(1)
    expect(result.duplicateIdRows.length).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// US-03.3: executeImport
// ═════════════════════════════════════════════════════════════════════════════

describe('executeImport', () => {
  it('creates new employees for valid rows with new IDs', async () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeValidRow({ 'Employee ID': `EMP-${String(i + 1).padStart(3, '0')}` })
    )
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])
    vi.mocked(prisma.employeeImportBatch.create).mockResolvedValue({
      id: 'batch-1',
    } as never)

    const txFn = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        employee: {
          create: vi.fn().mockResolvedValue(makeEmployee()),
          update: vi.fn().mockResolvedValue(makeEmployee()),
          findMany: vi.fn().mockResolvedValue([]),
        },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        employeeImportBatch: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      }
      return fn(tx)
    })
    vi.mocked(prisma.$transaction).mockImplementation(txFn)

    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await executeImport(buf, 'employees.xlsx', '/tmp/employees.xlsx')

    expect(result.createdEmployeeCount).toBe(5)
    expect(result.updatedEmployeeCount).toBe(0)
    expect(result.rejectedRowCount).toBe(0)
  })

  it('updates existing employees', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([
      makeEmployee({ employeeId: 'EMP-001', phone: '111' }),
    ])
    vi.mocked(prisma.employeeImportBatch.create).mockResolvedValue({
      id: 'batch-1',
    } as never)

    const txFn = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        employee: {
          create: vi.fn().mockResolvedValue(makeEmployee()),
          update: vi.fn().mockResolvedValue(makeEmployee({ phone: '222' })),
          findMany: vi.fn().mockResolvedValue([{ id: 'uuid-1' }]),
        },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn(), findMany: vi.fn().mockResolvedValue([makeWageHistory()]) },
        employeeImportBatch: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      }
      return fn(tx)
    })
    vi.mocked(prisma.$transaction).mockImplementation(txFn)

    const rows = [makeValidRow({ 'Employee ID': 'EMP-001', 'Phone': '222' })]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await executeImport(buf, 'employees.xlsx', '/tmp/employees.xlsx')

    expect(result.updatedEmployeeCount).toBe(1)
    expect(result.createdEmployeeCount).toBe(0)
  })

  it('creates wage history when hourly rate changes', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([
      makeEmployee({ employeeId: 'EMP-001' }),
    ])
    vi.mocked(prisma.employeeImportBatch.create).mockResolvedValue({
      id: 'batch-1',
    } as never)

    const wageHistoryCreate = vi.fn()
    const wageHistoryUpdateMany = vi.fn()
    const wageHistoryFindMany = vi.fn().mockResolvedValue([
      makeWageHistory({ hourlyRate: 60 as unknown as EmployeeWageHistory['hourlyRate'] }),
    ])

    const txFn = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        employee: {
          create: vi.fn(),
          update: vi.fn().mockResolvedValue(makeEmployee()),
          findMany: vi.fn().mockResolvedValue([{ id: 'uuid-1' }]),
        },
        employeeWageHistory: { create: wageHistoryCreate, updateMany: wageHistoryUpdateMany, findMany: wageHistoryFindMany },
        employeeImportBatch: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      }
      return fn(tx)
    })
    vi.mocked(prisma.$transaction).mockImplementation(txFn)

    const rows = [makeValidRow({ 'Employee ID': 'EMP-001', 'Hourly Rate': 70 })]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    await executeImport(buf, 'employees.xlsx', '/tmp/employees.xlsx')

    expect(wageHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ hourlyRate: 70 }) })
    )
    expect(wageHistoryUpdateMany).toHaveBeenCalled()
  })

  it('skips invalid rows and counts them in rejectedRowCount', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])
    vi.mocked(prisma.employeeImportBatch.create).mockResolvedValue({
      id: 'batch-1',
    } as never)

    const txFn = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        employee: {
          create: vi.fn().mockResolvedValue(makeEmployee()),
          update: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        employeeImportBatch: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      }
      return fn(tx)
    })
    vi.mocked(prisma.$transaction).mockImplementation(txFn)

    const rows = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeValidRow({ 'Employee ID': `EMP-${String(i + 1).padStart(3, '0')}` })
      ),
      makeValidRow({ 'Employee ID': '' }),
      makeValidRow({ 'Employee ID': '' }),
      makeValidRow({ 'Employee ID': '' }),
    ]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await executeImport(buf, 'employees.xlsx', '/tmp/employees.xlsx')

    expect(result.importedRowCount).toBe(10)
    expect(result.rejectedRowCount).toBe(3)
  })

  it('processes duplicate Employee ID rows sequentially — last write wins', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])
    vi.mocked(prisma.employeeImportBatch.create).mockResolvedValue({
      id: 'batch-1',
    } as never)

    const employeeCreate = vi.fn().mockResolvedValue(makeEmployee({ employeeId: 'EMP-010' }))
    const employeeUpdate = vi.fn().mockResolvedValue(makeEmployee({ employeeId: 'EMP-010', phone: '222' }))

    const txFn = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        employee: {
          create: employeeCreate,
          update: employeeUpdate,
          findUnique: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([]),
        },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        employeeImportBatch: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      }
      return fn(tx)
    })
    vi.mocked(prisma.$transaction).mockImplementation(txFn)

    const rows = [
      makeValidRow({ 'Employee ID': 'EMP-010', 'Phone': '111' }),
      makeValidRow({ 'Employee ID': 'EMP-010', 'Phone': '222' }),
    ]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    const result = await executeImport(buf, 'employees.xlsx', '/tmp/employees.xlsx')

    expect(result.duplicateEmployeeIdRowCount).toBe(1)
  })

  it('creates an EmployeeImportBatch record with correct counts', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])
    const batchCreate = vi.mocked(prisma.employeeImportBatch.create).mockResolvedValue({
      id: 'batch-1',
    } as never)

    const txFn = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        employee: {
          create: vi.fn().mockResolvedValue(makeEmployee()),
          update: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        employeeImportBatch: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      }
      return fn(tx)
    })
    vi.mocked(prisma.$transaction).mockImplementation(txFn)

    const rows = Array.from({ length: 10 }, (_, i) =>
      makeValidRow({ 'Employee ID': `EMP-${String(i + 1).padStart(3, '0')}` })
    )
    const buf = makeXlsxBuffer('Employee Master List', rows)
    await executeImport(buf, 'employees.xlsx', '/tmp/employees.xlsx')

    expect(batchCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileName: 'employees.xlsx' }),
      })
    )
  })

  it('sets sourceFileDeletedAt on the batch after successful import', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([])
    vi.mocked(prisma.employeeImportBatch.create).mockResolvedValue({
      id: 'batch-1',
    } as never)

    const batchUpdate = vi.fn()
    const txFn = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        employee: {
          create: vi.fn().mockResolvedValue(makeEmployee()),
          update: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        employeeWageHistory: { create: vi.fn(), updateMany: vi.fn() },
        employeeImportBatch: { update: batchUpdate },
        auditLog: { create: vi.fn() },
      }
      return fn(tx)
    })
    vi.mocked(prisma.$transaction).mockImplementation(txFn)

    const rows = [makeValidRow()]
    const buf = makeXlsxBuffer('Employee Master List', rows)
    await executeImport(buf, 'employees.xlsx', '/tmp/employees.xlsx')

    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sourceFileDeletedAt: expect.any(Date) }),
      })
    )
  })
})
