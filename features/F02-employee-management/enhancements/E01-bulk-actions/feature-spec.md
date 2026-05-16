# E01 — Bulk Employee Actions

> **Status: 📋 PLANNED**

## Goal

Allow the Payroll Owner to select multiple employees from the Team Directory and apply batch changes — marking them as Resigned or Inactive, or updating their hourly salaries in bulk — so that routine workforce changes can be processed efficiently without editing each employee one at a time.

## Motivation

The current employee management workflow only supports one-at-a-time status changes (via the DeactivateDialog) and individual wage edits (via the Edit Employee form). When workforce reductions, site closures, or company-wide rate adjustments occur, the Payroll Owner must repeat the same operation dozens of times. This enhancement adds a multi-select mode to the employee list with two batch operations:

1. **Bulk Status Change** — mark selected employees as *Resigned* (with a resignation date) or *Inactive*.
2. **Bulk Hourly Rate Update** — set a new hourly rate for all selected employees, creating wage history entries automatically.

## Scope

### In Scope

- Checkbox column on the Employee List table for multi-select.
- "Select all on page" checkbox in the table header.
- Floating bulk-action toolbar that appears when ≥ 1 employee is selected.
- **Mark as Resigned** action: opens a confirmation dialog with a required Date of Resignation field; applies to all selected employees.
- **Mark as Inactive** action: opens a confirmation dialog; sets `isActive = false` for all selected employees.
- **Change Hourly Rate** action: opens a dialog with a required new Hourly Rate field and an optional Effective From date (defaults to today); applies to all selected employees.
- Each bulk operation creates individual audit log entries per employee (consistent with existing audit patterns).
- Each bulk wage change creates individual wage history entries per employee (consistent with existing wage history patterns).
- Bulk operation success/failure summary toast showing count of succeeded and failed updates.
- Operations are transactional per employee — a failure on one employee does not roll back others.
- The bulk-action toolbar shows the count of selected employees.

### Out of Scope

- Bulk editing of fields other than status and hourly rate (e.g., site, designation).
- Cross-page selection (selecting employees across multiple paginated pages).
- Bulk salary (weekly salary) change — only hourly rate is included in this enhancement.
- Undo/rollback of bulk operations.
- Bulk delete (employees are never deleted in this system).

## PRD References

- Section 6: Employee Master Data (field definitions)
- Section 9.2: Update Employee (workflow — extended for batch)
- Section 16.3: Inactive and Resigned Employee Rules
- Section 17.3: Auditability

## Relationship to Existing Feature

This enhancement **extends** F02 — Employee Management. It reuses:

| Concern | Existing asset | Enhancement change |
|---|---|---|
| Employee list UI | `EmployeeListTable.tsx` | Add checkbox column + floating toolbar |
| Status update logic | `employee.service.ts → updateEmployee()` | New `bulkUpdateStatus()` service function |
| Wage change logic | `employee.service.ts → updateEmployee()` | New `bulkUpdateHourlyRate()` service function |
| Server actions | `employee.actions.ts` | New `bulkUpdateStatusAction()` and `bulkUpdateHourlyRateAction()` |
| Types | `employee.types.ts` | New `BulkStatusUpdateInput` and `BulkHourlyRateUpdateInput` types |
| Deactivate dialog pattern | `DeactivateDialog.tsx` | Referenced for dialog design; new `BulkStatusDialog.tsx` and `BulkRateDialog.tsx` |

No schema changes are required — existing `Employee`, `EmployeeWageHistory`, and `AuditLog` models support all needed writes.

---

## E2E Behavior Tests

### E2E-01: Select multiple employees and mark as Resigned

```
GIVEN the user is on the Employee Management page with 10 active employees
WHEN the user selects checkboxes for employees EMP-001, EMP-002, and EMP-003
THEN the floating bulk-action toolbar appears showing "3 selected"
WHEN the user clicks "Mark as Resigned"
AND enters Date of Resignation = "2026-06-01"
AND clicks "Confirm"
THEN all 3 employees have dateOfResignation = "2026-06-01"
AND all 3 employees' status shows "Resigned" in the list
AND 3 audit log entries are created with actionType = "UPDATE", entityType = "EMPLOYEE"
AND a success toast shows "3 employees marked as resigned"
AND the checkboxes are cleared and the toolbar disappears
```

### E2E-02: Select multiple employees and mark as Inactive

```
GIVEN the user is on the Employee Management page
WHEN the user selects checkboxes for 5 active employees
AND clicks "Mark as Inactive"
AND confirms the action in the dialog
THEN all 5 employees have isActive = false
AND all 5 employees show "Inactive" status badge in the list
AND 5 audit log entries are created
AND a success toast shows "5 employees marked as inactive"
```

### E2E-03: Bulk update hourly rate

```
GIVEN employees EMP-010, EMP-011, and EMP-012 have hourly rates of ₹62.50, ₹55.00, and ₹70.00 respectively
WHEN the user selects all 3 employees
AND clicks "Change Hourly Rate"
AND enters new hourly rate = 75.00
AND confirms the action
THEN all 3 employees have their current hourly rate set to 75.00
AND 3 new wage history entries are created with hourlyRate = 75.00 and effectiveFrom = today
AND the previous open wage history entries for all 3 have effectiveTo = today
AND 3 audit log entries are created for the wage changes
AND a success toast shows "Hourly rate updated for 3 employees"
```

### E2E-04: Partial failure during bulk operation

```
GIVEN the user selects 4 employees for a bulk status change
AND 1 of the 4 employees cannot be updated due to a database constraint error
WHEN the user confirms the bulk action
THEN 3 employees are updated successfully
AND 1 employee update fails
AND the toast shows "3 succeeded, 1 failed"
AND the failed employee remains in its original state
```

### E2E-05: Select-all on current page

```
GIVEN the Employee List shows 10 employees on the current page (out of 27 total)
WHEN the user clicks the "select all" checkbox in the table header
THEN all 10 employees on the current page are selected
AND the toolbar shows "10 selected"
WHEN the user unchecks the header checkbox
THEN all checkboxes are cleared and the toolbar disappears
```

### E2E-06: Bulk actions are unavailable when no employees are selected

```
GIVEN the user is on the Employee Management page
AND no checkboxes are selected
THEN the floating bulk-action toolbar is not visible
```

### E2E-07: Attempting bulk resign with no resignation date is rejected

```
GIVEN the user selects 2 employees and clicks "Mark as Resigned"
WHEN the dialog opens and the user clicks "Confirm" without entering a date
THEN the dialog shows a validation error: "Date of Resignation is required"
AND no employees are updated
```

### E2E-08: Bulk hourly rate with custom effective date

```
GIVEN the user selects 2 employees and clicks "Change Hourly Rate"
WHEN the user enters hourly rate = 80.00 and effective from = "2026-07-01"
AND confirms the action
THEN wage history entries are created with effectiveFrom = "2026-07-01"
AND the previous wage history entries have effectiveTo = "2026-07-01"
```
