# E01 — Manual Row Fix for Invalid Import Rows

> **Status: ✅ IMPLEMENTED**
> **Parent Feature:** F03 — Employee Import / Export

## Goal

Allow the Payroll Owner to manually supply missing or invalid field values for any rejected row directly in the import preview screen — recovering those rows into the valid set without re-uploading the file.

## Problem Statement

Currently, when a row fails validation (e.g., missing Employee ID, invalid Salary), it is silently skipped during import. The user's only recourse is to fix the source Excel file and re-upload. For a handful of bad rows in an otherwise large file, this is unnecessarily disruptive.

## Scope

- A **Fix** button on every row in the **Invalid Rows** tab of the import preview.
- A **Fix Row dialog** (modal) that surfaces only the fields whose validation failed for that specific row.
- Fields that were already valid in the source row are shown as read-only context so the user knows which employee they are editing.
- Client-side re-validation on submit — the same field rules as the server parser.
- On a successful fix, the row is promoted from `invalidRows` to `validRows` in the client-side preview state (stored in `sessionStorage`).
- Summary strip counts update reactively: Invalid count decreases; Valid / New / Updates count increases.
- Fixed rows are included when the user clicks **Confirm Import**.
- The user can fix multiple rows sequentially before confirming.

## Out of Scope

- Re-uploading or replacing the source Excel file from inside the Fix dialog.
- Bulk-fixing multiple rows in a single dialog interaction.
- Server-side persistence of the fix (fixes live only in `sessionStorage` preview state until confirmed).
- Editing rows that are already valid.

## Affected Files (Implementation Reference)

| File | Change needed |
|---|---|
| `src/features/employee-import-export/types/import-export.types.ts` | Reuse `ValidImportRow` for promoted rows; optionally add a `source: 'fixed'` discriminant |
| `src/features/employee-import-export/components/ImportPreviewClient.tsx` | Add Fix button to `InvalidRowsTable`; wire up state promotion logic; update summary strip |
| `src/features/employee-import-export/components/FixInvalidRowDialog.tsx` | **New component** — modal form with dynamic field rendering and client-side validation |
| `src/features/employee-import-export/utils/row-fix.utils.ts` | **New file** — `applyRowFix(invalidRow, formValues, existingEmployeeIds)` → `ValidImportRow \| ValidationError[]` |

---

## E2E Behavior Tests

### E2E-E01-01: Fix a row with a missing Employee ID

```
GIVEN the import preview shows 1 invalid row with error "Missing Employee ID"
WHEN the user clicks Fix on that row
AND enters a valid Employee ID in the dialog
AND clicks Apply Fix
THEN the Invalid Rows count decreases by 1
AND the Valid Rows count increases by 1
AND the fixed row appears in the Valid Rows tab with action = CREATE
```

### E2E-E01-02: Fix a row with multiple errors

```
GIVEN an invalid row with errors "Missing Name" and "Invalid Salary"
WHEN the user opens the Fix dialog
THEN the dialog shows only the Name and Salary fields (other fields are pre-filled read-only)
WHEN the user enters a valid Name and Salary and submits
THEN the row is promoted to valid
```

### E2E-E01-03: Fix dialog with remaining validation error

```
GIVEN an invalid row with "Invalid Salary"
WHEN the user opens the Fix dialog and enters a non-numeric value for Salary
AND clicks Apply Fix
THEN the dialog shows an inline error "Must be a positive number"
AND the row stays in Invalid Rows
```

### E2E-E01-04: Fix dialog cancel leaves row unchanged

```
GIVEN an invalid row
WHEN the user opens Fix dialog and then clicks Cancel (or presses Escape)
THEN the row remains in Invalid Rows unchanged
AND all counts remain the same
```

### E2E-E01-05: Fixed rows are imported on confirm

```
GIVEN 3 invalid rows, user fixes 2 of them
WHEN the user clicks Confirm Import
THEN the 2 fixed rows are imported along with the original valid rows
AND 1 row is still reported as rejected in the import summary
```

### E2E-E01-06: Fixed row — Employee ID matches existing employee

```
GIVEN an invalid row with missing Employee ID
WHEN the user enters an Employee ID that matches an existing employee in the database
THEN the promoted row shows action = UPDATE (not CREATE)
```
