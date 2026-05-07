# F04 — Attendance Upload: User Stories

---

## US-04.1: Upload attendance Excel file

**As a** Payroll Owner
**I want to** upload a weekly attendance Excel file
**So that** attendance data is available for payroll calculation.

### Acceptance Criteria

- AC1: Supported formats: `.xls` and `.xlsx`.
- AC2: Unsupported file formats show an error message.
- AC3: After upload, the file is parsed and the import preview is displayed.
- AC4: The upload button shows a loading spinner during parsing.
- AC5: The uploaded file is stored (locally or in GCS) and referenced by `sourceFilePath`.

### Unit Tests

```
TEST: validateAttendanceFile accepts .xls
  GIVEN a file with extension ".xls"
  WHEN validateAttendanceFile() is called
  THEN it returns valid

TEST: validateAttendanceFile accepts .xlsx
  GIVEN a file with extension ".xlsx"
  WHEN validateAttendanceFile() is called
  THEN it returns valid

TEST: validateAttendanceFile rejects .csv
  GIVEN a file with extension ".csv"
  WHEN validateAttendanceFile() is called
  THEN it returns error "UNSUPPORTED_FILE_TYPE"
```

---

## US-04.2: Detect payroll week dates

**As a** Payroll Owner
**I want to** the app to automatically detect the payroll week from the attendance file
**So that** I don't have to manually specify dates for every upload.

### Acceptance Criteria

- AC1: First priority: read week dates from sheet content (header cells).
- AC2: Second priority: infer dates from the file name.
- AC3: Third priority: prompt user for manual date selection.
- AC4: If detected dates are not Thursday–Wednesday, prompt user for confirmation or manual selection.
- AC5: Conflicting dates across sheets prompt manual selection.
- AC6: The detection source is stored as `payrollWeekSource` (SHEET_CONTENT, FILE_NAME, MANUAL).

### Unit Tests

```
TEST: detectPayrollWeek from sheet content
  GIVEN a sheet with cell containing "6 Mar 2025 - 12 Mar 2025"
  WHEN detectPayrollWeek() is called
  THEN it returns { start: "2025-03-06", end: "2025-03-12", source: "SHEET_CONTENT" }

TEST: detectPayrollWeek from filename
  GIVEN no sheet dates detected
  AND filename = "attendance_06Mar_12Mar.xlsx"
  WHEN detectPayrollWeek() is called
  THEN it returns { start: "2025-03-06", end: "2025-03-12", source: "FILE_NAME" }

TEST: detectPayrollWeek returns MANUAL_REQUIRED when no dates found
  GIVEN no sheet dates and no parseable filename dates
  WHEN detectPayrollWeek() is called
  THEN it returns { source: "MANUAL_REQUIRED" }

TEST: detectPayrollWeek flags non-Thursday-to-Wednesday week
  GIVEN detected dates are Monday to Sunday
  WHEN detectPayrollWeek() is called
  THEN it returns the dates with a warning flag "NON_STANDARD_WEEK"
```

---

## US-04.3: Parse multi-sheet, multi-block attendance

**As a** Payroll Owner
**I want to** the parser to handle workbooks with multiple sheets and multiple employee blocks per sheet
**So that** all employee attendance data is captured from any valid file.

### Acceptance Criteria

- AC1: Every sheet in the workbook is iterated.
- AC2: Up to 3 employee blocks per sheet are parsed.
- AC3: Each block extracts: employee identifier/name, regular hours per day, overtime hours per day, site (when available).
- AC4: Blank regular hour cells → 0.
- AC5: Blank overtime hour cells → 0.
- AC6: Each attendance record stores `sourceSheetName` and `sourceEmployeeBlockIndex`.

### Unit Tests

```
TEST: parseAttendanceWorkbook iterates all sheets
  GIVEN a workbook with 4 sheets
  WHEN parseAttendanceWorkbook() is called
  THEN all 4 sheets are processed

TEST: parseAttendanceWorkbook parses up to 3 blocks per sheet
  GIVEN a sheet with 3 employee blocks
  WHEN the sheet is parsed
  THEN 3 attendance record sets are returned

TEST: parseAttendanceBlock treats blank regular hours as 0
  GIVEN a block where Monday regularHours cell is blank
  WHEN parseAttendanceBlock() is called
  THEN Monday regularHours = 0

TEST: parseAttendanceBlock treats blank overtime hours as 0
  GIVEN a block where Tuesday overtimeHours cell is blank
  WHEN parseAttendanceBlock() is called
  THEN Tuesday overtimeHours = 0

TEST: parseAttendanceBlock extracts employee name and site
  GIVEN a block with employee name "Ravi Kumar" and site "North"
  WHEN parseAttendanceBlock() is called
  THEN it returns { employeeName: "Ravi Kumar", site: "North" }
```

