# F11 — Audit Logging: User Stories

> **Status: ✅ DONE** — All 4 user stories fully implemented.

---

## US-11.1: Log employee creation ✅

**As a** system
**I want to** automatically create an audit log when an employee is created
**So that** there is a traceable record of when and how each employee was added.

### Acceptance Criteria

- AC1: An AuditLog entry is created on every successful employee creation (manual or import).
- AC2: actionType = "CREATE".
- AC3: entityType = "EMPLOYEE".
- AC4: entityId = the employee's database ID.
- AC5: detailsJson includes all initial field values.
- AC6: createdAt is set to the creation timestamp.

### Unit Tests

```
TEST: createAuditLog for employee creation
  GIVEN a new employee is created with id = "abc-123"
  WHEN createAuditLog is called
  THEN an AuditLog record exists with actionType = "CREATE", entityType = "EMPLOYEE", entityId = "abc-123"

TEST: createAuditLog stores initial field values
  GIVEN employee created with employeeName = "Ravi Kumar", designation = "Guard"
  WHEN createAuditLog is called
  THEN detailsJson contains { employeeName: "Ravi Kumar", designation: "Guard" }
```

---

## US-11.2: Log employee updates ✅

**As a** system
**I want to** create an audit log when an employee's details are updated
**So that** changes to employee data are traceable.

### Acceptance Criteria

- AC1: An AuditLog entry is created on every successful employee update.
- AC2: actionType = "UPDATE".
- AC3: entityType = "EMPLOYEE".
- AC4: detailsJson contains a diff: `{ changedFields: { fieldName: { old: "...", new: "..." } } }`.
- AC5: Only changed fields are included in the diff.
- AC6: If an update is triggered by import, the changeSource is included in detailsJson.

### Unit Tests

```
TEST: createUpdateAuditLog captures changed fields
  GIVEN employee phone changed from "111" to "222"
  WHEN createUpdateAuditLog is called
  THEN detailsJson.changedFields.phone = { old: "111", new: "222" }

TEST: createUpdateAuditLog excludes unchanged fields
  GIVEN only phone changed, designation unchanged
  WHEN createUpdateAuditLog is called
  THEN detailsJson.changedFields does NOT contain "designation"

TEST: createUpdateAuditLog includes changeSource for imports
  GIVEN an import triggers the update
  WHEN createUpdateAuditLog is called with source = "IMPORT"
  THEN detailsJson.changeSource = "IMPORT"
```

---

## US-11.3: Log wage changes ✅

**As a** system
**I want to** create a specific audit log when Salary or Hourly Rate changes
**So that** wage changes have a dedicated audit trail.

### Acceptance Criteria

- AC1: A separate AuditLog entry is created when Salary or Hourly Rate changes.
- AC2: actionType = "UPDATE".
- AC3: entityType = "WAGE_HISTORY".
- AC4: entityId = the wage history record's ID.
- AC5: detailsJson includes: employeeId, old salary, new salary, old hourly rate, new hourly rate, effectiveFrom, changeSource.

### Unit Tests

```
TEST: createWageChangeAuditLog logs old and new values
  GIVEN hourlyRate changed from 62.50 to 75.00
  WHEN createWageChangeAuditLog is called
  THEN detailsJson contains { oldHourlyRate: 62.50, newHourlyRate: 75.00 }

TEST: createWageChangeAuditLog includes effectiveFrom
  GIVEN wage change with effectiveFrom = "2025-06-01"
  WHEN createWageChangeAuditLog is called
  THEN detailsJson.effectiveFrom = "2025-06-01"
```

---

## US-11.4: View audit logs ✅

**As a** Payroll Owner
**I want to** view the audit log in the app
**So that** I can review the history of changes to employee data.

### Acceptance Criteria

- AC1: Audit logs are displayed in reverse chronological order.
- AC2: Each entry shows: timestamp (formatted), action type, entity type, entity ID, summary of changes.
- AC3: Clicking an entry expands to show the full detailsJson.
- AC4: Logs can be filtered by entity type (Employee, Wage History).
- AC5: Logs can be filtered by action type (Create, Update).
- AC6: No edit or delete controls exist.

### Unit Tests

```
TEST: getAuditLogs returns logs in reverse chronological order
  GIVEN 5 audit logs created at different times
  WHEN getAuditLogs() is called
  THEN logs are sorted by createdAt descending

TEST: getAuditLogs filters by entityType
  GIVEN 10 EMPLOYEE logs and 5 WAGE_HISTORY logs
  WHEN getAuditLogs(entityType="WAGE_HISTORY") is called
  THEN it returns 5 logs

TEST: getAuditLogs filters by actionType
  GIVEN 8 CREATE logs and 12 UPDATE logs
  WHEN getAuditLogs(actionType="CREATE") is called
  THEN it returns 8 logs
```
