import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AttendanceUpload } from '@prisma/client'

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  default: {
    attendanceUpload: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    attendanceRecord: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (promises) => {
      if (Array.isArray(promises)) {
        return Promise.all(promises)
      }
      return promises as any
    }),
  },
}))

// ─── Mock fs ──────────────────────────────────────────────────────────────────

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    default: { ...actual, existsSync: vi.fn(() => true), unlinkSync: vi.fn() },
    existsSync: vi.fn(() => true),
    unlinkSync: vi.fn(),
  }
})

import prisma from '@/lib/prisma'
import * as fsModule from 'fs'
import { replaceAttendanceUpload } from '@/features/attendance-upload/services/upload.service'
import type { MatchedAttendanceRecord } from '@/features/attendance-upload/types/attendance.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUpload(overrides: Partial<AttendanceUpload> = {}): AttendanceUpload {
  return {
    id: 'upload-old',
    fileName: 'old.xlsx',
    fileType: 'xlsx',
    payrollWeekStartDate: new Date('2025-03-06'),
    payrollWeekEndDate: new Date('2025-03-12'),
    payrollWeekSource: 'SHEET_CONTENT',
    status: 'READY',
    isActiveForPayrollWeek: true,
    uploadedBy: null,
    uploadedAt: new Date(),
    sourceFilePath: '/tmp/old.xlsx',
    ...overrides,
  }
}

function makeRecord(overrides: Partial<MatchedAttendanceRecord> = {}): MatchedAttendanceRecord {
  return {
    employeeName: 'Ravi Kumar',
    site: null,
    sourceSheetName: 'Sheet1',
    sourceEmployeeBlockIndex: 0,
    totalRegularHours: 40,
    totalOvertimeHours: 0,
    dailyHours: Array(7).fill({ regularHours: 8, overtimeHours: 0 }),
    parseErrors: [],
    matchStatus: 'MATCHED',
    isBlocking: false,
    employeeDbId: 'emp-uuid-1',
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('replaceAttendanceUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the previous file when replacing', async () => {
    const previousUpload = makeUpload({ sourceFilePath: '/tmp/old.xlsx' })
    vi.mocked(prisma.attendanceUpload.update).mockResolvedValue({ id: 'upload-new', isActiveForPayrollWeek: true } as never)
    vi.mocked(prisma.attendanceUpload.create).mockResolvedValue({ id: 'upload-new', isActiveForPayrollWeek: true } as never)
    vi.mocked(prisma.attendanceRecord.createMany).mockResolvedValue({ count: 1 } as never)

    await replaceAttendanceUpload({
      previousUpload,
      newFilePath: '/tmp/new.xlsx',
      newFileName: 'new.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: new Date('2025-03-06'),
      payrollWeekEndDate: new Date('2025-03-12'),
      payrollWeekSource: 'SHEET_CONTENT',
      status: 'READY',
      records: [makeRecord()],
      payrollWeekStartISO: '2025-03-06',
    })

    expect(fsModule.unlinkSync).toHaveBeenCalledWith('/tmp/old.xlsx')
  })

  it('deactivates the previous upload record', async () => {
    const previousUpload = makeUpload()
    let capturedTxUpdate: ReturnType<typeof vi.fn> | undefined

    const txUpdate = vi.fn().mockResolvedValue({ ...previousUpload, isActiveForPayrollWeek: false })
    capturedTxUpdate = txUpdate
    vi.mocked(prisma.attendanceUpload.update).mockImplementation(txUpdate as never)
    vi.mocked(prisma.attendanceUpload.create).mockResolvedValue({ id: 'upload-new', isActiveForPayrollWeek: true } as never)
    vi.mocked(prisma.attendanceRecord.createMany).mockResolvedValue({ count: 1 } as never)

    await replaceAttendanceUpload({
      previousUpload,
      newFilePath: '/tmp/new.xlsx',
      newFileName: 'new.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: new Date('2025-03-06'),
      payrollWeekEndDate: new Date('2025-03-12'),
      payrollWeekSource: 'SHEET_CONTENT',
      status: 'READY',
      records: [makeRecord()],
      payrollWeekStartISO: '2025-03-06',
    })

    expect(capturedTxUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'upload-old' },
        data: expect.objectContaining({ isActiveForPayrollWeek: false }),
      })
    )
  })

  it('creates new upload record as active', async () => {
    const previousUpload = makeUpload()
    let capturedTxCreate: ReturnType<typeof vi.fn> | undefined

    const txCreate = vi.fn().mockResolvedValue({ id: 'upload-new', isActiveForPayrollWeek: true })
    capturedTxCreate = txCreate
    vi.mocked(prisma.attendanceUpload.update).mockResolvedValue({ ...previousUpload, isActiveForPayrollWeek: false } as never)
    vi.mocked(prisma.attendanceUpload.create).mockImplementation(txCreate as never)
    vi.mocked(prisma.attendanceRecord.createMany).mockResolvedValue({ count: 1 } as never)

    await replaceAttendanceUpload({
      previousUpload,
      newFilePath: '/tmp/new.xlsx',
      newFileName: 'new.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: new Date('2025-03-06'),
      payrollWeekEndDate: new Date('2025-03-12'),
      payrollWeekSource: 'SHEET_CONTENT',
      status: 'READY',
      records: [makeRecord()],
      payrollWeekStartISO: '2025-03-06',
    })

    expect(capturedTxCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActiveForPayrollWeek: true }),
      })
    )
  })
})
