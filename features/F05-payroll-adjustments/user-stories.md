# F05 — Payroll Adjustments: User Stories

> **Status: ✅ DONE** — All 6 user stories fully implemented.

---

## US-05.1: Create a one-time adjustment ✅

**As a** Payroll Owner
**I want to** create a one-time deduction or addition for an employee for a specific payroll week
**So that** a single payroll event (e.g., advance, bonus) is reflected in that week's payroll.

### Acceptance Criteria

- AC1: User selects employee, adjustment type (Deduction/Addition), amount, reason, and payroll week.
- AC2: Amount supports decimal values (e.g., ₹1,250.75).
- AC3: Reason is required; form shows validation error if left blank.
- AC4: A PayrollAdjustment record is created with recurrenceType = "ONE_TIME".
- AC5: A PayrollAdjustmentApplication is created for the selected week with approvalStatus = "PENDING".

### Unit Tests

```
TEST: createOneTimeAdjustment creates adjustment and application
  GIVEN valid adjustment data for EMP-001, type=DEDUCTION, amount=500, week=March 6-12
  WHEN createAdjustment() is called
  THEN a PayrollAdjustment record is created with recurrenceType = "ONE_TIME"
  AND a PayrollAdjustmentApplication is created with approvalStatus = "PENDING"

TEST: createOneTimeAdjustment rejects missing reason
  GIVEN adjustment data with reason = ""
  WHEN createAdjustment() is called
  THEN it throws validation error "REASON_REQUIRED"

TEST: createOneTimeAdjustment accepts decimal amounts
  GIVEN adjustment data with amount = 1250.75
  WHEN createAdjustment() is called
  THEN the adjustment is saved with amount = 1250.75
```

---

## US-05.2: Create a recurring adjustment ✅

**As a** Payroll Owner
**I want to** create a recurring deduction or addition with a specific end condition
**So that** repeated payroll events are automatically tracked across weeks.

### Acceptance Criteria

- AC1: User selects recurrence end type: "Until end week", "Fixed number of weeks", or "Until total balance depleted".
- AC2: For "Until end week": user selects an end payroll week.
- AC3: For "Fixed number of weeks": user enters the total number of weeks.
- AC4: For "Until total balance depleted": user enters the total balance amount.
- AC5: A PayrollAdjustment record is created with recurrenceType = "RECURRING" and the appropriate end fields.
- AC6: The first PayrollAdjustmentApplication is created for the start payroll week.

### Unit Tests

```
TEST: createRecurringAdjustment with end week
  GIVEN type=RECURRING, endType=END_WEEK, endWeekStart="2025-04-03"
  WHEN createAdjustment() is called
  THEN recurrenceEndType = "END_WEEK"
  AND endPayrollWeekStartDate = "2025-04-03"

TEST: createRecurringAdjustment with fixed weeks
  GIVEN type=RECURRING, endType=FIXED_WEEKS, totalWeeks=4
  WHEN createAdjustment() is called
  THEN recurrenceEndType = "FIXED_WEEKS"
  AND totalRecurrenceWeeks = 4

TEST: createRecurringAdjustment with total balance
  GIVEN type=RECURRING, endType=TOTAL_BALANCE, totalBalance=8000
  WHEN createAdjustment() is called
  THEN recurrenceEndType = "TOTAL_BALANCE"
  AND totalBalance = 8000 AND remainingBalance = 8000
```

---

## US-05.3: View adjustments list ✅

**As a** Payroll Owner
**I want to** see all adjustments across all employees
**So that** I have a central view of all active and completed payroll adjustments.

### Acceptance Criteria

- AC1: The list shows: Employee Name, Type (Deduction/Addition), Amount, Recurrence Type, Status, Start Week.
- AC2: The list can be filtered by status (Active, Completed, Cancelled) and by type (Deduction, Addition).
- AC3: The list can be searched by employee name.
- AC4: Each row links to the adjustment detail.

### Unit Tests

