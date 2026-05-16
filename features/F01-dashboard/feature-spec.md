# F01 — Dashboard

> **Status: ✅ DONE**

## Goal

Provide the Payroll Owner with a single landing page that surfaces key operational totals and alerts so they can immediately identify what needs attention without navigating to individual workflows.

## Scope

- Display quick-stat cards for core operational metrics.
- Each card navigates to the relevant workflow screen when clicked.
- Phase 1 cards only — document-related cards are deferred to Phase 2.

## Dashboard Cards (Phase 1)

| Card | Metric | Links To |
|---|---|---|
| Active Employees | Count of employees where `isActive = true` | Employee Management list |
| Latest Payroll Total | `totalNetPayable` of the most recently approved payroll run (₹ INR) | Payroll Generation for that week |
| Pending Attendance Errors | Count of active attendance uploads with unresolved blocking errors | Attendance Upload review |
| Pending Adjustment Approvals | Count of adjustment applications with `approvalStatus = PENDING` for the upcoming payroll week | Payroll Adjustments review |

## Dashboard Cards (Phase 2 — deferred)

- Expired employee documents count.
- Documents nearing expiry within 7 days count.

---

## E2E Behavior Tests

### E2E-01: Dashboard loads with correct totals

```
GIVEN the database contains 12 active employees, 3 inactive employees
AND the latest approved payroll run has totalNetPayable = ₹145,230.50
AND there are 0 attendance uploads with blocking errors
AND there are 2 pending adjustment approvals
WHEN the user navigates to the Dashboard
THEN the "Active Employees" card shows "12"
AND the "Latest Payroll Total" card shows "₹1,45,230.50"
AND the "Pending Attendance Errors" card shows "0"
AND the "Pending Adjustment Approvals" card shows "2"
```

### E2E-02: Dashboard shows zero-state when no data exists

```
GIVEN the database has no employees, no payroll runs, no attendance uploads, no adjustments
WHEN the user navigates to the Dashboard
THEN the "Active Employees" card shows "0"
AND the "Latest Payroll Total" card shows "₹0.00"
AND the "Pending Attendance Errors" card shows "0"
AND the "Pending Adjustment Approvals" card shows "0"
```

### E2E-03: Dashboard card navigates to the correct workflow

```
GIVEN the user is on the Dashboard
WHEN the user clicks the "Active Employees" card
THEN the app navigates to the Employee Management list page
```

```
GIVEN the user is on the Dashboard
WHEN the user clicks the "Pending Attendance Errors" card
THEN the app navigates to the Attendance Upload review page
```

### E2E-04: Dashboard reflects real-time data changes

```
GIVEN the "Active Employees" card shows "12"
WHEN the user deactivates an employee via Employee Management
AND the user returns to the Dashboard
THEN the "Active Employees" card shows "11"
```

### E2E-05: Latest payroll total updates after payroll approval

```
GIVEN no payroll runs exist and the "Latest Payroll Total" card shows "₹0.00"
WHEN the user completes and approves a payroll run with totalNetPayable = ₹98,500.00
AND the user navigates back to the Dashboard
THEN the "Latest Payroll Total" card shows "₹98,500.00"
```
