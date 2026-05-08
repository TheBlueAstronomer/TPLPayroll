import * as XLSX from 'xlsx'
import prisma from '@/lib/prisma'
import { IMPORT_COLUMNS, IMPORT_SHEET_NAME } from '@/features/employee-import-export/types/import-export.types'

function formatDate(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function generateExportWorkbook(): Promise<XLSX.WorkBook> {
  const employees = await prisma.employee.findMany({
    orderBy: { employeeName: 'asc' },
  })

  // Fetch latest wage history per employee in one query
  const wageHistories = await prisma.employeeWageHistory.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      effectiveTo: null,
    },
    orderBy: { effectiveFrom: 'desc' },
  })

  const wageMap = new Map<string, { weeklySalary: number; hourlyRate: number }>()
  for (const wh of wageHistories) {
    if (!wageMap.has(wh.employeeId)) {
      wageMap.set(wh.employeeId, {
        weeklySalary: Number(wh.weeklySalary),
        hourlyRate: Number(wh.hourlyRate),
      })
    }
  }

  const rows = employees.map((emp, idx) => {
    const wage = wageMap.get(emp.id)
    // Column order matching the sample file structure
    return {
      [IMPORT_COLUMNS.serialNumber]: idx + 1,
      [IMPORT_COLUMNS.employeeId]: emp.employeeId,
      [IMPORT_COLUMNS.employeeName]: emp.employeeName,
      [IMPORT_COLUMNS.nationalId]: emp.nationalId ?? '',
      [IMPORT_COLUMNS.designation]: emp.designation,
      [IMPORT_COLUMNS.dateOfJoining]: formatDate(emp.dateOfJoining),
      [IMPORT_COLUMNS.policeVerificationId]: emp.policeVerificationId ?? '',
      [IMPORT_COLUMNS.salary]: wage?.weeklySalary ?? '',
      [IMPORT_COLUMNS.hourlyRate]: wage?.hourlyRate ?? '',
      [IMPORT_COLUMNS.phone]: emp.phone ?? '',
      [IMPORT_COLUMNS.dateOfBirth]: formatDate(emp.dateOfBirth),
      [IMPORT_COLUMNS.gPay]: emp.gPay ?? '',
      [IMPORT_COLUMNS.site]: emp.site ?? '',
      [IMPORT_COLUMNS.active]: emp.isActive ? 'Active' : 'Inactive',
      [IMPORT_COLUMNS.designationShort]: emp.designationShort ?? '',
    }
  })

  // Column order matching the sample file
  const columnOrder = [
    IMPORT_COLUMNS.serialNumber,
    IMPORT_COLUMNS.employeeId,
    IMPORT_COLUMNS.employeeName,
    IMPORT_COLUMNS.nationalId,
    IMPORT_COLUMNS.designation,
    IMPORT_COLUMNS.dateOfJoining,
    IMPORT_COLUMNS.policeVerificationId,
    IMPORT_COLUMNS.salary,
    IMPORT_COLUMNS.hourlyRate,
    IMPORT_COLUMNS.phone,
    IMPORT_COLUMNS.dateOfBirth,
    IMPORT_COLUMNS.gPay,
    IMPORT_COLUMNS.site,
    IMPORT_COLUMNS.active,
    IMPORT_COLUMNS.designationShort,
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows, { header: columnOrder })
  XLSX.utils.book_append_sheet(wb, ws, IMPORT_SHEET_NAME)

  return wb
}
