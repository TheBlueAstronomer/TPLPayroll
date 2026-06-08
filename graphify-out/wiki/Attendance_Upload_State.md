# Attendance Upload State

> 25 nodes

## Key Concepts

- **prisma.ts** (36 connections) — `src/lib/prisma.ts`
- **upload-session.service.ts** (14 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **attendance-upload-session.service.ts** (11 connections) — `src/features/attendance-upload/services/attendance-upload-session.service.ts`
- **loadUploadSession()** (8 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **upload-session.service.test.ts** (7 connections) — `src/features/attendance-upload/services/upload-session.service.test.ts`
- **SessionDecisions** (7 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **createUploadSession()** (7 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **attendance-upload-session.test.ts** (5 connections) — `src/features/attendance-upload/__tests__/attendance-upload-session.test.ts`
- **LoadedUploadSession** (3 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **pruneExpiredSessions()** (3 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **loadService()** (2 connections) — `src/features/attendance-upload/__tests__/attendance-upload-session.test.ts`
- **CreateAttendanceUploadSessionInput** (2 connections) — `src/features/attendance-upload/services/attendance-upload-session.service.ts`
- **createAttendanceUploadSession()** (2 connections) — `src/features/attendance-upload/services/attendance-upload-session.service.ts`
- **loadAttendanceUploadSession()** (2 connections) — `src/features/attendance-upload/services/attendance-upload-session.service.ts`
- **ResumedSessionState** (2 connections) — `src/features/attendance-upload/services/attendance-upload-session.service.ts`
- **resumeAttendanceUploadSession()** (2 connections) — `src/features/attendance-upload/services/attendance-upload-session.service.ts`
- **CreateUploadSessionParams** (2 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **expireUploadSession()** (2 connections) — `src/features/attendance-upload/services/upload-session.service.ts`
- **AttendanceUploadSessionRow** (1 connections) — `src/features/attendance-upload/__tests__/attendance-upload-session.test.ts`
- **CreateSessionInput** (1 connections) — `src/features/attendance-upload/__tests__/attendance-upload-session.test.ts`
- **makeCreateInput()** (1 connections) — `src/features/attendance-upload/__tests__/attendance-upload-session.test.ts`
- **upload.service.test.ts** (1 connections) — `src/features/attendance-upload/services/upload.service.test.ts`
- **pool** (1 connections) — `src/lib/prisma.ts`
- **adapter** (1 connections) — `src/lib/prisma.ts`
- **prismaClientSingleton()** (1 connections) — `src/lib/prisma.ts`

## Relationships

- [[Attendance Upload Session Models]] (7 shared connections)
- [[GET Node]] (6 shared connections)
- [[getAttendanceUploadPreviewAction Node]] (5 shared connections)
- [[Payroll Correction & Revisions]] (4 shared connections)
- [[AttendanceUploadRow Node]] (2 shared connections)
- [[approveAdjustmentApplication Node]] (2 shared connections)
- [[calculateNetPayable Node]] (2 shared connections)
- [[PayrollHistoryFilter Node]] (2 shared connections)
- [[markReportFilesCleanedAction Node]] (2 shared connections)
- [[getSettingsAction Node]] (2 shared connections)
- [[getAttendanceUploadSessionAction Node]] (1 shared connections)
- [[cleanupDatabase Node]] (1 shared connections)

## Source Files

- `src/features/attendance-upload/__tests__/attendance-upload-session.test.ts`
- `src/features/attendance-upload/services/attendance-upload-session.service.ts`
- `src/features/attendance-upload/services/upload-session.service.test.ts`
- `src/features/attendance-upload/services/upload-session.service.ts`
- `src/features/attendance-upload/services/upload.service.test.ts`
- `src/lib/prisma.ts`

## Audit Trail

- EXTRACTED: 124 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*