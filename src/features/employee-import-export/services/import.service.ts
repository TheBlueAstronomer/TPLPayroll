import * as XLSX from 'xlsx'
import prisma from '@/lib/prisma'
import {
  IMPORT_SHEET_NAME,
  IMPORT_COLUMNS,
  type ImportRowErrorCode,
  type ValidImportRow,
  type InvalidImportRow,
  type DuplicateImportRow,
  type ParseImportResult,
  type ExecuteImportResult,
  type ImportRowData,
} from '@/features/employee-import-export/types/import-export.types'

// ─── mapActiveValue ───────────────────────────────────────────────────────────

export function mapActiveValue(value: string): boolean | 'INVALID_ACTIVE_VALUE' {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'active') return true
  if (normalized === 'inactive') return false
  return 'INVALID_ACTIVE_VALUE'
}

// ─── validateImportFile ───────────────────────────────────────────────────────

export function validateImportFile(
  buffer: Buffer,
  fileName: string
): { ok: true } | { ok: false; error: 'UNSUPPORTED_FILE_TYPE' | 'SHEET_NOT_FOUND' } {
  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    return { ok: false, error: 'UNSUPPORTED_FILE_TYPE' }
  }

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    return { ok: false, error: 'UNSUPPORTED_FILE_TYPE' }
  }

  if (!workbook.SheetNames.includes(IMPORT_SHEET_NAME)) {
    return { ok: false, error: 'SHEET_NOT_FOUND' }
  }

  return { ok: true }
}

// ─── parseRow ─────────────────────────────────────────────────────────────────

function parseExcelDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return value
  if (typeof value === 'number') {
    return XLSX.SSF.parse_date_code(value)
      ? new Date(Date.UTC(1900, 0, value - (value >= 60 ? 2 : 1)))
      : null
  }
  const d = new Date(String(value))
  return isNaN(d.getTime()) ? null : d
}

function parseNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return isNaN(n) ? null : n
}

function str(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value).trim()
}

export function normalizeEmployeeId(employeeId: string): string {
  const trimmed = employeeId.trim()
  const match = trimmed.match(/^([A-Z]+)(\d{6})$/)
  if (match) {
    const prefix = match[1]
    const lastThreeDigits = match[2].slice(-3)
    return `${prefix}${lastThreeDigits}`
  }
  return trimmed
}

interface RawRow {
  rowNumber: number
  data: Record<string, unknown>
}

function validateAndParseRow(raw: RawRow):
  | { valid: ImportRowData }
  | { invalid: { errors: ImportRowErrorCode[]; partialData: Partial<ImportRowData> } } {
  const errors: ImportRowErrorCode[] = []
  const d = raw.data

  const rawEmployeeId = str(d[IMPORT_COLUMNS.employeeId])
  const employeeId = rawEmployeeId ? normalizeEmployeeId(rawEmployeeId) : null
  const employeeName = str(d[IMPORT_COLUMNS.employeeName])
  const designation = str(d[IMPORT_COLUMNS.designation])
  const salaryRaw = d[IMPORT_COLUMNS.salary]
  const hourlyRateRaw = d[IMPORT_COLUMNS.hourlyRate]
  const activeRaw = str(d[IMPORT_COLUMNS.active])

  if (!employeeId) errors.push('MISSING_EMPLOYEE_ID')
  if (!employeeName) errors.push('MISSING_EMPLOYEE_NAME')
  if (!designation) errors.push('MISSING_DESIGNATION')

  let salary: number | null = null
  if (salaryRaw == null || salaryRaw === '') {
    errors.push('MISSING_SALARY')
  } else {
    salary = parseNumber(salaryRaw)
    if (salary === null) errors.push('INVALID_SALARY')
  }

  let hourlyRate: number | null = null
  if (hourlyRateRaw == null || hourlyRateRaw === '') {
    errors.push('MISSING_HOURLY_RATE')
  } else {
    hourlyRate = parseNumber(hourlyRateRaw)
    if (hourlyRate === null) errors.push('INVALID_HOURLY_RATE')
  }

  let isActive: boolean | null = null
  if (!activeRaw) {
    errors.push('MISSING_ACTIVE')
  } else {
    const mapped = mapActiveValue(activeRaw)
    if (mapped === 'INVALID_ACTIVE_VALUE') {
      errors.push('INVALID_ACTIVE_VALUE')
    } else {
      isActive = mapped
    }
  }

  if (errors.length > 0) {
    const partialData: Partial<ImportRowData> = {
      serialNumber: str(d[IMPORT_COLUMNS.serialNumber]),
      ...(employeeId ? { employeeId } : {}),
      ...(employeeName ? { employeeName } : {}),
      nationalId: str(d[IMPORT_COLUMNS.nationalId]),
      ...(designation ? { designation } : {}),
      dateOfJoining: parseExcelDate(d[IMPORT_COLUMNS.dateOfJoining]),
      aadhaarId: str(d[IMPORT_COLUMNS.aadhaarId]),
      policeVerificationId: str(d[IMPORT_COLUMNS.policeVerificationId]),
      ...(salary !== null ? { salary } : {}),
      ...(hourlyRate !== null ? { hourlyRate } : {}),
      phone: str(d[IMPORT_COLUMNS.phone]),
      dateOfBirth: parseExcelDate(d[IMPORT_COLUMNS.dateOfBirth]),
      healthCardId: str(d[IMPORT_COLUMNS.healthCardId]),
      gPay: str(d[IMPORT_COLUMNS.gPay]),
      bankAccount: str(d[IMPORT_COLUMNS.bankAccount]),
      dateOfResignation: parseExcelDate(d[IMPORT_COLUMNS.dateOfResignation]),
      site: str(d[IMPORT_COLUMNS.site]),
      ...(isActive !== null ? { isActive } : {}),
      designationShort: str(d[IMPORT_COLUMNS.designationShort]),
    }
    return { invalid: { errors, partialData } }
  }

  return {
    valid: {
      serialNumber: str(d[IMPORT_COLUMNS.serialNumber]),
      employeeId: employeeId!,
      employeeName: employeeName!,
      nationalId: str(d[IMPORT_COLUMNS.nationalId]),
      designation: designation!,
      dateOfJoining: parseExcelDate(d[IMPORT_COLUMNS.dateOfJoining]),
      aadhaarId: str(d[IMPORT_COLUMNS.aadhaarId]),
      policeVerificationId: str(d[IMPORT_COLUMNS.policeVerificationId]),
      salary: salary!,
      hourlyRate: hourlyRate!,
      phone: str(d[IMPORT_COLUMNS.phone]),
      dateOfBirth: parseExcelDate(d[IMPORT_COLUMNS.dateOfBirth]),
      healthCardId: str(d[IMPORT_COLUMNS.healthCardId]),
      gPay: str(d[IMPORT_COLUMNS.gPay]),
      bankAccount: str(d[IMPORT_COLUMNS.bankAccount]),
      dateOfResignation: parseExcelDate(d[IMPORT_COLUMNS.dateOfResignation]),
      site: str(d[IMPORT_COLUMNS.site]),
      isActive: isActive!,
      designationShort: str(d[IMPORT_COLUMNS.designationShort]),
    },
  }
}

