# F09 — Payroll History: User Stories

> **Status: ✅ DONE** — All 4 user stories fully implemented.

---

## US-09.1: Search payroll history by employee ✅

**As a** Payroll Owner
**I want to** search payroll history by employee name or ID
**So that** I can find past payroll records for a specific employee.

### Acceptance Criteria

- AC1: Search by partial employee name (case-insensitive).
- AC2: Search by partial employee ID.
- AC3: Results show all payroll weeks for the matched employee.
- AC4: Each result row shows: week dates, regular hours, OT hours, gross pay, net payable.

### Unit Tests

```
TEST: searchPayrollHistory by employee name
  GIVEN "Ravi Kumar" has records for 8 weeks
  WHEN searchPayrollHistory(employeeName="Ravi") is called
  THEN it returns 8 records

TEST: searchPayrollHistory by employee ID
  GIVEN "EMP-001" has records for 8 weeks
  WHEN searchPayrollHistory(employeeId="EMP-001") is called
  THEN it returns 8 records

TEST: searchPayrollHistory returns empty for unknown employee
  WHEN searchPayrollHistory(employeeName="Nobody") is called
  THEN it returns empty array
```

---

## US-09.2: Search payroll history by payroll week ✅

**As a** Payroll Owner
**I want to** select a payroll week to see all employee records for that week
**So that** I can review a specific week's payroll.

### Acceptance Criteria

- AC1: A week selector lists all weeks that have approved payroll runs.
- AC2: Selecting a week shows all employees' payroll data for that week.
- AC3: The data comes from the current (latest approved) revision.

### Unit Tests

```
TEST: getPayrollHistoryByWeek returns all employees for the week
  GIVEN March 6-12 has 15 employees
  WHEN getPayrollHistoryByWeek("2025-03-06", "2025-03-12") is called
  THEN it returns 15 records

TEST: getPayrollHistoryByWeek uses current revision
  GIVEN March 6-12 has revision 1 (superseded) and revision 2 (current)
  WHEN getPayrollHistoryByWeek() is called
  THEN the data reflects revision 2's values
```

---

## US-09.3: View detailed payroll record ✅

**As a** Payroll Owner
**I want to** view the detailed payroll record for a specific employee and week
**So that** I can see the full attendance breakdown and calculation.

### Acceptance Criteria

- AC1: Shows: attendance per day (date, regular hours, OT hours), total regular hours, total OT hours, regular pay, overtime pay, deductions (itemized), additions (itemized), gross pay, net payable.
- AC2: Shows which revision the data is from.
- AC3: All amounts in ₹ INR with paise.

### Unit Tests

```
TEST: getPayrollRecordDetail returns full breakdown
  GIVEN EMP-001 for week March 6-12
  WHEN getPayrollRecordDetail(employeeId, weekStart, weekEnd) is called
  THEN it returns daily attendance records, totals, and net payable

TEST: getPayrollRecordDetail includes itemized adjustments
  GIVEN EMP-001 has 2 approved adjustments for the week
  WHEN getPayrollRecordDetail() is called
  THEN the result includes 2 adjustment entries with type, amount, and reason
```

---

## US-09.4: Access history from employee profile ✅

**As a** Payroll Owner
**I want to** navigate to payroll history from an employee's profile
**So that** I can quickly see that employee's past payroll without manual searching.

### Acceptance Criteria

- AC1: The employee profile page has a "Payroll History" link/button.
- AC2: Clicking it navigates to `/history?employeeId=<id>`.
- AC3: The history page opens pre-filtered for that employee.

### Unit Tests

```
TEST: PayrollHistoryLink generates correct URL
  GIVEN employeeId = "abc-123"
  WHEN PayrollHistoryLink is rendered
  THEN it links to "/history?employeeId=abc-123"
```
