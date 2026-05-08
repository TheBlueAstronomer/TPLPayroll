import type { AttendanceFileErrorCode } from '@/features/attendance-upload/types/attendance.types'

export function validateAttendanceFile(
  fileName: string
): { ok: true } | { ok: false; error: AttendanceFileErrorCode } {
  const lower = fileName.toLowerCase()
  if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
    return { ok: false, error: 'UNSUPPORTED_FILE_TYPE' }
  }
  return { ok: true }
}
