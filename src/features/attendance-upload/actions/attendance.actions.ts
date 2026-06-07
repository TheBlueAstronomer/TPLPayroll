'use server'

import * as XLSX from 'xlsx'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import os from 'os'
import prisma from '@/lib/prisma'
import { validateAttendanceFile } from '@/features/attendance-upload/services/file-validator.service'
import { detectPayrollWeek } from '@/features/attendance-upload/services/week-detector.service'
import { parseAttendanceWorkbook } from '@/features/attendance-upload/services/workbook-parser.service'
import { matchEmployees } from '@/features/attendance-upload/services/employee-matcher.service'
import { computeImportSummary } from '@/features/attendance-upload/services/import-summary.service'
import {
  createAttendanceUpload,
  replaceAttendanceUpload,
} from '@/features/attendance-upload/services/upload.service'
import {
  createUploadSession,
  loadUploadSession,
  type SessionDecisions,
} from '@/features/attendance-upload/services/upload-session.service'
import type {
  ActionResult,
  MatchedAttendanceRecord,
  MatchStatus,
  PayrollWeekSource,
  PayrollWeekDetectionResult,
  ImportSummary,
  VerificationDecision,
} from '@/features/attendance-upload/types/attendance.types'
import { getBlockKey } from '@/features/attendance-upload/types/attendance.types'

// ─── parseAttendanceFileAction ────────────────────────────────────────────────

export interface ParseAttendanceResult {
  tempFilePath: string
  fileName: string
  fileType: string
  payrollWeek: PayrollWeekDetectionResult
  records: MatchedAttendanceRecord[]
  summary: ImportSummary
}

export async function parseAttendanceFileAction(
  formData: FormData
): Promise<ActionResult<ParseAttendanceResult>> {
  const file = formData.get('file') as File | null
  if (!file) return { ok: false, error: 'No file provided' }

  const fileName = file.name
  const fileType = fileName.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'xls'

  // Validate file type
  const validation = validateAttendanceFile(fileName)
  if (!validation.ok) {
    return { ok: false, error: 'Unsupported file type. Please upload .xls or .xlsx.', code: validation.error }
  }

  // Save to temp file
  const buffer = Buffer.from(await file.arrayBuffer())
  const tmpDir = path.join(os.tmpdir(), 'tplpayroll-attendance')
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
  const tempFilePath = path.join(tmpDir, `attendance_${Date.now()}_${fileName}`)
  writeFileSync(tempFilePath, buffer)

  // Parse workbook
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    return { ok: false, error: 'Failed to parse the file. Ensure it is a valid Excel workbook.' }
  }

  // Detect payroll week
  const payrollWeek = detectPayrollWeek(wb, fileName)

  // Parse blocks
  const { blocks } = parseAttendanceWorkbook(wb)

  // If payroll week is known, match employees; otherwise return week-detection result
  if (payrollWeek.source === 'MANUAL_REQUIRED') {
    return {
      ok: true,
      data: {
        tempFilePath,
        fileName,
        fileType,
        payrollWeek,
        records: [],
        summary: {
          total: blocks.length,
          matched: 0,
          unmatched: 0,
          inactive: 0,
          resignedBeforeWeek: 0,
          rejectedUnmatched: 0,
          needsVerification: 0,
          errors: 0,
          isBlocked: true,
        },
      },
    }
  }

  // Match employees
  const employees = await prisma.employee.findMany()
  const payrollWeekStart = new Date(payrollWeek.start + 'T00:00:00Z')
  const payrollWeekEnd = new Date(payrollWeek.end + 'T00:00:00Z')
  const records = matchEmployees(blocks, employees, payrollWeekStart, payrollWeekEnd)
  const summary = computeImportSummary(records)

  return {
    ok: true,
    data: { tempFilePath, fileName, fileType, payrollWeek, records, summary },
  }
}

// ─── finalizeAttendanceUploadAction ──────────────────────────────────────────