---

## US-04.4: Match attendance to employee master

**As a** Payroll Owner
**I want to** the app to match uploaded attendance records to the employee master database
**So that** payroll is calculated for the correct employees.

### Acceptance Criteria

- AC1: Matching is attempted by employee name or employee identifier.
- AC2: Matched employees show a green "Matched" indicator.
- AC3: Unmatched employees show a red "Unmatched" error and block payroll.
- AC4: Matched inactive employees show a warning "Inactive — blocks payroll".
- AC5: Matched employees resigned before the payroll week show a warning "Resigned before payroll week — blocks payroll".

### Unit Tests

```
TEST: matchEmployees matches by exact name
  GIVEN master has "Ravi Kumar" and attendance has "Ravi Kumar"
  WHEN matchEmployees() is called
  THEN the record is matched with status "MATCHED"

TEST: matchEmployees flags unmatched employees
  GIVEN master does not have "Unknown Person"
  AND attendance has "Unknown Person"
  WHEN matchEmployees() is called
  THEN the record has status "UNMATCHED" and isBlocking = true

TEST: matchEmployees flags inactive employees
  GIVEN master has "Ravi Kumar" with isActive = false
  WHEN matchEmployees() is called
  THEN the record has status "INACTIVE" and isBlocking = true

TEST: matchEmployees flags resigned-before-week employees
  GIVEN "Ravi Kumar" has dateOfResignation = "2025-03-01"
  AND payroll week starts "2025-03-06"
  WHEN matchEmployees() is called
  THEN the record has status "RESIGNED_BEFORE_WEEK" and isBlocking = true

TEST: matchEmployees allows employee resigned during or after week
  GIVEN "Ravi Kumar" has dateOfResignation = "2025-03-10"
  AND payroll week starts "2025-03-06"
  WHEN matchEmployees() is called
  THEN the record has status "MATCHED" and isBlocking = false
```

---

## US-04.5: View attendance import preview

**As a** Payroll Owner
**I want to** see a detailed preview of the attendance import results
**So that** I can identify and resolve issues before payroll generation.

### Acceptance Criteria

- AC1: The preview shows: payroll week dates, total employees found, matched count, unmatched count, inactive count, resigned count, error count.
- AC2: Each employee row shows: name, matching status, regular hours total, overtime hours total, blocking/non-blocking indicator.
- AC3: Blocking issues are highlighted in red.
- AC4: A summary banner shows whether payroll is blocked or unblocked for this week.
- AC5: Errors are shown on-screen only (not exported or emailed).

### Unit Tests

```
TEST: computeImportSummary returns correct counts
  GIVEN 15 matched, 2 unmatched, 1 inactive, 1 resigned-before-week
  WHEN computeImportSummary() is called
  THEN it returns { matched: 15, unmatched: 2, inactive: 1, resignedBeforeWeek: 1, isBlocked: true }

TEST: computeImportSummary unblocked when all matched
  GIVEN 15 matched, 0 unmatched, 0 inactive, 0 resigned
  WHEN computeImportSummary() is called
  THEN isBlocked = false
```

---

## US-04.6: Replace attendance upload for same week

**As a** Payroll Owner
**I want to** upload a corrected attendance file for a week that already has one
**So that** I can fix attendance errors without creating duplicate records.

### Acceptance Criteria

- AC1: If an active attendance upload already exists for the selected payroll week, show a confirmation dialog.
- AC2: On confirmation, the previous file is permanently deleted immediately.
- AC3: The previous AttendanceUpload record's `isActiveForPayrollWeek` is set to false.
- AC4: The new upload becomes the active attendance source for that week.
- AC5: Previous AttendanceRecord entries are retained for audit but the new records are used for payroll.

### Unit Tests

```
TEST: replaceAttendanceUpload deletes previous file
  GIVEN an active upload exists for week March 6-12 with sourceFilePath = "/tmp/old.xlsx"
  WHEN replaceAttendanceUpload() is called with a new file
  THEN the file at "/tmp/old.xlsx" is deleted

TEST: replaceAttendanceUpload deactivates previous upload record
  GIVEN an active upload exists for week March 6-12
  WHEN replaceAttendanceUpload() is called
  THEN the previous upload's isActiveForPayrollWeek = false

TEST: replaceAttendanceUpload sets new upload as active
  WHEN replaceAttendanceUpload() is called with a new file
  THEN the new AttendanceUpload record has isActiveForPayrollWeek = true
```
