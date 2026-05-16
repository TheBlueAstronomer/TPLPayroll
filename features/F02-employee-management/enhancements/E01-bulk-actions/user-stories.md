# E01 — Bulk Employee Actions: User Stories

> **Status: 📋 PLANNED**

---

## US-E01.1: Select employees from the list

**As a** Payroll Owner
**I want to** select one or more employees from the Team Directory using checkboxes
**So that** I can apply batch operations to them without navigating to each profile individually.

### Acceptance Criteria

- AC1: A new checkbox column appears as the first column in the Employee List table.
- AC2: Each employee row has an individual checkbox.
- AC3: A header checkbox in the table header selects/deselects all employees on the current page.
- AC4: The header checkbox shows an indeterminate state when some (but not all) employees on the page are selected.
- AC5: When ≥ 1 employee is selected, a floating bulk-action toolbar appears at the bottom of the viewport.
- AC6: The toolbar displays the count of selected employees (e.g., "3 selected").
- AC7: Clicking a checkbox does NOT navigate to the employee profile (only the row itself outside the checkbox navigates).
- AC8: Changing page, search query, or status filter clears all selections.

### Unit Tests

```
TEST: selecting an employee adds it to the selection set
  GIVEN an employee row is rendered with a checkbox
  WHEN the user clicks the checkbox
  THEN the employee id is added to the selectedIds state

TEST: header checkbox selects all visible employees
  GIVEN 10 employees are rendered on the page
  WHEN the header checkbox is clicked
  THEN all 10 employee ids are in the selectedIds set

TEST: header checkbox deselects all when all are selected
  GIVEN all 10 employees are selected
  WHEN the header checkbox is clicked
  THEN selectedIds is empty

TEST: changing search clears selection
  GIVEN 3 employees are selected
  WHEN the search input value changes
  THEN selectedIds is empty and the toolbar is hidden

TEST: header checkbox shows indeterminate when partially selected
  GIVEN 3 of 10 employees are selected
  THEN the header checkbox indeterminate property is true
```

---

## US-E01.2: Floating bulk-action toolbar

**As a** Payroll Owner
**I want to** see a contextual toolbar when I have employees selected
**So that** I know how many employees I've selected and can choose a bulk action.

### Acceptance Criteria

- AC1: The toolbar is fixed at the bottom center of the viewport.
- AC2: The toolbar appears with a slide-up animation when selection count goes from 0 → ≥ 1.
- AC3: The toolbar disappears with a slide-down animation when selection count goes from ≥ 1 → 0.
- AC4: The toolbar contains: selection count label, "Mark as Resigned" button, "Mark as Inactive" button, "Change Hourly Rate" button, and a "Clear" (✕) button to deselect all.
- AC5: Buttons use the existing design system — emerald for neutral actions, rose for destructive-leaning actions.
- AC6: The toolbar does not overlap the pagination controls.

### Unit Tests

```
TEST: toolbar renders when selectedIds is non-empty
  GIVEN selectedIds has 3 entries
  THEN the toolbar is visible with text "3 selected"

TEST: toolbar does not render when selectedIds is empty
  GIVEN selectedIds is empty
  THEN the toolbar is not in the DOM

TEST: clear button empties the selection
  GIVEN 5 employees are selected and the toolbar is visible
  WHEN the user clicks the "✕" button
  THEN selectedIds is empty and the toolbar disappears
```

---

## US-E01.3: Bulk mark employees as Resigned

**As a** Payroll Owner
**I want to** mark multiple selected employees as Resigned with a single action
**So that** I can process a group resignation or end-of-contract event efficiently.

### Acceptance Criteria

