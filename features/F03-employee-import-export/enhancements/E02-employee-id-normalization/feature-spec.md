# E02 — Employee ID Normalization

> **Status: ✅ IMPLEMENTED**
> **Parent Feature:** F03 — Employee Import / Export

## Goal

Provide automatic, backward-compatible normalization of Employee IDs during spreadsheet import. This ensures that legacy spreadsheets containing 15-character Employee IDs (e.g. `TPLGOAHLP002007`) are seamlessly parsed, normalized to the new 12-character format (e.g. `TPLGOAHLP007`), and matched against the updated database records without user intervention or validation failures.

## Problem Statement

With the implementation of [E03 — Shortened Employee IDs](file:///d:/Projects/TPLPayroll/TPLPayroll/features/F02-employee-management/enhancements/E03-shortened-employee-ids/feature-spec.md), all employee IDs in the database have been shortened to 12 characters by removing the redundant middle 3 digits. However, existing backup sheets, legacy operational Excel files, or user templates may still contain the 15-character format. If a user attempts to import a spreadsheet containing these old IDs, the parser would fail to match them with existing records, creating duplicate employees or failing database constraints. 

## Scope

### In Scope

- **Automatic parsing normalization**: The Excel parser automatically detects and normalizes 15-character IDs matching `/^([A-Z]+)(\d{6})$/` to 12 characters during parsing.
- **Manual row fix normalization**: The `applyRowFix` utility normalizes IDs input by the user in the "Fix Row" modal.
- **Database matching**: Normalized IDs are used to check for existence in the database (determining whether the action is a `CREATE` or `UPDATE`).
- **Decoupled utility logic**: The normalization logic is isolated in a client-safe utility file (`normalize.ts`) to prevent compilation/Turbopack errors on client components.

### Out of Scope

- Modifying the actual Excel file uploaded by the user (the file itself remains read-only; normalization occurs only in system memory / `sessionStorage` state).
- Auto-correcting other types of mismatched IDs that do not fit the `TPLGOA%` prefix patterns (e.g. invalid non-alphanumeric IDs).

## Affected Files (Implementation Reference)

| File | Change |
|---|---|
| `src/features/employee-import-export/utils/normalize.ts` | **New file** — Houses `normalizeEmployeeId` utility |
| `src/features/employee-import-export/services/import.service.ts` | Uses `normalizeEmployeeId` during Excel sheet parsing |
| `src/features/employee-import-export/utils/row-fix.utils.ts` | Uses `normalizeEmployeeId` when applying manual fixes |
| `src/features/employee-import-export/__tests__/import-service.test.ts` | Tests for normalization boundary conditions and helper functions |

---

## E2E Behavior Tests

### E2E-E02-01: Auto-normalize legacy employee ID during import parse

```
GIVEN the user uploads an Excel file where an employee has ID "TPLGOAHLP002007"
WHEN the Excel parser processes the file
THEN the ID is normalized to "TPLGOAHLP007"
AND the row is shown under "Valid Rows" (or "Duplicates") with ID "TPLGOAHLP007"
```

### E2E-E02-02: Match normalized ID against existing database record

```
GIVEN the database has an employee record with ID "TPLGOAHLP007"
WHEN the user uploads an Excel file with row containing ID "TPLGOAHLP002007"
THEN the parser normalizes the ID to "TPLGOAHLP007"
AND matches it with the database record
AND classifies the row action as "UPDATE" in the preview screen
```

### E2E-E02-03: Normalize manually entered 15-character ID in Fix dialog

```
GIVEN an invalid row with a missing Employee ID is loaded in the Fix Row dialog
WHEN the user manually types "TPLGOAHLP002007" in the Employee ID input field
AND clicks "Apply Fix"
THEN the ID is normalized to "TPLGOAHLP007"
AND the row is successfully promoted to "Valid Rows" with ID "TPLGOAHLP007"
```