```
TEST: getAdjustmentsList returns all adjustments
  GIVEN 10 adjustments exist
  WHEN getAdjustmentsList() is called
  THEN it returns 10 adjustments

TEST: getAdjustmentsList filters by status
  GIVEN 7 active, 3 completed adjustments
  WHEN getAdjustmentsList(status="ACTIVE") is called
  THEN it returns 7 adjustments

TEST: getAdjustmentsList filters by type
  GIVEN 6 deductions, 4 additions
  WHEN getAdjustmentsList(type="DEDUCTION") is called
  THEN it returns 6 adjustments
```

---

## US-05.4: Approve adjustment during weekly review ✅

**As a** Payroll Owner
**I want to** approve a pending adjustment so it is applied to the current week's payroll
**So that** the deduction or addition is included in the payroll calculation.

### Acceptance Criteria

- AC1: The approval screen is part of the payroll generation workflow (F06).
- AC2: Approving sets approvalStatus = "APPROVED" and appliedAt = now.
- AC3: Approved deductions reduce the employee's net payable.
- AC4: Approved additions increase the employee's net payable.
- AC5: For balance-based recurring adjustments, the applied amount is min(amount, remainingBalance).
- AC6: After approval, remainingBalance is decremented by the applied amount.
- AC7: If remainingBalance reaches 0, the adjustment status is set to "COMPLETED".

### Unit Tests

```
TEST: approveAdjustmentApplication sets status and timestamp
  GIVEN a PENDING application for EMP-001
  WHEN approveAdjustmentApplication() is called
  THEN approvalStatus = "APPROVED" AND appliedAt is set

TEST: approveAdjustmentApplication with balance caps at remaining
  GIVEN adjustment amount = 2000, remainingBalance = 1500
  WHEN approveAdjustmentApplication() is called
  THEN appliedAmount = 1500

TEST: approveAdjustmentApplication completes exhausted balance
  GIVEN adjustment amount = 2000, remainingBalance = 1500
  WHEN approveAdjustmentApplication() is called
  THEN remainingBalance = 0 AND adjustment status = "COMPLETED"
```

---

## US-05.5: Skip adjustment during weekly review ✅

**As a** Payroll Owner
**I want to** skip a pending adjustment so it carries forward to the next week
**So that** I have flexibility in when adjustments are applied.

### Acceptance Criteria

- AC1: Skipping sets approvalStatus = "SKIPPED" and skippedAt = now.
- AC2: The adjustment is NOT applied to the current week's payroll.
- AC3: A new PENDING PayrollAdjustmentApplication is created for the next payroll week (based on the configured payroll week start day).
- AC4: The adjustment's skippedCarryForwardCount increments by 1.
- AC5: One-time adjustments can also be skipped (they carry forward once).

### Unit Tests

```
TEST: skipAdjustmentApplication sets status and creates next application
  GIVEN a PENDING application for week March 6-12
  WHEN skipAdjustmentApplication() is called
  THEN approvalStatus = "SKIPPED"
  AND a new PENDING application is created for the next payroll week
  AND skippedCarryForwardCount increments by 1

TEST: skipAdjustmentApplication carries forward one-time adjustment
  GIVEN a ONE_TIME adjustment PENDING for March 6-12
  WHEN skipAdjustmentApplication() is called
  THEN a new PENDING application is created for March 13-19
```

---

## US-05.6: View adjustment detail ✅

**As a** Payroll Owner
**I want to** view the full history of a specific adjustment
**So that** I can track how the adjustment has been applied across weeks.

### Acceptance Criteria

- AC1: Shows adjustment metadata: employee, type, amount, reason, recurrence type, start week, end condition.
- AC2: Shows a timeline of all PayrollAdjustmentApplication entries for this adjustment.
- AC3: Each application entry shows: week, applied amount, status (PENDING/APPROVED/SKIPPED), timestamp.
- AC4: For balance-based adjustments, shows total balance and remaining balance.

### Unit Tests

```
TEST: getAdjustmentDetail returns full adjustment with applications
  GIVEN adjustment ID = "adj-1" with 4 application entries
  WHEN getAdjustmentDetail("adj-1") is called
  THEN it returns the adjustment with 4 application entries
```