export interface FinalizeUploadInput {
  tempFilePath: string
  fileName: string
  fileType: string
  payrollWeekStartDate: string // ISO date string YYYY-MM-DD
  payrollWeekEndDate: string
  payrollWeekSource: PayrollWeekSource
  records?: MatchedAttendanceRecord[]
  summary?: ImportSummary
  verificationDecisions?: Record<string, VerificationDecision> // employeeDbId → decision
  manualMatchDecisions?: Record<string, string> // blockKey → employeeDbId
  rejectedBlockKeys?: string[] // blockKeys of UNMATCHED records explicitly rejected
}

export async function finalizeAttendanceUploadAction(
  input: FinalizeUploadInput
): Promise<ActionResult<{ uploadId: string }>> {
  const {
    tempFilePath,
    fileName,
    fileType,
    payrollWeekStartDate,
    payrollWeekEndDate,
    payrollWeekSource,
    records,
    verificationDecisions = {},
    manualMatchDecisions = {},
    rejectedBlockKeys = [],
  } = input

  let finalRecords = records
  if (!finalRecords) {
    const parsed = await parseAttendanceWithDatesAction(
      tempFilePath,
      payrollWeekStartDate,
      payrollWeekEndDate,
      fileName,
      fileType
    )
    if (!parsed.ok) {
      return { ok: false, error: parsed.error }
    }
    finalRecords = parsed.data.records
  }

  const weekStart = new Date(payrollWeekStartDate + 'T00:00:00Z')
  const weekEnd = new Date(payrollWeekEndDate + 'T00:00:00Z')

  const rejectedKeySet = new Set(rejectedBlockKeys)

  // Apply manual matches and rejections to UNMATCHED records
  const recordsWithManualMatches = finalRecords.map((r) => {
    if (r.matchStatus !== 'UNMATCHED') return r
    const blockKey = getBlockKey(r)
    const matchedId = manualMatchDecisions[blockKey]
    if (matchedId) {
      return {
        ...r,
        employeeDbId: matchedId,
        matchStatus: 'MANUALLY_MATCHED' as MatchStatus,
        isBlocking: false,
      }
    }
    if (rejectedKeySet.has(blockKey)) {
      return {
        ...r,
        matchStatus: 'REJECTED_UNMATCHED' as MatchStatus,
        isBlocking: false,
      }
    }
    return r
  })

  // Merge verification decisions onto records
  const recordsWithDecisions = recordsWithManualMatches.map((r) =>
    r.employeeDbId && verificationDecisions[r.employeeDbId]
      ? { ...r, verificationDecision: verificationDecisions[r.employeeDbId] }
      : r
  )

  // Recompute summary after manual matches (some UNMATCHED may now be resolved)
  const recomputedSummary = computeImportSummary(recordsWithDecisions)
  const status = recomputedSummary.isBlocked ? 'ERRORS' : 'READY'

  // Check for existing upload for this week
  const existing = await prisma.attendanceUpload.findFirst({
    where: {
      payrollWeekStartDate: weekStart,
      payrollWeekEndDate: weekEnd,
      isActiveForPayrollWeek: true,
    },
  })

  if (existing) {
    const result = await replaceAttendanceUpload({
      previousUpload: existing,
      newFilePath: tempFilePath,
      newFileName: fileName,
      fileType,
      payrollWeekStartDate: weekStart,
      payrollWeekEndDate: weekEnd,
      payrollWeekSource,
      status,
      records: recordsWithDecisions,
      payrollWeekStartISO: payrollWeekStartDate,
    })
    return { ok: true, data: { uploadId: result.uploadId } }
  }

  const result = await createAttendanceUpload({
    newFilePath: tempFilePath,
    newFileName: fileName,
    fileType,
    payrollWeekStartDate: weekStart,
    payrollWeekEndDate: weekEnd,
    payrollWeekSource,
    status,
    records: recordsWithDecisions,
    payrollWeekStartISO: payrollWeekStartDate,
  })
  return { ok: true, data: { uploadId: result.uploadId } }
}

// ─── parseAttendanceWithDatesAction ──────────────────────────────────────────
// Used when MANUAL_REQUIRED: reads temp file, matches employees with user-supplied dates

