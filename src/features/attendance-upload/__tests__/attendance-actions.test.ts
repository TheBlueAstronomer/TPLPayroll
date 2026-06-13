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

// Mock Supabase Storage (finalizeAttendanceUploadAction now re-parses from Storage)
vi.mock('@/lib/supabase-storage', () => ({
  downloadFileAsBuffer: vi.fn(async () => Buffer.from('')),
  deleteFile: vi.fn(async () => undefined),
  fileExists: vi.fn(async () => true),
  ATTENDANCE_BUCKET: 'attendance-files',
}))

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

  it('re-parses from Storage, matches employees, and creates the upload', async () => {
    const result = await finalizeAttendanceUploadAction({
      storageKey: 'attendance/uuid_test.xlsx',
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

    // Verify it downloaded from Supabase Storage
    const { downloadFileAsBuffer } = await import('@/lib/supabase-storage')
    expect(downloadFileAsBuffer).toHaveBeenCalledWith(
      'attendance-files',
      'attendance/uuid_test.xlsx'
    )
  })

  it('returns ok and creates upload when there are no employees to match', async () => {
    const result = await finalizeAttendanceUploadAction({
      storageKey: 'attendance/uuid_empty.xlsx',
      fileName: 'empty.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: '2025-03-06',
      payrollWeekEndDate: '2025-03-12',
      payrollWeekSource: 'SHEET_CONTENT',
    })

    expect(result.ok).toBe(true)
  })
})
