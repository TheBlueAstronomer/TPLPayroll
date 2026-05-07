# F03 — Employee Import / Export

## Goal

Allow the Payroll Owner to bulk-import employee master data from an Excel file (`.xlsx`) and export the current employee database to Excel, enabling fast initial setup and ongoing data portability.

## Scope

- Import employee data from an `.xlsx` file with the `Employee Master List` sheet.
- Partial import: valid rows are imported, invalid rows are skipped and reported.
- Upsert behavior: existing employees are updated by Employee ID, new employees are created.
- Automatic wage history creation when Salary or Hourly Rate changes during import.
- Import preview screen showing valid, invalid, duplicate, and warning rows before confirmation.
- Source file deletion immediately after successful import.
- Export all employees (active, inactive, resigned) to `.xlsx` using the supported column structure.

## PRD References

- Section 5.2: Employee Master Import
- Section 6: Employee Master Data (export)
- Section 9.3: Import Employee Master from Excel (workflow)
- Section 9.4: Export Employee Master to Excel (workflow)
- Section 16.2: Employee Import Validation Rules

---

## E2E Behavior Tests

### E2E-01: Successful full import

```
GIVEN the user uploads a valid "Employee Master List.xlsx" containing 20 rows with all required fields
WHEN the user confirms the import
THEN 20 employees are created in the database
AND the import summary shows: 20 imported, 0 rejected, 0 duplicates
AND the uploaded file is permanently deleted
```

### E2E-02: Partial import with invalid rows

```
GIVEN the user uploads an Excel file with 15 valid rows and 5 rows missing required fields (e.g., Employee ID, Salary)
WHEN the import preview is shown
THEN the preview shows 15 valid rows and 5 invalid rows with specific error messages per row
WHEN the user confirms the import
THEN 15 employees are imported
AND the 5 invalid rows are skipped
AND the import summary shows: 15 imported, 5 rejected
```

### E2E-03: Import updates existing employees

```
GIVEN employee "EMP-001" already exists with Hourly Rate = 60.00
AND the uploaded file contains a row for "EMP-001" with Hourly Rate = 70.00
WHEN the user confirms the import
THEN employee "EMP-001" is updated with Hourly Rate = 70.00
AND a wage history entry is created with the new rate
AND the import summary shows 1 updated employee
```

### E2E-04: Duplicate Employee ID rows in the same file

```
GIVEN the uploaded file contains two rows with Employee ID = "EMP-010"
WHEN the import preview is shown
THEN a warning is displayed about the duplicate
WHEN the user confirms the import
THEN both rows are processed sequentially — the second row's data becomes the final state
AND the import summary shows 1 duplicate Employee ID row
```

### E2E-05: Import with wrong sheet name is rejected

```
GIVEN the user uploads an Excel file without a sheet named "Employee Master List"
WHEN the file is parsed
THEN the app shows an error: "Sheet 'Employee Master List' not found"
AND no import preview is shown
```

### E2E-06: Export employee master

```
GIVEN 25 employees exist (20 active, 3 inactive, 2 resigned)
WHEN the user clicks "Export to Excel"
THEN an .xlsx file is downloaded containing all 25 employees
AND the file uses the column structure from PRD Section 5.2
AND the sheet is named "Employee Master List"
```

### E2E-07: Source file is deleted after successful import

```
GIVEN the user uploads and confirms an import
WHEN the import completes successfully
THEN the uploaded file is permanently deleted from the server/storage
AND the import batch record has sourceFileDeletedAt set
```