export async function parseAttendanceWithDatesAction(
  tempFilePath: string,
  payrollWeekStartDate: string,  // YYYY-MM-DD
  payrollWeekEndDate: string,
  fileName: string,
  fileType: string
): Promise<ActionResult<ParseAttendanceResult>> {
  const { readFileSync, existsSync } = await import('fs')
  if (!existsSync(tempFilePath)) {
    return { ok: false, error: 'Temporary file not found. Please upload again.' }
  }

  const buffer = readFileSync(tempFilePath)
  const XLSX = await import('xlsx')
  let wb: ReturnType<typeof XLSX.read>
  try {
    wb = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    return { ok: false, error: 'Failed to read the temporary file.' }
  }

  const { parseAttendanceWorkbook } = await import('@/features/attendance-upload/services/workbook-parser.service')
  const { matchEmployees } = await import('@/features/attendance-upload/services/employee-matcher.service')
  const { computeImportSummary } = await import('@/features/attendance-upload/services/import-summary.service')

  const { blocks } = parseAttendanceWorkbook(wb)
  const employees = await prisma.employee.findMany()
  const weekStart = new Date(payrollWeekStartDate + 'T00:00:00Z')
  const weekEnd = new Date(payrollWeekEndDate + 'T00:00:00Z')
  const records = matchEmployees(blocks, employees, weekStart, weekEnd)
  const summary = computeImportSummary(records)

  return {
    ok: true,
    data: {
      tempFilePath,
      fileName,
      fileType,
      payrollWeek: { source: 'MANUAL', start: payrollWeekStartDate, end: payrollWeekEndDate },
      records,
      summary,
    },
  }
}

// ─── getEmployeesForMatchingAction ────────────────────────────────────────────

export interface EmployeeOption {
  id: string
  employeeId: string
  employeeName: string
}

export async function getEmployeesForMatchingAction(): Promise<ActionResult<EmployeeOption[]>> {
  const employees = await prisma.employee.findMany({
    select: { id: true, employeeId: true, employeeName: true },
    orderBy: { employeeName: 'asc' },
  })
  return { ok: true, data: employees }
}

// ─── getAttendanceUploadsAction ───────────────────────────────────────────────

export interface AttendanceUploadRow {
  id: string
  fileName: string
  payrollWeekStartDate: string
  payrollWeekEndDate: string
  status: string
  uploadedAt: string
}

export async function getAttendanceUploadsAction(): Promise<ActionResult<AttendanceUploadRow[]>> {
  const uploads = await prisma.attendanceUpload.findMany({
    where: { isActiveForPayrollWeek: true },
    orderBy: { payrollWeekStartDate: 'desc' },
    take: 20,
  })

  return {
    ok: true,
    data: uploads.map((u) => ({
      id: u.id,
      fileName: u.fileName,
      payrollWeekStartDate: u.payrollWeekStartDate.toISOString().slice(0, 10),
      payrollWeekEndDate: u.payrollWeekEndDate.toISOString().slice(0, 10),
      status: u.status,
      uploadedAt: u.uploadedAt.toISOString(),
    })),
  }
}

// ─── getAttendanceUploadPreviewAction ─────────────────────────────────────────

export interface AttendancePreviewData {
  upload: AttendanceUploadRow
  records: {
    id: string
    employeeName: string
    employeeId: string
    totalRegularHours: number
    totalOvertimeHours: number
    sourceSheetName: string | null
  }[]
}

