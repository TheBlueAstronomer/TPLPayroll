import { describe, it, expect, vi, beforeEach } from 'vitest'
import { finalizeAttendanceUploadAction } from '../actions/attendance.actions'
import prisma from '@/lib/prisma'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    employee: {
      findMany: vi.fn(() => []),
    },
    attendanceUpload: {
      findFirst: vi.fn(() => null),
    },
  },
}))

// Mock upload.service
vi.mock('@/features/attendance-upload/services/upload.service', () => ({
  createAttendanceUpload: vi.fn(async () => ({ uploadId: 'mock-upload-id' })),
  replaceAttendanceUpload: vi.fn(async () => ({ uploadId: 'mock-upload-id' })),
}))

// Mock fs
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => Buffer.from('')),
    },
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() => Buffer.from('')),
  }
})

// Mock xlsx
vi.mock('xlsx', () => ({
  read: vi.fn(() => ({})),
}))

// Mock services
vi.mock('@/features/attendance-upload/services/workbook-parser.service', () => ({
  parseAttendanceWorkbook: vi.fn(() => ({ blocks: [] })),
}))

vi.mock('@/features/attendance-upload/services/employee-matcher.service', () => ({
  matchEmployees: vi.fn(() => []),
}))

vi.mock('@/features/attendance-upload/services/import-summary.service', () => ({
  computeImportSummary: vi.fn(() => ({
    total: 0,
    matched: 0,
    unmatched: 0,
    inactive: 0,
    resignedBeforeWeek: 0,
    rejectedUnmatched: 0,
    needsVerification: 0,
    errors: 0,
    isBlocked: false,
  })),
}))

describe('finalizeAttendanceUploadAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('works successfully when records and summary are provided directly', async () => {
    const mockRecords = [
      {
        employeeName: 'John Doe',
        site: null,
        sourceSheetName: 'Sheet1',
        sourceEmployeeBlockIndex: 0,
        totalRegularHours: 40,
        totalOvertimeHours: 0,
        dailyHours: [],
        parseErrors: [],
        matchStatus: 'MATCHED' as const,
        isBlocking: false,
        employeeDbId: 'emp-1',
      },
    ]

    const result = await finalizeAttendanceUploadAction({
      tempFilePath: '/tmp/test.xlsx',
      fileName: 'test.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: '2025-03-06',
      payrollWeekEndDate: '2025-03-12',
      payrollWeekSource: 'SHEET_CONTENT',
      records: mockRecords,
      summary: {
        total: 1,
        matched: 1,
        unmatched: 0,
        inactive: 0,
        resignedBeforeWeek: 0,
        rejectedUnmatched: 0,
        needsVerification: 0,
        errors: 0,
        isBlocked: false,
      },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.uploadId).toBe('mock-upload-id')
    }
  })

  it('re-parses from file and matches when records are omitted', async () => {
    const result = await finalizeAttendanceUploadAction({
      tempFilePath: '/tmp/test.xlsx',
      fileName: 'test.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: '2025-03-06',
      payrollWeekEndDate: '2025-03-12',
      payrollWeekSource: 'SHEET_CONTENT',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.uploadId).toBe('mock-upload-id')
    }

    const { existsSync } = await import('fs')
    expect(existsSync).toHaveBeenCalledWith('/tmp/test.xlsx')
  })
})
