import type {
  MatchedAttendanceRecord,
  ImportSummary,
} from '@/features/attendance-upload/types/attendance.types'

export function computeImportSummary(records: MatchedAttendanceRecord[]): ImportSummary {
  let matched = 0
  let unmatched = 0
  let inactive = 0
  let resignedBeforeWeek = 0
  let rejectedUnmatched = 0
  let errors = 0
  let isBlocked = false

  for (const record of records) {
    if (record.parseErrors.length > 0) {
      errors++
      isBlocked = true
    }
    if (record.isBlocking) isBlocked = true

    switch (record.matchStatus) {
      case 'MATCHED':
      case 'MANUALLY_MATCHED':
        matched++
        break
      case 'UNMATCHED':
        unmatched++
        break
      case 'INACTIVE':
        inactive++
        break
      case 'RESIGNED_BEFORE_WEEK':
        resignedBeforeWeek++
        break
      case 'REJECTED_UNMATCHED':
        rejectedUnmatched++
        break
    }
  }

  const needsVerification = inactive + resignedBeforeWeek

  return {
    total: records.length,
    matched,
    unmatched,
    inactive,
    resignedBeforeWeek,
    rejectedUnmatched,
    needsVerification,
    errors,
    isBlocked,
  }
}