export async function getAttendanceUploadPreviewAction(
  uploadId: string
): Promise<ActionResult<AttendancePreviewData>> {
  const upload = await prisma.attendanceUpload.findUnique({
    where: { id: uploadId },
  })
  if (!upload) return { ok: false, error: 'Upload not found' }

  // Re-parse source file to show ALL records (matched and unmatched), then overlay
  // the saved state (verification decisions + manual matches) from the DB.
  if (upload.sourceFilePath && existsSync(upload.sourceFilePath)) {
    try {
      const buffer = require('fs').readFileSync(upload.sourceFilePath)
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const { blocks } = parseAttendanceWorkbook(wb)
      const employees = await prisma.employee.findMany()
      const records = matchEmployees(
        blocks,
        employees,
        upload.payrollWeekStartDate,
        upload.payrollWeekEndDate
      )

      // Load saved decisions + manual matches from stored AttendanceRecord rows.
      // Key = sourceSheetName||sourceEmployeeBlockIndex (same formula as getBlockKey).
      const savedRows = await prisma.attendanceRecord.findMany({
        where: { attendanceUploadId: uploadId },
        select: { sourceSheetName: true, sourceEmployeeBlockIndex: true, verificationDecision: true },
      })
      const savedByBlockKey = new Map<string, { verificationDecision: string | null }>()
      for (const row of savedRows) {
        const key = `${row.sourceSheetName ?? ''}||${row.sourceEmployeeBlockIndex}`
        if (!savedByBlockKey.has(key)) {
          savedByBlockKey.set(key, { verificationDecision: row.verificationDecision })
        }
      }

      return {
        ok: true,
        data: {
          upload: {
            id: upload.id,
            fileName: upload.fileName,
            payrollWeekStartDate: upload.payrollWeekStartDate
              .toISOString()
              .slice(0, 10),
            payrollWeekEndDate: upload.payrollWeekEndDate.toISOString().slice(0, 10),
            status: upload.status,
            uploadedAt: upload.uploadedAt.toISOString(),
          },
          records: records.map((r, i) => {
            const blockKey = `${r.sourceSheetName ?? ''}||${r.sourceEmployeeBlockIndex}`
            const saved = savedByBlockKey.get(blockKey)
            // UNMATCHED with a saved record = was manually matched in the upload dialog
            const matchStatus =
              r.matchStatus === 'UNMATCHED' && saved ? 'MANUALLY_MATCHED' : r.matchStatus
            return {
              id: `preview-${i}`,
              employeeName: r.employeeName,
              employeeId: r.employeeDbId || '—',
              totalRegularHours: r.totalRegularHours,
              totalOvertimeHours: r.totalOvertimeHours,
              sourceSheetName: r.sourceSheetName,
              matchStatus,
              isBlocking: matchStatus === 'UNMATCHED',
              verificationDecision: saved?.verificationDecision ?? null,
            }
          }),
        },
      }
    } catch (err) {
      console.error('Failed to re-parse upload file for preview:', err)
    }
  }

  // Fallback to saved records if file is missing (will only show matched)
  const records = await prisma.attendanceRecord.findMany({
    where: { attendanceUploadId: uploadId },
    include: { employee: { select: { id: true, employeeId: true, employeeName: true } } },
    distinct: ['employeeId'],
    orderBy: { sourceSheetName: 'asc' },
  })

  const grouped = new Map<string, (typeof records)[0][]>()
  for (const r of records) {
    const key = r.employeeId
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(r)
  }

  const summaryRows = Array.from(grouped.entries()).map(([, recs]) => {
    const first = recs[0]
    const totalRegular = recs.reduce((sum, r) => sum + Number(r.regularHours), 0)
    const totalOT = recs.reduce((sum, r) => sum + Number(r.overtimeHours), 0)
    return {
      id: first.id,
      employeeName: first.employee.employeeName,
      employeeId: first.employee.id,
      totalRegularHours: Math.round(totalRegular * 100) / 100,
      totalOvertimeHours: Math.round(totalOT * 100) / 100,
      sourceSheetName: first.sourceSheetName,
      matchStatus: 'MATCHED' as const,
      isBlocking: false,
    }
  })

  return {
    ok: true,
    data: {
      upload: {
        id: upload.id,
        fileName: upload.fileName,
        payrollWeekStartDate: upload.payrollWeekStartDate.toISOString().slice(0, 10),
        payrollWeekEndDate: upload.payrollWeekEndDate.toISOString().slice(0, 10),
        status: upload.status,
        uploadedAt: upload.uploadedAt.toISOString(),
      },
      records: summaryRows,
    },
  }
}

// ─── createAttendanceUploadSessionAction ─────────────────────────────────────
// Serialises the current dialog state to a short-lived AttendanceUploadSession
// row so the user can navigate to /employees/new and return.

export interface CreateUploadSessionInput {
  tempFilePath: string
  fileName: string
  fileType: string
  payrollWeekStartDate: string // YYYY-MM-DD
  payrollWeekEndDate: string
  payrollWeekSource: PayrollWeekSource
  verificationDecisions: Record<string, VerificationDecision>
  manualMatchDecisions: Record<string, string>
  rejectedBlockKeys: string[]
  pendingBlockKey: string
  pendingSheetEmployeeName: string
}

