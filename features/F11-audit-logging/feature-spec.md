# F11 — Audit Logging

> **Status: ✅ DONE**

## Goal

Automatically log employee creation, employee updates, and wage changes to provide a traceable audit trail for compliance and data integrity.

## Scope

- Log employee creation events.
- Log employee update events with a JSON diff of changed fields.
- Log wage changes (Salary or Hourly Rate) with old and new values.
- Logs are created by the backend services — not manually by the user.
- Logs are immutable — no editing or deleting.
- Audit logs are viewable in the app (read-only).

## What is NOT logged (per PRD)

- Payroll generation, approval, or revision events.
- Attendance uploads.
- Adjustment creation or approval.
- File deletions.

## PRD References

- Section 15.12: Audit Log data model
- Section 17.3: Auditability
- Section 9.1 (step 8): Audit log on employee creation
- Section 9.2 (step 4): Audit log on employee update and wage change

---

## E2E Behavior Tests

### E2E-01: Audit log created on employee creation

```
GIVEN the user creates a new employee "EMP-050"
WHEN the employee is saved
THEN an AuditLog record is created with:
  actionType = "CREATE"
  entityType = "EMPLOYEE"
  entityId = <employee id>
  detailsJson contains all initial field values
```

### E2E-02: Audit log created on employee update

```
GIVEN employee "EMP-001" exists with phone = "9876543210"
WHEN the user changes phone to "1111111111" and saves
THEN an AuditLog record is created with:
  actionType = "UPDATE"
  entityType = "EMPLOYEE"
  entityId = <employee id>
  detailsJson contains { changedFields: { phone: { old: "9876543210", new: "1111111111" } } }
```

### E2E-03: Separate audit log for wage change

```
GIVEN employee "EMP-001" has hourlyRate = 62.50
WHEN the user changes hourlyRate to 75.00 and saves
THEN two AuditLog records are created:
  1. actionType = "UPDATE", entityType = "EMPLOYEE" (general update log)
  2. actionType = "UPDATE", entityType = "WAGE_HISTORY" with detailsJson containing old and new wage values
```

### E2E-04: Audit log for import-triggered changes

```
GIVEN employee "EMP-001" exists
AND an import updates "EMP-001"'s salary from 12000 to 14000
WHEN the import is executed
THEN audit logs are created for the employee update and the wage change
AND the changeSource in the details is "IMPORT"
```

### E2E-05: Audit logs are immutable

```
GIVEN audit log records exist
THEN there are no API endpoints or UI controls to edit or delete audit logs
```

### E2E-06: View audit logs in the app

```
GIVEN 50 audit log entries exist
WHEN the user navigates to the audit log viewer
THEN the logs are displayed in reverse chronological order
AND each entry shows: timestamp, action type, entity type, entity ID, changed details
```