- AC1: Clicking "Mark as Resigned" in the toolbar opens a confirmation dialog.
- AC2: The dialog shows a list of affected employee names (scrollable if > 5 employees).
- AC3: The dialog has a required Date of Resignation field (calendar picker, defaults to today).
- AC4: Clicking "Confirm" calls the server action for each selected employee, setting `dateOfResignation` to the entered date.
- AC5: The dialog shows a loading state during processing.
- AC6: On success, a toast shows "N employees marked as resigned".
- AC7: On partial failure, a toast shows "N succeeded, M failed".
- AC8: On completion (success or partial), selections are cleared and the list is refreshed.
- AC9: Each employee receives its own audit log entry with `actionType = "UPDATE"`, `entityType = "EMPLOYEE"`, recording the `dateOfResignation` change.
- AC10: If the user clicks "Cancel", no changes are made and selections remain.

### Unit Tests

```
TEST: bulkUpdateStatus marks employees as resigned with the given date
  GIVEN 3 employee ids and a resignationDate of "2026-06-01"
  WHEN bulkUpdateStatus({ ids, status: 'RESIGNED', dateOfResignation }) is called
  THEN all 3 employees have dateOfResignation = "2026-06-01"

TEST: bulkUpdateStatus creates audit logs for each employee
  GIVEN 3 employees are being marked resigned
  WHEN bulkUpdateStatus is called
  THEN 3 audit log entries are created

TEST: bulkUpdateStatus handles partial failure
  GIVEN 3 employee ids, one of which does not exist
  WHEN bulkUpdateStatus is called
  THEN 2 succeed and 1 fails
  AND the result contains { succeeded: 2, failed: 1, errors: [...] }

TEST: resignation date is required
  GIVEN the user opens the Mark as Resigned dialog
  WHEN the user clicks "Confirm" without selecting a date
  THEN a validation error appears: "Date of Resignation is required"
```

---

## US-E01.4: Bulk mark employees as Inactive

**As a** Payroll Owner
**I want to** mark multiple selected employees as Inactive with a single action
**So that** I can efficiently deactivate employees who should be excluded from payroll.

### Acceptance Criteria

- AC1: Clicking "Mark as Inactive" in the toolbar opens a confirmation dialog.
- AC2: The dialog shows a list of affected employee names.
- AC3: The dialog explains the consequence: "These employees will be excluded from future payroll runs. They will remain visible in the directory."
- AC4: Clicking "Confirm" calls the server action for each selected employee, setting `isActive = false`.
- AC5: The dialog shows a loading state during processing.
- AC6: On success, a toast shows "N employees marked as inactive".
- AC7: On partial failure, a toast shows "N succeeded, M failed".
- AC8: On completion, selections are cleared and the list is refreshed.
- AC9: Each employee receives its own audit log entry.
- AC10: If the user clicks "Cancel", no changes are made and selections remain.
- AC11: Employees who are already inactive are silently skipped (not counted as failures).

### Unit Tests

```
TEST: bulkUpdateStatus marks employees as inactive
  GIVEN 4 active employee ids
  WHEN bulkUpdateStatus({ ids, status: 'INACTIVE' }) is called
  THEN all 4 employees have isActive = false

TEST: already-inactive employees are skipped
  GIVEN 3 employee ids, 1 of which is already inactive
  WHEN bulkUpdateStatus({ ids, status: 'INACTIVE' }) is called
  THEN 2 are updated, 1 is skipped
  AND the result shows { succeeded: 2, skipped: 1 }

TEST: bulkUpdateStatus creates audit logs only for changed employees
  GIVEN 3 employees, 1 already inactive
  WHEN bulkUpdateStatus is called
  THEN only 2 audit log entries are created
```

---

## US-E01.5: Bulk change hourly rate

**As a** Payroll Owner
**I want to** update the hourly rate for multiple employees at once
**So that** I can apply company-wide or site-wide rate adjustments without editing each employee individually.

### Acceptance Criteria

- AC1: Clicking "Change Hourly Rate" in the toolbar opens a dialog.
- AC2: The dialog shows a list of affected employee names with their current hourly rates.
- AC3: The dialog has a required "New Hourly Rate (₹)" field (number input, step 0.01, min 0).
- AC4: The dialog has an optional "Effective From" date field (calendar picker, defaults to today).
- AC5: Clicking "Confirm" processes each selected employee:
  - Updates the employee's hourly rate.
  - Closes the previous open wage history entry (sets `effectiveTo`).
  - Creates a new wage history entry with the new hourly rate, the existing weekly salary, and the specified effective date.
  - Creates an audit log entry for the wage change.
