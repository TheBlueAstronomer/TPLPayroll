import * as fsModule from 'fs'
import prisma from '@/lib/prisma'
import type { AttendanceUpload } from '@prisma/client'
import type {
  MatchedAttendanceRecord,
  PayrollWeekSource,
  AttendanceUploadResult,
} from '@/features/attendance-upload/types/attendance.types'

// ─── createAttendanceUpload ───────────────────────────────────────────────────

export interface CreateUploadParams {
  newFilePath: string
  newFileName: string
  fileType: string
  payrollWeekStartDate: Date
  payrollWeekEndDate: Date
  payrollWeekSource: PayrollWeekSource
  status: string
  records: MatchedAttendanceRecord[]
  payrollWeekStartISO: string // YYYY-MM-DD
}

export async function createAttendanceUpload(
  params: CreateUploadParams
): Promise<AttendanceUploadResult> {
  const {
    newFilePath,
    newFileName,
    fileType,
    payrollWeekStartDate,
    payrollWeekEndDate,
    payrollWeekSource,
    status,
    records,
    payrollWeekStartISO,
  } = params

  return prisma.$transaction(async (tx) => {
    const upload = await (tx as typeof prisma).attendanceUpload.create({
      data: {
        fileName: newFileName,
        fileType,
        payrollWeekStartDate,
        payrollWeekEndDate,
        payrollWeekSource,
        status,
        isActiveForPayrollWeek: true,
        sourceFilePath: newFilePath,
      },
    })

    await saveAttendanceRecords(tx as typeof prisma, upload.id, records, payrollWeekStartISO)

    return {
      uploadId: upload.id,
      payrollWeekStartDate: upload.payrollWeekStartDate,
      payrollWeekEndDate: upload.payrollWeekEndDate,
      payrollWeekSource: upload.payrollWeekSource as PayrollWeekSource,
      status: upload.status,
      isActiveForPayrollWeek: upload.isActiveForPayrollWeek,
    }
  })
}

// ─── replaceAttendanceUpload ──────────────────────────────────────────────────

export interface ReplaceUploadParams extends CreateUploadParams {
  previousUpload: AttendanceUpload
}

export async function replaceAttendanceUpload(
  params: ReplaceUploadParams
): Promise<AttendanceUploadResult> {
  const { previousUpload, ...createParams } = params

  // Delete previous file immediately (outside transaction — best-effort)
  if (fsModule.existsSync(previousUpload.sourceFilePath)) {
    fsModule.unlinkSync(previousUpload.sourceFilePath)
  }

  return prisma.$transaction(async (tx) => {
    // Deactivate old upload
    await (tx as typeof prisma).attendanceUpload.update({
      where: { id: previousUpload.id },
      data: { isActiveForPayrollWeek: false },
    })

    // Create new upload as active
    const upload = await (tx as typeof prisma).attendanceUpload.create({
      data: {
        fileName: createParams.newFileName,
        fileType: createParams.fileType,
        payrollWeekStartDate: createParams.payrollWeekStartDate,
        payrollWeekEndDate: createParams.payrollWeekEndDate,
        payrollWeekSource: createParams.payrollWeekSource,
        status: createParams.status,
        isActiveForPayrollWeek: true,
        sourceFilePath: createParams.newFilePath,
      },
    })

    await saveAttendanceRecords(
      tx as typeof prisma,
      upload.id,
      createParams.records,
      createParams.payrollWeekStartISO
    )

    return {
      uploadId: upload.id,
      payrollWeekStartDate: upload.payrollWeekStartDate,
      payrollWeekEndDate: upload.payrollWeekEndDate,
      payrollWeekSource: upload.payrollWeekSource as PayrollWeekSource,
      status: upload.status,
      isActiveForPayrollWeek: upload.isActiveForPayrollWeek,
    }
  })
}

// ─── saveAttendanceRecords ────────────────────────────────────────────────────

async function saveAttendanceRecords(
  tx: typeof prisma,
  uploadId: string,
  records: MatchedAttendanceRecord[],
  payrollWeekStartISO: string // YYYY-MM-DD — base date for day offsets
): Promise<void> {
  const baseDate = new Date(payrollWeekStartISO + 'T00:00:00Z')

  const matchedRecords = records.filter(
    (r) =>
      (r.matchStatus === 'MATCHED' ||
        r.matchStatus === 'MANUALLY_MATCHED' ||
        r.matchStatus === 'INACTIVE' ||
        r.matchStatus === 'RESIGNED_BEFORE_WEEK') &&
      r.employeeDbId
  )

  if (matchedRecords.length === 0) return

  const rowsToInsert = matchedRecords.flatMap((record) =>
    record.dailyHours.map((dh, dayIndex) => {
      const date = new Date(baseDate)
      date.setUTCDate(date.getUTCDate() + dayIndex)
      return {
        attendanceUploadId: uploadId,
        employeeId: record.employeeDbId!,
        attendanceDate: date,
        regularHours: dh.regularHours,
        overtimeHours: dh.overtimeHours,
        sourceSheetName: record.sourceSheetName,
        sourceEmployeeBlockIndex: record.sourceEmployeeBlockIndex,
        verificationDecision: record.verificationDecision ?? null,
      }
    })
  )

  await tx.attendanceRecord.createMany({ data: rowsToInsert })
}
