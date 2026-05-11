# F06 — Payroll Generation: User Stories

---

## US-06.1: Select payroll week

**As a** Payroll Owner
**I want to** select a payroll week to generate payroll for
**So that** I can initiate the payroll calculation process.

### Acceptance Criteria

- AC1: A week selector lists available payroll weeks (based on attendance uploads).
- AC2: The selector defaults to the most recent week with an active attendance upload.
- AC3: Weeks with no attendance upload are shown as "No attendance" and cannot be selected for payroll generation.
- AC4: Weeks with blocking attendance errors show a warning icon.
- AC5: Previously approved weeks show a checkmark and link to the existing payroll run.

### Unit Tests

```
TEST: getAvailablePayrollWeeks returns weeks with attendance
  GIVEN attendance uploads exist for March 6-12, Feb 27-Mar 5
  WHEN getAvailablePayrollWeeks() is called
  THEN it returns both weeks with their statuses

TEST: getAvailablePayrollWeeks marks weeks with blocking errors
  GIVEN March 6-12 has unmatched employees
  WHEN getAvailablePayrollWeeks() is called
  THEN March 6-12 has status "HAS_ERRORS"
```

---

## US-06.2: Verify attendance readiness

**As a** Payroll Owner
**I want to** the app to check that attendance has no blocking errors before proceeding
**So that** I don't generate payroll with bad data.

### Acceptance Criteria

- AC1: If the selected week's attendance has blocking errors, show a blocker message and link to the attendance review.
- AC2: If no attendance upload exists, show "No attendance uploaded" with a link to upload.
- AC3: If attendance is clean, proceed to the adjustment review step.

### Unit Tests

```
TEST: checkAttendanceReadiness returns BLOCKED when errors exist
  GIVEN attendance for week has unmatched employees
  WHEN checkAttendanceReadiness(weekStart, weekEnd) is called
  THEN it returns { ready: false, reason: "UNRESOLVED_ERRORS", errorCount: 2 }

TEST: checkAttendanceReadiness returns READY when clean
  GIVEN attendance for week has all matches and no errors
  WHEN checkAttendanceReadiness() is called
  THEN it returns { ready: true }
```

---

## US-06.3: Review and approve/skip weekly adjustments

**As a** Payroll Owner
**I want to** review all pending adjustments for the selected week and decide which to apply
**So that** I control which deductions and additions affect this payroll run.

### Acceptance Criteria

- AC1: Shows all PayrollAdjustmentApplication records with approvalStatus = "PENDING" for the selected week.
- AC2: Each row shows: Employee Name, Type (Deduction/Addition), Amount, Reason.
- AC3: User can approve (✓) or skip (✗) each adjustment individually.
- AC4: "Approve All" and "Skip All" bulk actions are available.
- AC5: If no pending adjustments exist, this step is skipped and the user proceeds directly to calculation.
- AC6: The user cannot proceed until every pending adjustment has been actioned (approved or skipped).

### Unit Tests

```
TEST: getPendingAdjustmentsForWeek returns correct applications
  GIVEN 3 PENDING applications for March 6-12
  WHEN getPendingAdjustmentsForWeek("2025-03-06", "2025-03-12") is called
  THEN it returns 3 applications

TEST: getPendingAdjustmentsForWeek returns empty for no pending
  GIVEN no PENDING applications for March 6-12
  WHEN getPendingAdjustmentsForWeek() is called
  THEN it returns empty array
```

---

## US-06.4: Calculate payroll

**As a** Payroll Owner
**I want to** the app to calculate payroll using attendance data, hourly rates, and approved adjustments
**So that** an accurate payroll summary is produced.

### Acceptance Criteria