- AC6: The dialog shows a loading state during processing with a progress indicator (e.g., "Processing 3 of 10…").
- AC7: On success, a toast shows "Hourly rate updated for N employees".
- AC8: On partial failure, a toast shows "N succeeded, M failed".
- AC9: On completion, selections are cleared and the list is refreshed.
- AC10: If the new hourly rate matches an employee's current rate, that employee is skipped.
- AC11: If the user clicks "Cancel", no changes are made and selections remain.
- AC12: The new hourly rate must be a positive number; the dialog shows a validation error otherwise.

### Unit Tests

```
TEST: bulkUpdateHourlyRate updates hourly rates and creates wage history
  GIVEN 3 employees with hourly rates 62.50, 55.00, 70.00
  WHEN bulkUpdateHourlyRate({ ids, newHourlyRate: 75.00, effectiveFrom: today }) is called
  THEN all 3 employees have new wage history entries with hourlyRate = 75.00
  AND the previous wage history entries have effectiveTo = today

TEST: bulkUpdateHourlyRate skips employees with matching rate
  GIVEN 3 employees, one of which already has hourlyRate = 75.00
  WHEN bulkUpdateHourlyRate({ ids, newHourlyRate: 75.00 }) is called
  THEN 2 are updated, 1 is skipped
  AND the result shows { succeeded: 2, skipped: 1 }

TEST: bulkUpdateHourlyRate preserves weekly salary
  GIVEN an employee with weeklySalary = 14000 and hourlyRate = 62.50
  WHEN bulkUpdateHourlyRate({ ids: [id], newHourlyRate: 75.00 }) is called
  THEN the new wage history entry has weeklySalary = 14000 and hourlyRate = 75.00

TEST: bulkUpdateHourlyRate creates audit logs for each changed employee
  GIVEN 3 employees being updated
  WHEN bulkUpdateHourlyRate is called
  THEN 3 audit log entries are created with actionType = "UPDATE", entityType = "WAGE_HISTORY"

TEST: new hourly rate validation rejects zero
  GIVEN the user enters newHourlyRate = 0
  WHEN the user clicks "Confirm"
  THEN a validation error appears: "Hourly rate must be greater than 0"

TEST: bulkUpdateHourlyRate uses custom effective date
  GIVEN effectiveFrom = "2026-07-01"
  WHEN bulkUpdateHourlyRate is called
  THEN wage history entries have effectiveFrom = "2026-07-01"
  AND previous entries have effectiveTo = "2026-07-01"
```

---

## US-E01.6: Bulk action loading and error handling

**As a** Payroll Owner
**I want to** see clear progress and outcome feedback during bulk operations
**So that** I know what happened and can follow up on any failures.

### Acceptance Criteria

- AC1: While a bulk operation is processing, the dialog shows a progress bar or counter (e.g., "Processing 3 of 10…").
- AC2: The "Confirm" button is disabled during processing.
- AC3: The "Cancel" button is disabled during processing (to prevent partial cancellation).
- AC4: The dialog backdrop click is disabled during processing.
- AC5: If all updates succeed, a success toast appears and the dialog closes automatically.
- AC6: If some updates fail, the dialog shows a result summary listing which employees failed and why, before auto-closing after 3 seconds or on user dismiss.
- AC7: The employee list refreshes automatically after any bulk operation completes.

### Unit Tests

```
TEST: dialog disables buttons during processing
  GIVEN a bulk operation is in progress
  THEN the "Confirm" and "Cancel" buttons are disabled

TEST: success toast shows correct count
  GIVEN a bulk operation completes with 5 successes and 0 failures
  THEN a toast shows "5 employees marked as inactive" (or equivalent message)

TEST: partial failure toast shows correct counts
  GIVEN a bulk operation completes with 4 successes and 1 failure
  THEN a toast shows "4 succeeded, 1 failed"
```
