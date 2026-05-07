# F03 — Employee Import / Export: User Stories

---

## US-03.1: Upload employee master Excel file

**As a** Payroll Owner
**I want to** upload an `.xlsx` file containing employee master data
**So that** I can bulk-load or update employees in the system.

### Acceptance Criteria

- AC1: Only `.xlsx` files are accepted; other formats show "Unsupported file type".
- AC2: The file must contain a sheet named "Employee Master List"; else show "Sheet not found".
- AC3: After upload, the file is parsed and the import preview screen is shown.
- AC4: The upload button shows a loading spinner during file parsing.

### Unit Tests

```
TEST: validateImportFile rejects non-xlsx files
  GIVEN a file with extension ".csv"
  WHEN validateImportFile() is called
  THEN it returns error "UNSUPPORTED_FILE_TYPE"

TEST: validateImportFile rejects xlsx without correct sheet
  GIVEN an xlsx file with sheets ["Sheet1", "Data"]
  WHEN validateImportFile() is called
  THEN it returns error "SHEET_NOT_FOUND"

TEST: validateImportFile accepts valid xlsx with correct sheet
  GIVEN an xlsx file with sheet "Employee Master List"
  WHEN validateImportFile() is called
  THEN it returns success
```

---

## US-03.2: Preview import results before confirmation

**As a** Payroll Owner
**I want to** see a preview of what will be imported — valid rows, invalid rows, duplicates, and updates
**So that** I can review potential issues before committing the import.

### Acceptance Criteria

- AC1: The preview shows a summary: total rows, valid rows, invalid rows, duplicate Employee ID rows, new employees, updated employees.
- AC2: Invalid rows show specific error messages (e.g., "Missing Employee Name", "Invalid Salary value").
- AC3: Duplicate Employee ID rows within the file show a warning but are not blocked.
- AC4: Rows updating existing employees show a "Will Update" indicator.
- AC5: The user can confirm or cancel from the preview screen.

### Unit Tests

```
TEST: parseImportFile categorizes rows correctly
  GIVEN an xlsx with 10 valid rows, 3 rows missing Employee ID, 2 rows with duplicate IDs
  WHEN parseImportFile() is called
  THEN it returns validRows = 10, invalidRows = 3, duplicateIdRows = 2

TEST: parseImportFile returns error details per invalid row
  GIVEN a row with missing Employee Name and invalid Salary
  WHEN parseImportFile() processes that row
  THEN the row's errors array contains "MISSING_EMPLOYEE_NAME" and "INVALID_SALARY"

TEST: parseImportFile detects existing employees for update
  GIVEN employee "EMP-001" exists in the database
  AND the xlsx contains a row for "EMP-001"
  WHEN parseImportFile() is called
  THEN that row is marked as action = "UPDATE"
```

---

## US-03.3: Confirm and execute employee import

**As a** Payroll Owner
**I want to** confirm the import to save valid employees to the database
**So that** the employee master is updated with the imported data.

### Acceptance Criteria

- AC1: Only valid rows are imported; invalid rows are skipped.
- AC2: New employees are created.
- AC3: Existing employees (matched by Employee ID) are updated.
- AC4: If Salary or Hourly Rate changes for an existing employee, a wage history entry is created with effectiveFrom = import date.
- AC5: Duplicate Employee ID rows within the file are processed sequentially.
- AC6: An `EmployeeImportBatch` record is created with counts (imported, created, updated, rejected, duplicate).
- AC7: Audit logs are created for each created and updated employee.
- AC8: The uploaded file is permanently deleted after successful import, and `sourceFileDeletedAt` is set.

### Unit Tests

```
TEST: executeImport creates new employees
  GIVEN 5 valid rows with new Employee IDs
  WHEN executeImport() is called
  THEN 5 new employees are created in the database

TEST: executeImport updates existing employees
  GIVEN employee "EMP-001" exists with phone = "111"
  AND a valid row for "EMP-001" has phone = "222"
  WHEN executeImport() is called
  THEN employee "EMP-001" phone is updated to "222"

TEST: executeImport creates wage history on wage change
  GIVEN employee "EMP-001" exists with hourlyRate = 60.00
  AND a valid row for "EMP-001" has hourlyRate = 70.00
  WHEN executeImport() is called
  THEN a new wage history entry is created with hourlyRate = 70.00
  AND the previous entry has effectiveTo = today

TEST: executeImport skips invalid rows
  GIVEN 10 valid rows and 3 invalid rows
  WHEN executeImport() is called
  THEN only 10 employees are created/updated
  AND the batch record shows rejectedRowCount = 3

TEST: executeImport handles duplicate IDs in file
  GIVEN two rows for "EMP-010" — row A (phone=111) then row B (phone=222)
  WHEN executeImport() is called
  THEN employee "EMP-010" ends up with phone = "222"
  AND the batch record shows duplicateEmployeeIdRowCount = 1

TEST: executeImport deletes source file
  GIVEN a valid import
  WHEN executeImport() completes
  THEN the uploaded file no longer exists on disk/storage
  AND the batch record has sourceFileDeletedAt set

TEST: executeImport creates import batch record
  GIVEN a valid import of 10 rows
  WHEN executeImport() completes
  THEN an EmployeeImportBatch record exists with correct counts
```

---

## US-03.4: Map Active column values

**As a** Payroll Owner
**I want to** the import to correctly interpret "Active" and "Inactive" text values from the Excel column
**So that** employee status is set correctly during import.

### Acceptance Criteria

- AC1: "Active" (case-insensitive) maps to `isActive = true`.
- AC2: "Inactive" (case-insensitive) maps to `isActive = false`.
- AC3: Other values (blank, invalid text) cause the row to be marked invalid.

### Unit Tests

```
TEST: mapActiveValue maps "Active" to true
  WHEN mapActiveValue("Active") is called
  THEN it returns true

TEST: mapActiveValue maps "inactive" (lowercase) to false
  WHEN mapActiveValue("inactive") is called
  THEN it returns false

TEST: mapActiveValue rejects blank value
  WHEN mapActiveValue("") is called
  THEN it returns an error "INVALID_ACTIVE_VALUE"
```

---

## US-03.5: Export employee master to Excel

**As a** Payroll Owner
**I want to** download the current employee database as an `.xlsx` file
**So that** I have a portable backup or can share the data.

### Acceptance Criteria

- AC1: The export includes ALL employees — active, inactive, and resigned.
- AC2: The exported file uses the column structure from PRD Section 5.2.
- AC3: The sheet is named "Employee Master List".
- AC4: Date fields are formatted as readable dates (e.g., "01 Mar 2025").
- AC5: The file downloads immediately to the user's browser.

### Unit Tests

```
TEST: generateExportWorkbook includes all employees
  GIVEN 20 active, 3 inactive, 2 resigned employees
  WHEN generateExportWorkbook() is called
  THEN the workbook contains 25 data rows

TEST: generateExportWorkbook uses correct column headers
  WHEN generateExportWorkbook() is called
  THEN the header row contains all columns from PRD Section 5.2 in order

TEST: generateExportWorkbook formats dates correctly
  GIVEN an employee with dateOfJoining = "2023-03-01"
  WHEN generateExportWorkbook() is called
  THEN the cell value is a readable date format
```
