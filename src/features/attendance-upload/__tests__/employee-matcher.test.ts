import { describe, it, expect } from 'vitest'
import type { Employee } from '@prisma/client'
import { matchEmployees } from '@/features/attendance-upload/services/employee-matcher.service'
import type { ParsedAttendanceBlock } from '@/features/attendance-upload/types/attendance.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
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
    site: null,
    isActive: true,
    designationShort: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeBlock(
  employeeName: string,
  userIdFromSheet?: number
): ParsedAttendanceBlock {
  return {
    employeeName,
    userIdFromSheet,
    site: null,
    sourceSheetName: 'Sheet1',
    sourceEmployeeBlockIndex: 0,
    totalRegularHours: 40,
    totalOvertimeHours: 0,
    dailyHours: Array(7).fill({ regularHours: 0, overtimeHours: 0 }),
    parseErrors: [],
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('matchEmployees', () => {
  const payrollWeekStartDate = new Date('2025-03-06T00:00:00Z')
  const payrollWeekEndDate = new Date('2025-03-12T00:00:00Z')

  it('matches by exact name and returns MATCHED status', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ employeeName: 'Ravi Kumar' })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
    expect(result[0].isBlocking).toBe(false)
    expect(result[0].employeeDbId).toBe('uuid-1')
  })

  it('flags unmatched employees with UNMATCHED and isBlocking=true', () => {
    const blocks = [makeBlock('Unknown Person')]
    const employees = [makeEmployee({ employeeName: 'Ravi Kumar' })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('UNMATCHED')
    expect(result[0].isBlocking).toBe(true)
    expect(result[0].employeeDbId).toBeNull()
  })

  it('flags inactive employees with INACTIVE and isBlocking=false (requires verification)', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ isActive: false })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('INACTIVE')
    expect(result[0].isBlocking).toBe(false)
  })

  it('flags employees resigned before payroll week with RESIGNED_BEFORE_WEEK and isBlocking=false (requires verification)', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ dateOfResignation: new Date('2025-03-01T00:00:00Z') })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('RESIGNED_BEFORE_WEEK')
    expect(result[0].isBlocking).toBe(false)
  })

  it('allows employee resigned on the week start date', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ dateOfResignation: new Date('2025-03-06T00:00:00Z') })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
    expect(result[0].isBlocking).toBe(false)
  })

  it('allows employee resigned after payroll week start', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ dateOfResignation: new Date('2025-03-10T00:00:00Z') })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
  })

  it('allows employee resigned during payroll week (on a day within the week)', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ dateOfResignation: new Date('2025-03-10T00:00:00Z') })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
    expect(result[0].isBlocking).toBe(false)
  })

  it('allows employee resigned on the last day of payroll week', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ dateOfResignation: new Date('2025-03-12T00:00:00Z') })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
    expect(result[0].isBlocking).toBe(false)
  })

  it('allows employee resigned after payroll week ends', () => {
    const blocks = [makeBlock('Ravi Kumar')]
    const employees = [makeEmployee({ dateOfResignation: new Date('2025-03-15T00:00:00Z') })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
    expect(result[0].isBlocking).toBe(false)
  })

  it('matches case-insensitively by name', () => {
    const blocks = [makeBlock('ravi kumar')]
    const employees = [makeEmployee({ employeeName: 'Ravi Kumar' })]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
  })

  it('processes multiple blocks independently', () => {
    const blocks = [makeBlock('Ravi Kumar'), makeBlock('Unknown Person'), makeBlock('Priya Nair')]
    const employees = [
      makeEmployee({ id: 'uuid-1', employeeName: 'Ravi Kumar' }),
      makeEmployee({ id: 'uuid-2', employeeName: 'Priya Nair', employeeId: 'EMP-002' }),
    ]
    const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
    expect(result[0].matchStatus).toBe('MATCHED')
    expect(result[1].matchStatus).toBe('UNMATCHED')
    expect(result[2].matchStatus).toBe('MATCHED')
  })

  describe('User ID matching (trailing number of Employee ID)', () => {
    it('matches when sheet User ID equals trailing number of Employee ID', () => {
      // "EMP-001" → trailing number 1 → matches sheet User ID 1
      const blocks = [makeBlock('Unknown Name', 1)]
      const employees = [makeEmployee({ id: 'uuid-1', employeeId: 'EMP-001', employeeName: 'Ravi Kumar' })]
      const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
      expect(result[0].matchStatus).toBe('MATCHED')
      expect(result[0].employeeDbId).toBe('uuid-1')
    })

    it('prefers User ID match over name mismatch', () => {
      const blocks = [makeBlock('Wrong Name', 2)]
      const employees = [
        makeEmployee({ id: 'uuid-1', employeeId: 'EMP-001', employeeName: 'Ravi Kumar' }),
        makeEmployee({ id: 'uuid-2', employeeId: 'EMP-002', employeeName: 'Priya Nair' }),
      ]
      const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
      expect(result[0].matchStatus).toBe('MATCHED')
      expect(result[0].employeeDbId).toBe('uuid-2')
    })

    it('falls back to name match when User ID is not found in DB', () => {
      const blocks = [makeBlock('Ravi Kumar', 999)]
      const employees = [makeEmployee({ id: 'uuid-1', employeeId: 'EMP-001', employeeName: 'Ravi Kumar' })]
      const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
      expect(result[0].matchStatus).toBe('MATCHED')
      expect(result[0].employeeDbId).toBe('uuid-1')
    })

    it('flags UNMATCHED when neither User ID nor name matches', () => {
      const blocks = [makeBlock('Unknown', 999)]
      const employees = [makeEmployee({ id: 'uuid-1', employeeId: 'EMP-001', employeeName: 'Ravi Kumar' })]
      const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
      expect(result[0].matchStatus).toBe('UNMATCHED')
      expect(result[0].isBlocking).toBe(true)
    })

    it('matches User ID 71 to Employee ID with trailing 71', () => {
      const blocks = [makeBlock('', 71)]
      const employees = [makeEmployee({ id: 'uuid-71', employeeId: 'GUARD-071', employeeName: 'Last Guard' })]
      const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
      expect(result[0].matchStatus).toBe('MATCHED')
      expect(result[0].employeeDbId).toBe('uuid-71')
    })

    it('matches User ID 70 to long Employee ID using only the last 3 digits', () => {
      // "TPLGOASPV002070" → last 3 of trailing digits "070" → 70
      const blocks = [makeBlock('Anooj', 70)]
      const employees = [makeEmployee({ id: 'uuid-2070', employeeId: 'TPLGOASPV002070', employeeName: 'Anooj Jayan' })]
      const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
      expect(result[0].matchStatus).toBe('MATCHED')
      expect(result[0].employeeDbId).toBe('uuid-2070')
    })

    it('falls back to name match when userIdFromSheet is undefined', () => {
      const blocks = [makeBlock('Ravi Kumar')]  // no User ID
      const employees = [makeEmployee()]
      const result = matchEmployees(blocks, employees, payrollWeekStartDate, payrollWeekEndDate)
      expect(result[0].matchStatus).toBe('MATCHED')
    })
  })
})