export async function createAttendanceUploadSessionAction(
  input: CreateUploadSessionInput
): Promise<ActionResult<{ sessionId: string; pendingSheetEmployeeName: string }>> {
  const decisions: SessionDecisions = {
    verificationDecisions: input.verificationDecisions,
    manualMatchDecisions: input.manualMatchDecisions,
    rejectedBlockKeys: input.rejectedBlockKeys,
  }

  // Store the pending sheet name inside decisionsJson under a reserved key so
  // /employees/new can pre-fill the form without a separate column.
  const decisionsForStore = {
    ...decisions,
    _pendingSheetEmployeeName: input.pendingSheetEmployeeName,
  } as SessionDecisions & { _pendingSheetEmployeeName: string }

  const session = await createUploadSession({
    tempFilePath: input.tempFilePath,
    fileName: input.fileName,
    fileType: input.fileType,
    weekStart: input.payrollWeekStartDate,
    weekEnd: input.payrollWeekEndDate,
    weekSource: input.payrollWeekSource,
    decisions: decisionsForStore,
    pendingBlockKey: input.pendingBlockKey,
  })

  return {
    ok: true,
    data: {
      sessionId: session.id,
      pendingSheetEmployeeName: input.pendingSheetEmployeeName,
    },
  }
}

// ─── getAttendanceUploadSessionAction ────────────────────────────────────────
// Light-weight session read used by /employees/new to pre-fill the form.

export async function getAttendanceUploadSessionAction(
  sessionId: string
): Promise<ActionResult<{ pendingSheetEmployeeName: string }>> {
  const session = await loadUploadSession(sessionId)
  if (!session) {
    return { ok: false, error: 'Upload session expired. Please re-upload the attendance file.', code: 'SESSION_EXPIRED' }
  }
  const stored = session.decisions as SessionDecisions & { _pendingSheetEmployeeName?: string }
  return {
    ok: true,
    data: {
      pendingSheetEmployeeName: stored._pendingSheetEmployeeName ?? '',
    },
  }
}

// ─── resumeAttendanceUploadSessionAction ─────────────────────────────────────
// Reconstructs the verification-dialog state after a successful onboard.
// Re-parses the temp file, overlays stored decisions, and links the new
// employee to the pendingBlockKey row by adding it to manualMatchDecisions.

export interface ResumedDialogState {
  tempFilePath: string
  fileName: string
  fileType: string
  payrollWeekStartDate: string
  payrollWeekEndDate: string
  payrollWeekSource: PayrollWeekSource
  records: MatchedAttendanceRecord[]
  summary: ImportSummary
  verificationDecisions: Record<string, VerificationDecision>
  manualMatchDecisions: Record<string, string>
  rejectedBlockKeys: string[]
}

export async function resumeAttendanceUploadSessionAction(
  sessionId: string,
  newEmployeeId: string
): Promise<ActionResult<ResumedDialogState>> {
  const session = await loadUploadSession(sessionId)
  if (!session) {
    return {
      ok: false,
      error: 'Upload session expired. Please re-upload the attendance file.',
      code: 'SESSION_EXPIRED',
    }
  }

  // Re-parse the still-live temp file via parseAttendanceWithDatesAction
  const parsed = await parseAttendanceWithDatesAction(
    session.tempFilePath,
    session.weekStart,
    session.weekEnd,
    session.fileName,
    session.fileType
  )

  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      code: parsed.code,
    }
  }

  // Link the new employee to the pending blockKey by merging into manualMatchDecisions
  const manualMatchDecisions = {
    ...session.decisions.manualMatchDecisions,
    [session.pendingBlockKey]: newEmployeeId,
  }

  return {
    ok: true,
    data: {
      tempFilePath: session.tempFilePath,
      fileName: session.fileName,
      fileType: session.fileType,
      payrollWeekStartDate: session.weekStart,
      payrollWeekEndDate: session.weekEnd,
      payrollWeekSource: session.weekSource,
      records: parsed.data.records,
      summary: parsed.data.summary,
      verificationDecisions: session.decisions.verificationDecisions ?? {},
      manualMatchDecisions,
      rejectedBlockKeys: session.decisions.rejectedBlockKeys ?? [],
    },
  }
}