// ─── parseImportFile ──────────────────────────────────────────────────────────

export async function parseImportFile(buffer: Buffer): Promise<ParseImportResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = workbook.Sheets[IMPORT_SHEET_NAME]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

  const totalRows = rawRows.length
  const validRows: ValidImportRow[] = []
  const invalidRows: InvalidImportRow[] = []
  const seenIds = new Map<string, number>() // employeeId -> first rowNumber
  const duplicateIdRows: DuplicateImportRow[] = []

  // Fetch existing employee IDs to determine CREATE vs UPDATE
  const existingEmployees = await prisma.employee.findMany({
    select: { employeeId: true },
  })
  const existingIdSet = new Set(existingEmployees.map((e) => e.employeeId))

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2 // row 1 is header
    const result = validateAndParseRow({ rowNumber, data: row })

    if ('invalid' in result) {
      invalidRows.push({
        rowNumber,
        employeeId: str(row[IMPORT_COLUMNS.employeeId]),
        employeeName: str(row[IMPORT_COLUMNS.employeeName]),
        errors: result.invalid.errors,
        partialData: result.invalid.partialData,
      })
      return
    }

    const { employeeId } = result.valid

    const action = existingIdSet.has(employeeId) ? 'UPDATE' : 'CREATE'

    if (seenIds.has(employeeId)) {
      // Subsequent occurrence — flagged as duplicate but still carries data for processing
      duplicateIdRows.push({ rowNumber, employeeId, action, data: result.valid })
    } else {
      seenIds.set(employeeId, rowNumber)
      validRows.push({ rowNumber, action, data: result.valid })
    }
  })

  return { totalRows, validRows, invalidRows, duplicateIdRows }
}

