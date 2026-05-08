import { describe, it, expect } from 'vitest'
import { validateAttendanceFile } from '@/features/attendance-upload/services/file-validator.service'

describe('validateAttendanceFile', () => {
  it('accepts .xls files', () => {
    const result = validateAttendanceFile('attendance_week9.xls')
    expect(result).toEqual({ ok: true })
  })

  it('accepts .xlsx files', () => {
    const result = validateAttendanceFile('attendance_week9.xlsx')
    expect(result).toEqual({ ok: true })
  })

  it('rejects .csv files with UNSUPPORTED_FILE_TYPE', () => {
    const result = validateAttendanceFile('attendance.csv')
    expect(result).toEqual({ ok: false, error: 'UNSUPPORTED_FILE_TYPE' })
  })

  it('rejects .pdf files with UNSUPPORTED_FILE_TYPE', () => {
    const result = validateAttendanceFile('attendance.pdf')
    expect(result).toEqual({ ok: false, error: 'UNSUPPORTED_FILE_TYPE' })
  })

  it('rejects files with no extension', () => {
    const result = validateAttendanceFile('attendance')
    expect(result).toEqual({ ok: false, error: 'UNSUPPORTED_FILE_TYPE' })
  })

  it('is case-insensitive for extension', () => {
    expect(validateAttendanceFile('attendance.XLS')).toEqual({ ok: true })
    expect(validateAttendanceFile('attendance.XLSX')).toEqual({ ok: true })
  })
})
