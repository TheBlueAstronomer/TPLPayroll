# Attendance Parsing & Verification

> 14 nodes

## Key Concepts

- **workbook-parser.service.ts** (13 connections) — `src/features/attendance-upload/services/workbook-parser.service.ts`
- **workbook-parser.test.ts** (6 connections) — `src/features/attendance-upload/__tests__/workbook-parser.test.ts`
- **ParsedAttendanceBlock** (6 connections) — `src/features/attendance-upload/types/attendance.types.ts`
- **parseSection()** (4 connections) — `src/features/attendance-upload/services/workbook-parser.service.ts`
- **parseSheet()** (3 connections) — `src/features/attendance-upload/services/workbook-parser.service.ts`
- **excelTimeToHours()** (2 connections) — `src/features/attendance-upload/services/workbook-parser.service.ts`
- **formatExcelTime()** (2 connections) — `src/features/attendance-upload/services/workbook-parser.service.ts`
- **WorkbookParseResult** (2 connections) — `src/features/attendance-upload/services/workbook-parser.service.ts`
- **DailyHours** (2 connections) — `src/features/attendance-upload/types/attendance.types.ts`
- **SECTION_BASES** (1 connections) — `src/features/attendance-upload/__tests__/workbook-parser.test.ts`
- **TimeEntry** (1 connections) — `src/features/attendance-upload/__tests__/workbook-parser.test.ts`
- **SectionSpec** (1 connections) — `src/features/attendance-upload/__tests__/workbook-parser.test.ts`
- **makeSheet()** (1 connections) — `src/features/attendance-upload/__tests__/workbook-parser.test.ts`
- **SECTION_BASES** (1 connections) — `src/features/attendance-upload/services/workbook-parser.service.ts`

## Relationships

- [[getAttendanceUploadPreviewAction Node]] (7 shared connections)
- [[Attendance Upload Session Models]] (4 shared connections)

## Source Files

- `src/features/attendance-upload/__tests__/workbook-parser.test.ts`
- `src/features/attendance-upload/services/workbook-parser.service.ts`
- `src/features/attendance-upload/types/attendance.types.ts`

## Audit Trail

- EXTRACTED: 45 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*