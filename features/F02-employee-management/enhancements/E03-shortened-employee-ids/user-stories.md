# E03 — Shortened Employee IDs: User Stories

> **Status: ✅ IMPLEMENTED**

---

## US-E03.1: View shortened IDs in Team Directory

**As a** Payroll Owner
**I want to** see clean 12-character employee IDs in the Team Directory
**So that** I can scan the employee list without visual clutter.

### Acceptance Criteria

- AC1: All employee rows in the directory display the 12-character format (e.g. `TPLGOAHLP007`).
- AC2: Search filter matching matches 12-character IDs.
- AC3: Navigation links and profiles display the 12-character ID in headers.

### Unit Tests

```
TEST: employee list displays shortened ID
  GIVEN an employee record with employeeId = "TPLGOAHLP007"
  WHEN the Team Directory renders the list
  THEN the ID cell contains "TPLGOAHLP007"
```

---

## US-E03.2: Create new employee with 12-character ID format

**As a** Payroll Owner
**I want to** manually create an employee using a 12-character ID
**So that** new employee profiles match the new ID standard.

### Acceptance Criteria

- AC1: The Add New Employee form accepts a 12-character ID (e.g. `TPLGOAHLP008`).
- AC2: Entering a duplicate 12-character ID shows a validation error.
- AC3: Submitting saves the ID precisely as entered in the database.

### Unit Tests

```
TEST: CreateEmployeeSchema accepts 12-character ID
  GIVEN input with employeeId = "TPLGOAHLP008"
  WHEN CreateEmployeeSchema.safeParse is called
  THEN the parse succeeds with no errors
```