- AC1: For each employee: regularPay = sum(dailyRegularHours * hourlyRate).
- AC2: For each employee: overtimePay = sum(dailyOvertimeHours * hourlyRate). (Note: daily hours are adjusted during parsing so that regular is max 8 and overtime is the excess).
- AC3: grossPay = regularPay + overtimePay.
- AC4: Deductions and additions come only from APPROVED adjustment applications for this week.
- AC5: netPayable = grossPay + approvedAdditions - approvedDeductions.
- AC6: All monetary values retain decimal precision (paise).
- AC7: PayrollRunEmployee records are created for each employee.

### Unit Tests

```
TEST: calculateRegularPay calculates regular pay based on pre-capped daily hours
  GIVEN dailyHours = [8, 8, 6, 0, 8, 8, 8] and hourlyRate = 62.50
  WHEN calculateRegularPay() is called
  THEN regularHours = 8+8+6+0+8+8+8 = 46
  AND regularPay = 46 * 62.50 = 2875.00

TEST: calculateOvertimePay sums overtime at hourly rate
  GIVEN dailyOT = [2, 0, 0, 0, 3, 1, 0] and hourlyRate = 62.50
  WHEN calculateOvertimePay() is called
  THEN overtimeHours = 6
  AND overtimePay = 6 * 62.50 = 375.00

TEST: calculateNetPayable includes approved adjustments
  GIVEN grossPay = 3250.00, approvedDeductions = 500, approvedAdditions = 200
  WHEN calculateNetPayable() is called
  THEN netPayable = 3250.00 + 200 - 500 = 2950.00

TEST: calculateRegularPay handles all zero hours
  GIVEN dailyHours = [0, 0, 0, 0, 0, 0, 0]
  WHEN calculateRegularPay() is called
  THEN regularPay = 0

TEST: calculatePayroll retains paise precision
  GIVEN hourlyRate = 71.43, regularHours = 46
  WHEN calculateRegularPay() is called
  THEN regularPay = 3285.78 (not 3286)
```

---

## US-06.5: Preview payroll summary

**As a** Payroll Owner
**I want to** see an in-app summary of the calculated payroll before approving
**So that** I can catch errors before committing.

### Acceptance Criteria

- AC1: Summary table shows per employee: Employee ID, Name, Designation, Site, GPay, Bank Account, Regular Hrs, OT Hrs, Regular Pay, OT Pay, Additions, Deductions, Net Payable.
- AC2: Footer row shows totals for all monetary columns.
- AC3: All amounts formatted in ₹ INR with 2 decimal places.
- AC4: The user can go back to adjust or proceed to approve.

### Unit Tests

```
TEST: formatPayrollSummary returns correct structure
  GIVEN payroll calculated for 3 employees
  WHEN formatPayrollSummary() is called
  THEN it returns 3 employee rows and a totals row
  AND each row has all required columns
```

---

## US-06.6: Approve payroll

**As a** Payroll Owner
**I want to** approve the payroll summary to lock it as the official payroll for the week
**So that** the payroll is finalized and eligible for report/slip generation.

### Acceptance Criteria

- AC1: Approval creates/updates the PayrollRun record with status = "APPROVED".
- AC2: A PayrollRevision record is created with revisionNumber = 1, isCurrent = true, status = "APPROVED".
- AC3: PayrollRunEmployee records are persisted.
- AC4: Total values (totalRegularPay, totalOvertimePay, etc.) are stored on both the run and revision.
- AC5: approvedAt is set to the current timestamp.
- AC6: A success message is shown with links to generate PDF summary and payroll slips.

### Unit Tests

```
TEST: approvePayroll creates run and revision
  GIVEN calculated payroll data for 15 employees
  WHEN approvePayroll() is called
  THEN a PayrollRun is created with status = "APPROVED"
  AND a PayrollRevision is created with revisionNumber = 1, isCurrent = true
  AND 15 PayrollRunEmployee records are created

TEST: approvePayroll stores correct totals
  GIVEN totalRegularPay = 40000, totalOvertimePay = 5000, totalAdditions = 2000, totalDeductions = 3000
  WHEN approvePayroll() is called
  THEN the run and revision store totalNetPayable = 44000
```
