# F05 — Payroll Adjustments

> **Status: ✅ DONE**

## Goal

Allow the Payroll Owner to create and manage deductions and additions for employees — both one-time and recurring — so that payroll calculations accurately reflect advances, bonuses, penalties, and other financial adjustments.

## Scope

- Create one-time deductions or additions for a specific payroll week.
- Create recurring deductions or additions with configurable end conditions.
- Three recurring end conditions: end payroll week, fixed number of weeks, total balance depletion.
- Weekly review of applicable adjustments during payroll generation.
- Approve or skip adjustments per payroll week.
- Skipped recurring adjustments carry forward to the next payroll week.
- Track remaining balance for balance-based recurring adjustments.

## PRD References

- Section 8: Payroll Adjustments
- Section 9.7 (step 4-5): Weekly adjustment review during payroll generation
- Section 15.6: PayrollAdjustment data model
- Section 15.7: PayrollAdjustmentApplication data model

---

## E2E Behavior Tests

### E2E-01: Create a one-time deduction

```
GIVEN the user is on the Adjustments page
WHEN the user creates a deduction for employee "EMP-001" with amount = ₹500, reason = "Advance recovery", type = ONE_TIME, payroll week = March 6-12
AND clicks Save
THEN a PayrollAdjustment record is created
AND a PayrollAdjustmentApplication is created for the March 6-12 week with approvalStatus = PENDING
```

### E2E-02: Create a recurring addition with fixed weeks

```
GIVEN the user creates an addition for "EMP-002" with amount = ₹1000, reason = "Transport allowance", type = RECURRING, endCondition = FIXED_WEEKS, totalWeeks = 4, starting week March 6-12
WHEN the adjustment is saved
THEN a PayrollAdjustment record is created with totalRecurrenceWeeks = 4
AND a PENDING application is created for the starting payroll week
```

### E2E-03: Create a recurring deduction with total balance

```
GIVEN the user creates a deduction for "EMP-003" with amount = ₹2000 per week, reason = "Loan recovery", type = RECURRING, endCondition = TOTAL_BALANCE, totalBalance = ₹8000
WHEN the adjustment is saved
THEN remainingBalance = 8000
AND the adjustment will generate applications until remainingBalance reaches 0
```

### E2E-04: Approve adjustment during weekly review

```
GIVEN "EMP-001" has a pending deduction of ₹500 for the current payroll week
WHEN the user approves the adjustment during payroll generation review
THEN the application's approvalStatus = APPROVED
AND ₹500 is deducted from the employee's net payable
```

### E2E-05: Skip adjustment during weekly review

```
GIVEN "EMP-002" has a pending recurring addition of ₹1000 for the current payroll week
WHEN the user skips the adjustment during payroll generation review
THEN the application's approvalStatus = SKIPPED
AND ₹1000 is NOT added to the employee's payroll
AND a new PENDING application is created for the next payroll week
AND the adjustment's skippedCarryForwardCount increments by 1
```

### E2E-06: Recurring deduction with balance auto-completes

```
GIVEN a recurring deduction for "EMP-003" has remainingBalance = ₹1500 and amount per week = ₹2000
WHEN the user approves it for the current week
THEN the applied amount is ₹1500 (the remaining balance, not the full ₹2000)
AND the remainingBalance becomes 0
AND the adjustment status is set to "COMPLETED"
```

### E2E-07: View all adjustments for an employee

```
GIVEN "EMP-001" has 3 active adjustments and 2 completed adjustments
WHEN the user navigates to "EMP-001"'s adjustments
THEN all 5 adjustments are shown with their status, type, and amounts
```
