import { describe, it, expect, beforeEach, vi } from 'vitest'
import { replaceAttendanceUpload } from './upload.service'
import prisma from '@/lib/prisma'
import * as fs from 'fs'

// No top-level vi.mock needed if we use spyOn

describe('upload.service - replaceAttendanceUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should deactivate the old upload and create a new one in a transaction', async () => {
    // 1. Arrange
    const oldUploadId = 'old-id'
    const newUploadId = 'new-id'
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
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

    // Mock Prisma Transaction
    // We need to mock the $transaction method and the functions inside it
    const mockTx = {
      attendanceUpload: {
        update: vi.fn().mockResolvedValue({ id: oldUploadId, isActiveForPayrollWeek: false }),
        create: vi.fn().mockResolvedValue({ id: newUploadId, ...params, isActiveForPayrollWeek: true }),
      },
      attendanceRecord: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      return callback(mockTx as any)
    })

    // 2. Act
    const result = await replaceAttendanceUpload(params)

    // 3. Assert
    // A. File system calls
    expect(existsSpy).toHaveBeenCalledWith(previousUpload.sourceFilePath)
    expect(unlinkSpy).toHaveBeenCalledWith(previousUpload.sourceFilePath)

    // B. Transaction calls
    expect(mockTx.attendanceUpload.update).toHaveBeenCalledWith({
      where: { id: oldUploadId },
      data: { isActiveForPayrollWeek: false },
    })

    expect(mockTx.attendanceUpload.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fileName: 'new.xlsx',
        isActiveForPayrollWeek: true,
      }),
    })

    expect(mockTx.attendanceRecord.createMany).toHaveBeenCalled()

    // C. Result
    expect(result.uploadId).toBe(newUploadId)
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

    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false)
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})
    
    const mockTx = {
      attendanceUpload: {
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({ id: 'new-id' }),
      },
      attendanceRecord: {
        createMany: vi.fn(),
      },
    }
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => callback(mockTx as any))

    // Act
    await replaceAttendanceUpload(params)

    // Assert
    expect(unlinkSpy).not.toHaveBeenCalled()
    expect(mockTx.attendanceUpload.update).toHaveBeenCalled()
  })
})
