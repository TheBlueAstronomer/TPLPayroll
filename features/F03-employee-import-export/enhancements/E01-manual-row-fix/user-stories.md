# E01 — Manual Row Fix: User Stories

> **Status: 🔲 PLANNED**
> **Parent Feature:** F03 — Employee Import / Export

---

## US-E01.1: Fix invalid rows during import preview

**As a** Payroll Owner
**I want to** manually enter missing or corrected field values for invalid rows during the import preview
**So that** I can rescue those rows without having to re-upload the entire Excel file.

### Acceptance Criteria

- AC1: Every row in the **Invalid Rows** tab displays a **Fix** button on the right side of the row.
- AC2: Clicking Fix opens the **Fix Row dialog**, showing only the fields whose validation failed for that specific row (derived from the `errors: ImportRowErrorCode[]` array).
- AC3: Fields that were already present and valid in the source row are shown as read-only context chips above the editable form, so the user knows which employee they are editing.
- AC4: The dialog form validates on submit using the same rules as the server-side parser (required fields, numeric salary/rate, valid Active value).
- AC5: If validation fails inside the dialog, inline field-level errors are shown and the dialog stays open.
- AC6: On a successful fix, the dialog closes, the row is removed from Invalid Rows, and it appears in Valid Rows with a "Fixed" badge.
- AC7: The summary strip (Total / Valid / Invalid / New / Updates) updates immediately to reflect the fix without a page reload.
- AC8: If the entered Employee ID matches an existing employee in the database, the promoted row is marked action = **UPDATE**; otherwise action = **CREATE**.
- AC9: Closing the dialog (Cancel or Escape) leaves the row unchanged.
- AC10: The user can fix multiple rows one at a time before confirming the import.
- AC11: All fixed rows are included in the final import when Confirm Import is clicked.

### Unit Tests

```
TEST: applyRowFix with complete valid values promotes row
  GIVEN an invalidRow with errors ["MISSING_EMPLOYEE_ID"]
  AND the user supplies a valid employeeId
  WHEN applyRowFix(invalidRow, { employeeId: "EMP-099" }, existingIds) is called
  THEN it returns a ValidImportRow with action = "CREATE"

TEST: applyRowFix with existing employee ID sets action = UPDATE
  GIVEN existingIds contains "EMP-001"
  AND the user supplies employeeId = "EMP-001"
  WHEN applyRowFix() is called
  THEN the returned ValidImportRow has action = "UPDATE"

TEST: applyRowFix with still-invalid salary returns validation errors
  GIVEN an invalidRow with errors ["INVALID_SALARY"]
  AND the user supplies salary = "not-a-number"
  WHEN applyRowFix() is called
  THEN it returns ValidationError[] containing "INVALID_SALARY"
  AND no ValidImportRow is returned

TEST: applyRowFix with missing required field returns validation error
  GIVEN an invalidRow with errors ["MISSING_EMPLOYEE_NAME"]
  AND the user submits an empty name
  WHEN applyRowFix() is called
  THEN it returns ValidationError[] containing "MISSING_EMPLOYEE_NAME"

TEST: FixInvalidRowDialog renders only missing fields
  GIVEN an invalidRow with errors ["MISSING_EMPLOYEE_ID", "INVALID_SALARY"]
  WHEN FixInvalidRowDialog renders
  THEN the form contains an Employee ID input and a Salary input
  AND no other required-field inputs are rendered

TEST: FixInvalidRowDialog pre-fills read-only context for valid fields
  GIVEN an invalidRow with employeeName = "Juan dela Cruz" and errors ["MISSING_EMPLOYEE_ID"]
  WHEN FixInvalidRowDialog renders
  THEN "Juan dela Cruz" appears as a read-only context chip

TEST: ImportPreviewClient updates counts after fix
  GIVEN parseResult has invalidRows = 3, validRows = 10
  WHEN one invalid row is successfully fixed
  THEN the summary strip shows invalidRows = 2, validRows = 11

TEST: ImportPreviewClient passes fixed rows to executeImportAction
  GIVEN 10 original valid rows and 2 fixed rows
  WHEN Confirm Import is clicked
  THEN executeImportAction is called with 12 rows (10 + 2 fixed)
```
