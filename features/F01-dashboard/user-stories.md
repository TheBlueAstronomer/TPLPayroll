# F01 — Dashboard: User Stories

---

## US-01.1: View active employee count

**As a** Payroll Owner
**I want to** see the current number of active employees on the Dashboard
**So that** I know the size of the active workforce at a glance.

### Acceptance Criteria

- AC1: The card displays the count of employees where `isActive = true`.
- AC2: Inactive and resigned employees are excluded from this count.
- AC3: The count is fetched fresh on each Dashboard load.
- AC4: If there are zero active employees, the card displays "0".

### Unit Tests

```
TEST: countActiveEmployees returns correct count
  GIVEN employees table has 10 active, 3 inactive, 2 resigned
  WHEN countActiveEmployees() is called
  THEN it returns 10

TEST: countActiveEmployees returns 0 when no employees exist
  GIVEN employees table is empty
  WHEN countActiveEmployees() is called
  THEN it returns 0

TEST: countActiveEmployees excludes inactive employees
  GIVEN employees table has 5 employees all with isActive = false
  WHEN countActiveEmployees() is called
  THEN it returns 0
```

---

## US-01.2: View latest payroll total

**As a** Payroll Owner
**I want to** see the net payable total from the most recent approved payroll run
**So that** I have a quick reference of the last payroll expenditure.

### Acceptance Criteria

- AC1: The card displays `totalNetPayable` from the most recently approved payroll run.
- AC2: The amount is formatted in ₹ INR with paise (e.g., "₹1,45,230.50").
- AC3: If no approved payroll run exists, the card displays "₹0.00".
- AC4: The value reflects the current revision's total (where `isCurrent = true`).

### Unit Tests

```
TEST: getLatestPayrollTotal returns the most recent approved run total
  GIVEN two approved payroll runs exist — run A (₹80,000.00, older) and run B (₹95,000.50, newer)
  WHEN getLatestPayrollTotal() is called
  THEN it returns 95000.50

TEST: getLatestPayrollTotal returns 0 when no approved runs exist
  GIVEN no payroll runs with status "APPROVED" exist
  WHEN getLatestPayrollTotal() is called
  THEN it returns 0

TEST: getLatestPayrollTotal uses the current revision total
  GIVEN a payroll run has two revisions — revision 1 (₹80,000) and revision 2 (₹85,000, isCurrent = true)
  WHEN getLatestPayrollTotal() is called
  THEN it returns 85000
```

---

## US-01.3: View pending attendance errors

**As a** Payroll Owner
**I want to** see how many attendance uploads have unresolved blocking errors
**So that** I know if I need to fix attendance issues before generating payroll.

### Acceptance Criteria

- AC1: The card counts active attendance uploads where blocking errors exist (unmatched employees, inactive employees, resigned-before-week employees, invalid data).
- AC2: Uploads with only non-blocking issues (blank hour cells converted to 0) are excluded from this count.
- AC3: If there are no active uploads with blocking errors, the card displays "0".

### Unit Tests

```
TEST: countPendingAttendanceErrors returns count of uploads with blocking errors
  GIVEN 3 active attendance uploads exist — 1 has unmatched employees, 1 has all matches, 1 has invalid hours
  WHEN countPendingAttendanceErrors() is called
  THEN it returns 2

TEST: countPendingAttendanceErrors returns 0 when all uploads are clean
  GIVEN 2 active attendance uploads exist with no blocking errors
  WHEN countPendingAttendanceErrors() is called
  THEN it returns 0
```

---

## US-01.4: View pending adjustment approvals

**As a** Payroll Owner
**I want to** see how many payroll adjustments await weekly approval
**So that** I can prepare for the next payroll review.

### Acceptance Criteria

- AC1: The card counts `PayrollAdjustmentApplication` records with `approvalStatus = PENDING` for the current or upcoming payroll week.
- AC2: If no pending approvals exist, the card displays "0".

### Unit Tests

```
TEST: countPendingAdjustmentApprovals returns correct count
  GIVEN 5 adjustment applications with approvalStatus PENDING, 3 with APPROVED
  WHEN countPendingAdjustmentApprovals() is called
  THEN it returns 5

TEST: countPendingAdjustmentApprovals returns 0 when none pending
  GIVEN no adjustment applications with approvalStatus PENDING
  WHEN countPendingAdjustmentApprovals() is called
  THEN it returns 0
```

---

## US-01.5: Navigate from Dashboard card to relevant workflow

**As a** Payroll Owner
**I want to** click a Dashboard card and be taken to the relevant page
**So that** I can immediately act on what needs attention.

### Acceptance Criteria

- AC1: Clicking "Active Employees" navigates to `/employees`.
- AC2: Clicking "Latest Payroll Total" navigates to `/payroll` with the relevant week pre-selected.
- AC3: Clicking "Pending Attendance Errors" navigates to `/attendance`.
- AC4: Clicking "Pending Adjustment Approvals" navigates to `/adjustments`.
- AC5: Each card shows a hover effect indicating it is clickable.

### Unit Tests

```
TEST: DashboardCard renders as a clickable link
  GIVEN a DashboardCard with href="/employees"
  WHEN the component renders
  THEN it renders an anchor or Next.js Link with href="/employees"

TEST: DashboardCard applies hover styling
  GIVEN a DashboardCard component
  WHEN the user hovers over it
  THEN the card shows a visual hover state (e.g., shadow or scale)
```
