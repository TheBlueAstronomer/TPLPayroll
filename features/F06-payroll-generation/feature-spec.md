# F06 — Payroll Generation

> **Status: ✅ DONE**

## Goal

Calculate weekly payroll from attendance data and employee wages, allow the Payroll Owner to review a summary preview, review and approve applicable adjustments, and approve the final payroll — making it eligible for report and payroll slip generation.

## Scope

- Select a payroll week and load the active attendance upload.
- Verify attendance is error-free (no blocking issues).
- Review and approve/skip applicable adjustments for the week.
- Calculate payroll: regularPay, overtimePay, grossPay, deductions, additions, netPayable.
- Display an in-app payroll summary preview.
- Approve the payroll summary to lock it as the current payroll run.
- Create PayrollRun, PayrollRevision, and PayrollRunEmployee records.

## Payroll Calculation Rules (from PRD Section 7)

```
regularPay   = sum(regularHoursPerDay * hourlyRate)
overtimePay  = sum(overtimeHoursPerDay * hourlyRate)
grossPay     = regularPay + overtimePay
netPayable   = grossPay + approvedAdditions - approvedDeductions
```

- Total Hours Worked Per Day = Regular Hours + Overtime Hours (from attendance sheet, handled during upload parsing).
- Regular hours are capped at 8/day.
- Overtime is calculated as hours worked beyond 8 hours per day.
- All amounts in ₹ INR with paise (no rounding).

## PRD References

- Section 7: Payroll Calculation Rules
- Section 9.7: Generate Payroll Summary (workflow)
- Section 10.1: Weekly Payroll Summary Report (content)
- Section 15.8–15.10: PayrollRun, PayrollRevision, PayrollRunEmployee

---

## E2E Behavior Tests

### E2E-01: Generate payroll for a clean week

```
GIVEN a payroll week (March 6-12) has an active attendance upload with 15 matched employees and 0 blocking errors
AND 3 pending adjustment applications exist for this week
WHEN the user navigates to Payroll Generation and selects March 6-12
THEN the attendance data loads successfully
AND the adjustment review step shows 3 pending adjustments
WHEN the user approves all 3 adjustments and clicks Continue
THEN payroll is calculated for all 15 employees
AND an in-app summary preview is shown with per-employee and total amounts
WHEN the user clicks "Approve Payroll"
THEN a PayrollRun is created with status = "APPROVED"
AND a PayrollRevision (revision 1, isCurrent = true) is created
AND 15 PayrollRunEmployee records are created with correct calculations
```

### E2E-02: Payroll blocked when attendance has errors

```
GIVEN the attendance upload for March 6-12 has 2 unmatched employees
WHEN the user tries to generate payroll for March 6-12
THEN the app shows "Payroll cannot be generated — attendance has unresolved blocking errors"
AND provides a link to the attendance upload review page
AND the "Calculate Payroll" action is disabled
```

### E2E-03: Payroll calculation is accurate

```
GIVEN employee "EMP-001" has hourlyRate = ₹62.50
AND the attendance for March 6-12 shows:
  - Thu: regular=8, OT=2
  - Fri: regular=8, OT=0
  - Sat: regular=6, OT=0
  - Sun: regular=0, OT=0
  - Mon: regular=8, OT=3
  - Tue: regular=8, OT=1
  - Wed: regular=8, OT=0
AND a deduction of ₹500 is approved
AND an addition of ₹200 is approved
WHEN payroll is calculated
THEN regularHours = min(8,8)+min(8,8)+min(6,8)+0+min(8,8)+min(8,8)+min(8,8) = 46
AND regularPay = 46 * 62.50 = ₹2,875.00
AND overtimeHours = 2+0+0+0+3+1+0 = 6
AND overtimePay = 6 * 62.50 = ₹375.00
AND grossPay = ₹3,250.00
AND netPayable = 3250.00 + 200.00 - 500.00 = ₹2,950.00
```

### E2E-04: Payroll retains paise precision

```
GIVEN employee "EMP-002" has hourlyRate = ₹71.43
AND total regularHours = 46, overtimeHours = 3
WHEN payroll is calculated
THEN regularPay = 46 * 71.43 = ₹3,285.78
AND overtimePay = 3 * 71.43 = ₹214.29
AND amounts are NOT rounded to the nearest rupee
```

### E2E-05: No attendance upload for selected week

```
GIVEN no attendance upload exists for March 13-19
WHEN the user selects March 13-19 for payroll generation
THEN the app shows "No attendance uploaded for this week"
AND provides a link to upload attendance
```

### E2E-06: Payroll summary shows correct totals

```
GIVEN payroll is calculated for 15 employees
WHEN the summary preview is displayed
THEN the summary shows each employee's: ID, Name, Designation, Site, GPay, Bank Account, Regular Hrs, OT Hrs, Regular Pay, OT Pay, Additions, Deductions, Net Payable
AND the footer shows: total Regular Pay, total OT Pay, total Additions, total Deductions, total Net Payable
```
