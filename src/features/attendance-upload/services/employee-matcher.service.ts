import type { Employee } from '@prisma/client'
import type {
  ParsedAttendanceBlock,
  MatchedAttendanceRecord,
  MatchStatus,
} from '@/features/attendance-upload/types/attendance.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Extract the trailing integer from an Employee ID string.
// e.g. "EMP-001" → 1,  "GUARD-25" → 25,  "ABC" → null
function trailingNumber(employeeId: string): number | null {
  const m = employeeId.match(/(\d+)$/)
  if (!m) return null
  // Only take the last 3 digits of the employeeID sequence
  const lastThree = m[1].slice(-3)
  return parseInt(lastThree, 10)
}

// ─── matchEmployees ───────────────────────────────────────────────────────────

export function matchEmployees(
  blocks: ParsedAttendanceBlock[],
  employees: Employee[],
  payrollWeekStartDate: Date,
  payrollWeekEndDate: Date
): MatchedAttendanceRecord[] {
  // Primary index: trailing number of Employee ID → employee
  const employeeByUserId = new Map<number, Employee>()
  // Fallback index: lowercase name → employee
  const employeeByName   = new Map<string, Employee>()

  for (const e of employees) {
    const numId = trailingNumber(e.employeeId)
    if (numId !== null) employeeByUserId.set(numId, e)
    employeeByName.set(e.employeeName.toLowerCase().trim(), e)
  }

  return blocks.map((block) => {
    let employee: Employee | undefined

    // 1. Match by User ID from sheet against trailing number of Employee ID
    if (block.userIdFromSheet !== undefined) {
      employee = employeeByUserId.get(block.userIdFromSheet)
    }

    // 2. Fall back to case-insensitive name match
    if (!employee) {
      employee = employeeByName.get(block.employeeName.toLowerCase().trim())
    }

    // 3. No match found
    if (!employee) {
      return { ...block, matchStatus: 'UNMATCHED' as MatchStatus, isBlocking: true, employeeDbId: null }
    }

    // Inactive employee — requires manual verification
    if (!employee.isActive) {
      return { ...block, matchStatus: 'INACTIVE' as MatchStatus, isBlocking: false, employeeDbId: employee.id }
    }

    // Resigned before payroll week starts — requires manual verification
    if (
      employee.dateOfResignation &&
      employee.dateOfResignation < payrollWeekStartDate
    ) {
      return {
        ...block,
        matchStatus: 'RESIGNED_BEFORE_WEEK' as MatchStatus,
        isBlocking: false,
        employeeDbId: employee.id,
      }
    }

    // Resigned during or after payroll week — process normally
    return { ...block, matchStatus: 'MATCHED' as MatchStatus, isBlocking: false, employeeDbId: employee.id }
  })
}