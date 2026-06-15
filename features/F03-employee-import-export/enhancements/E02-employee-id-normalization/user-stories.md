# E02 — Employee ID Normalization: User Stories

> **Status: ✅ IMPLEMENTED**
> **Parent Feature:** F03 — Employee Import / Export

---

## US-E02.1: Automatic legacy ID normalization during Excel import

**As a** Payroll Owner
**I want to** upload employee Excel spreadsheets containing legacy 15-character Employee IDs
**So that** the system automatically normalizes them to 12 characters and maps them to existing employees without throwing validation errors.

### Acceptance Criteria

- AC1: When parsing Excel cells under the "Employee ID" column, any string matching the 15-character structure `^([A-Z]+)(\d{6})$` is automatically converted to the 12-character format (extracting the alphabetic prefix and only the last three digits).
- AC2: Standard 12-character IDs and other non-matching formats are left unmodified.
- AC3: Normalized IDs are matched against the system database; if a match is found, the row is classified as `UPDATE`, otherwise as `CREATE`.
- AC4: The normalized 12-character ID is saved in the database when the import is confirmed.

### Unit Tests

```
TEST: normalizeEmployeeId converts 15-character legacy IDs
  GIVEN employeeId = "TPLGOAHLP002007"
  WHEN normalizeEmployeeId(employeeId) is called
  THEN it returns "TPLGOAHLP007"

TEST: normalizeEmployeeId preserves already shortened 12-character IDs
  GIVEN employeeId = "TPLGOAHLP007"
  WHEN normalizeEmployeeId(employeeId) is called
  THEN it returns "TPLGOAHLP007"

TEST: normalizeEmployeeId preserves standard manual IDs
  GIVEN employeeId = "EMP-001"
  WHEN normalizeEmployeeId(employeeId) is called
  THEN it returns "EMP-001"
```

---

## US-E02.2: Employee ID normalization in Fix Row Form

**As a** Payroll Owner
**I want to** enter a legacy 15-character ID in the Fix Row dialog when resolving a missing/invalid ID
**So that** the system normalizes it upon submitting the fix and successfully saves the row.

### Acceptance Criteria

- AC1: Typing a 15-character legacy ID (e.g. `TPLGOAHLP002007`) in the Employee ID field of the Fix Row form is allowed and accepted.
- AC2: Upon clicking "Apply Fix", the ID is normalized to 12 characters (`TPLGOAHLP007`) before validation and database existence checks are executed.
- AC3: The promoted row is added to the "Valid Rows" list using the normalized 12-character ID.

### Unit Tests

```
TEST: applyRowFix normalizes user-input legacy Employee IDs
  GIVEN an invalid row with a missing Employee ID
  AND the user enters "TPLGOAHLP002007" in the dialog form
  WHEN applyRowFix() is called
  THEN the returned ValidImportRow has employeeId = "TPLGOAHLP007"

TEST: applyRowFix with legacy ID correctly resolves UPDATE vs CREATE
  GIVEN the database contains an employee with ID "TPLGOAHLP007"
  AND the user enters legacy ID "TPLGOAHLP002007" in the dialog form
  WHEN applyRowFix() is called
  THEN the returned ValidImportRow has action = "UPDATE"
```
