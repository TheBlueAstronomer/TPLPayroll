# F04 — Attendance Upload

## Goal

Allow the Payroll Owner to upload weekly attendance Excel files, parse multi-sheet/multi-block employee attendance data, match employees to the master database, and surface all blocking errors on-screen before allowing payroll generation.

## Scope

- Upload `.xls` or `.xlsx` attendance files.
- Parse workbooks with multiple sheets, each containing up to 3 employee blocks.
- Detect payroll week dates from sheet content, file name, or manual user selection.
- Match attendance records to employees in the master database.
- Display an import preview showing matched, unmatched, inactive, resigned, valid, and invalid records.
- Block payroll generation until all blocking issues are resolved.
- Support replacing an existing attendance upload for the same payroll week (with immediate deletion of the previous file).
- Treat blank regular hour and overtime hour cells as 0.

## PRD References

- Section 5.1: Attendance Report Upload
- Section 9.5: Upload Weekly Attendance (workflow)
- Section 9.6: Replace Attendance Upload for Same Week (workflow)
- Section 16.1: Attendance Upload Blocking Rules

---

## E2E Behavior Tests

### E2E-01: Successful attendance upload with all employees matched

```
GIVEN the employee master has 15 employees
AND the uploaded attendance file contains data for 15 known employees with valid hours
WHEN the user uploads the file
THEN the payroll week is detected
AND the import preview shows 15 matched employees with 0 errors
AND payroll generation is unblocked for this week
```

### E2E-02: Attendance upload with unmatched employees

```
GIVEN the employee master has 15 employees
AND the uploaded file contains data for 17 employees (2 are not in the master database)
WHEN the user uploads the file
THEN the import preview shows 15 matched and 2 unmatched employees
AND the 2 unmatched employees are flagged as blocking errors
AND payroll generation is blocked for this week
```

### E2E-03: Attendance upload includes inactive employee

```
GIVEN employee "EMP-005" is inactive (isActive = false)
AND the uploaded file contains attendance for "EMP-005"
WHEN the user uploads the file
THEN "EMP-005" is flagged as "Inactive employee — blocks payroll"
AND payroll generation is blocked
```

### E2E-04: Attendance upload includes employee resigned before payroll week

```
GIVEN employee "EMP-008" has dateOfResignation = "2025-03-01"
AND the payroll week is March 6–12, 2025
WHEN the user uploads the file containing "EMP-008"
THEN "EMP-008" is flagged as "Resigned before payroll week — blocks payroll"
AND payroll generation is blocked
```

### E2E-05: Blank hours are treated as 0

```
GIVEN an attendance row for "EMP-001" has blank regular hours on Monday and blank overtime on Tuesday
WHEN the file is parsed
THEN Monday regularHours = 0 and Tuesday overtimeHours = 0
AND no blocking error is raised for blank cells
```

### E2E-06: Multi-sheet workbook is fully parsed

```
GIVEN a workbook with 4 sheets, each containing 3 employee blocks
WHEN the file is uploaded
THEN 12 employee attendance blocks are parsed
AND each employee is matched or flagged appropriately
```

### E2E-07: Payroll week detected from sheet content

```
GIVEN the attendance sheet contains dates "6 Mar 2025" to "12 Mar 2025" in a header cell
WHEN the file is uploaded
THEN payrollWeekStartDate = 2025-03-06, payrollWeekEndDate = 2025-03-12
AND payrollWeekSource = "SHEET_CONTENT"
```

### E2E-08: Payroll week requires manual selection

```
GIVEN the attendance sheet has no detectable dates and the filename has no recognizable dates
WHEN the file is uploaded
THEN the app prompts the user to manually select the payroll week start and end dates
```

### E2E-09: Replace existing attendance upload for the same week

```
GIVEN an attendance upload already exists for the week of March 6–12
WHEN the user uploads a new file for the same week
THEN the app shows a confirmation: "An attendance file already exists for this week. Replace?"
WHEN the user confirms
THEN the previous file is permanently deleted
AND the new upload becomes the active upload for that week
AND the previous upload's isActiveForPayrollWeek is set to false
```

### E2E-10: Invalid hour values are flagged

```
GIVEN an attendance row has regularHours = "abc" (non-numeric)
WHEN the file is parsed
THEN the row is flagged with error "Invalid regular hours value"
AND payroll generation is blocked
```
