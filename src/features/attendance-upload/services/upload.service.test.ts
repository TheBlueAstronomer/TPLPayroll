import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    default: { ...actual, existsSync: vi.fn(), unlinkSync: vi.fn() },
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  }
})

vi.mock('@/lib/prisma', () => ({
  default: {
    attendanceUpload: {
      update: vi.fn(),
      create: vi.fn(),
    },
    attendanceRecord: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { replaceAttendanceUpload } from './upload.service'
import prisma from '@/lib/prisma'
import * as fs from 'fs'

describe('upload.service - replaceAttendanceUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (promises) => {
      if (Array.isArray(promises)) {
        return Promise.all(promises)
      }
      return promises
    })
  })

  it('should deactivate the old upload and create a new one in a transaction', async () => {
    // 1. Arrange
    const oldUploadId = 'old-id'
    const payrollWeekStart = new Date('2025-05-01T00:00:00Z')
    const payrollWeekEnd = new Date('2025-05-07T00:00:00Z')

    const previousUpload = {
      id: oldUploadId,
      sourceFilePath: '/tmp/old.xlsx',
      isActiveForPayrollWeek: true,
      payrollWeekStartDate: payrollWeekStart,
      payrollWeekEndDate: payrollWeekEnd,
    } as any

    const params = {
      previousUpload,
      newFilePath: '/tmp/new.xlsx',
      newFileName: 'new.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: payrollWeekStart,
      payrollWeekEndDate: payrollWeekEnd,
      payrollWeekSource: 'AUTO' as const,
      status: 'READY',
      records: [
        {
          employeeDbId: 'emp-1',
          matchStatus: 'MATCHED',
          dailyHours: [{ regularHours: 8, overtimeHours: 0 }],
          sourceSheetName: 'Sheet1',
          sourceEmployeeBlockIndex: 0,
        },
      ] as any,
      payrollWeekStartISO: '2025-05-01',
    }

    // Mock fs calls
    const existsSpy = vi.mocked(fs.existsSync).mockReturnValue(true)
    const unlinkSpy = vi.mocked(fs.unlinkSync).mockImplementation(() => {})

    // Mock Prisma
    vi.mocked(prisma.attendanceUpload.update).mockResolvedValue({ id: oldUploadId, isActiveForPayrollWeek: false } as any)
    vi.mocked(prisma.attendanceUpload.create).mockResolvedValue({ id: 'new-id-1', ...params, isActiveForPayrollWeek: true } as any)
    vi.mocked(prisma.attendanceRecord.createMany).mockResolvedValue({ count: 1 } as any)

    // 2. Act
    const result = await replaceAttendanceUpload(params)

    // 3. Assert
    expect(existsSpy).toHaveBeenCalledWith(previousUpload.sourceFilePath)
    expect(unlinkSpy).toHaveBeenCalledWith(previousUpload.sourceFilePath)

    expect(prisma.attendanceUpload.update).toHaveBeenCalledWith({
      where: { id: oldUploadId },
      data: { isActiveForPayrollWeek: false },
    })

    expect(prisma.attendanceUpload.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fileName: 'new.xlsx',
        isActiveForPayrollWeek: true,
      }),
    })

    expect(prisma.attendanceRecord.createMany).toHaveBeenCalled()

    // C. Result
    expect(result.uploadId).toBeDefined()
    expect(result.isActiveForPayrollWeek).toBe(true)
  })

  it('should still proceed if the old file does not exist', async () => {
    // Arrange
    const previousUpload = {
      id: 'old-id',
      sourceFilePath: '/tmp/missing.xlsx',
    } as any

    const params = {
      previousUpload,
      newFilePath: '/tmp/new.xlsx',
      newFileName: 'new.xlsx',
      fileType: 'xlsx',
      payrollWeekStartDate: new Date(),
      payrollWeekEndDate: new Date(),
      payrollWeekSource: 'AUTO' as const,
      status: 'READY',
      records: [],
      payrollWeekStartISO: '2025-05-01',
    }

    const existsSpy = vi.mocked(fs.existsSync).mockReturnValue(false)
    const unlinkSpy = vi.mocked(fs.unlinkSync).mockImplementation(() => {})

    vi.mocked(prisma.attendanceUpload.update).mockResolvedValue({} as any)
    vi.mocked(prisma.attendanceUpload.create).mockResolvedValue({ id: 'new-id' } as any)

    // Act
    await replaceAttendanceUpload(params)

    // Assert
    expect(unlinkSpy).not.toHaveBeenCalled()
    expect(prisma.attendanceUpload.update).toHaveBeenCalled()
  })
})