// ─── executeImport ────────────────────────────────────────────────────────────

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function applyRowToDb(
  tx: PrismaTx,
  data: ImportRowData,
  action: 'CREATE' | 'UPDATE',
  batchId: string,
  today: Date,
  processedInFile: Map<string, string>
): Promise<{ created: boolean; updated: boolean }> {
  const alreadyProcessedId = processedInFile.get(data.employeeId)

  if (action === 'CREATE' && !alreadyProcessedId) {
    const created = await tx.employee.create({
      data: {
        employeeImportBatchId: batchId,
        employeeId: data.employeeId,
        serialNumber: data.serialNumber,
        employeeName: data.employeeName,
        nationalId: data.nationalId,
        designation: data.designation,
        designationShort: data.designationShort,
        dateOfJoining: data.dateOfJoining,
        aadhaarId: data.aadhaarId,
        policeVerificationId: data.policeVerificationId,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        healthCardId: data.healthCardId,
        gPay: data.gPay,
        bankAccount: data.bankAccount,
        dateOfResignation: data.dateOfResignation,
        site: data.site,
        isActive: data.isActive,
      },
    })

    await tx.employeeWageHistory.create({
      data: {
        employeeId: created.id,
        weeklySalary: data.salary,
        hourlyRate: data.hourlyRate,
        effectiveFrom: today,
        effectiveTo: null,
        changeSource: 'IMPORT',
        employeeImportBatchId: batchId,
      },
    })

    await tx.auditLog.create({
      data: {
        actionType: 'CREATE',
        entityType: 'EMPLOYEE',
        entityId: created.id,
        detailsJson: { employeeId: created.employeeId, source: 'IMPORT', batchId },
      },
    })

    processedInFile.set(data.employeeId, created.id)
    return { created: true, updated: false }
  }

  // UPDATE path — or duplicate (alreadyProcessedId exists)
  const existingDbId =
    alreadyProcessedId ??
    (await tx.employee
      .findMany({ where: { employeeId: data.employeeId }, select: { id: true } })
      .then((r) => r[0]?.id ?? null))

  if (!existingDbId) return { created: false, updated: false }

  await tx.employee.update({
    where: { id: existingDbId },
    data: {
      serialNumber: data.serialNumber,
      employeeName: data.employeeName,
      nationalId: data.nationalId,
      designation: data.designation,
      designationShort: data.designationShort,
      dateOfJoining: data.dateOfJoining,
      aadhaarId: data.aadhaarId,
      policeVerificationId: data.policeVerificationId,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      healthCardId: data.healthCardId,
      gPay: data.gPay,
      bankAccount: data.bankAccount,
      dateOfResignation: data.dateOfResignation,
      site: data.site,
      isActive: data.isActive,
      employeeImportBatchId: batchId,
    },
  })

  const currentWage = await tx.employeeWageHistory.findMany({
    where: { employeeId: existingDbId, effectiveTo: null },
    orderBy: { effectiveFrom: 'desc' },
    take: 1,
  })
  const cw = currentWage[0]
  const wageChanged = cw
    ? Number(cw.weeklySalary) !== data.salary || Number(cw.hourlyRate) !== data.hourlyRate
    : true

  if (wageChanged) {
    await tx.employeeWageHistory.updateMany({
      where: { employeeId: existingDbId, effectiveTo: null },
      data: { effectiveTo: today },
    })
    await tx.employeeWageHistory.create({
      data: {
        employeeId: existingDbId,
        weeklySalary: data.salary,
        hourlyRate: data.hourlyRate,
        effectiveFrom: today,
        effectiveTo: null,
        changeSource: 'IMPORT',
        employeeImportBatchId: batchId,
      },
    })
  }

  await tx.auditLog.create({
    data: {
      actionType: 'UPDATE',
      entityType: 'EMPLOYEE',
      entityId: existingDbId,
      detailsJson: { source: 'IMPORT', batchId },
    },
  })

  // Only count as "updated" if this is the first time processing this ID (not a within-file duplicate)
  const isFirstProcess = !alreadyProcessedId
  if (isFirstProcess) processedInFile.set(data.employeeId, existingDbId)
  return { created: false, updated: isFirstProcess }
}

export async function executeImport(
  buffer: Buffer,
  fileName: string,
  _filePath: string,
  fixedRows: ValidImportRow[] = []
): Promise<ExecuteImportResult> {
  const { validRows: parsedValidRows, invalidRows, duplicateIdRows } = await parseImportFile(buffer)
  const allValidRows = [...parsedValidRows, ...fixedRows]

  const rejectedRowCount = Math.max(0, invalidRows.length - fixedRows.length)

  const batch = await prisma.employeeImportBatch.create({
    data: {
      fileName,
      fileType: 'xlsx',
      status: 'PROCESSING',
      importedRowCount: 0,
      createdEmployeeCount: 0,
      updatedEmployeeCount: 0,
      rejectedRowCount: rejectedRowCount,
      duplicateEmployeeIdRowCount: duplicateIdRows.length,
    },
  })

  const today = new Date()
  let createdCount = 0
  let updatedCount = 0
  const processedInFile = new Map<string, string>()

  await prisma.$transaction(async (tx) => {
    // Process first occurrences
    for (const row of allValidRows) {
      const r = await applyRowToDb(tx, row.data, row.action, batch.id, today, processedInFile)
      if (r.created) createdCount++
      if (r.updated) updatedCount++
    }

    // Process duplicates sequentially — last write wins
    for (const dup of duplicateIdRows) {
      await applyRowToDb(tx, dup.data, dup.action, batch.id, today, processedInFile)
    }

    await tx.employeeImportBatch.update({
      where: { id: batch.id },
      data: {
        status: 'COMPLETED',
        importedRowCount: createdCount + updatedCount,
        createdEmployeeCount: createdCount,
        updatedEmployeeCount: updatedCount,
        sourceFileDeletedAt: today,
      },
    })
  }, { timeout: 30000 })



  return {
    batchId: batch.id,
    importedRowCount: createdCount + updatedCount,
    createdEmployeeCount: createdCount,
    updatedEmployeeCount: updatedCount,
    rejectedRowCount,
    duplicateEmployeeIdRowCount: duplicateIdRows.length,
  }
}
