# F09 — Payroll History

> **Status: ✅ DONE**

## Goal

Allow the Payroll Owner to look up historical payroll data by employee and payroll week — displaying stored calculations in the app without generating downloadable reports.

## Scope

- Search payroll history by employee name/ID and payroll week.
- Display stored payroll data: attendance, hours, pay, adjustments, totals.
- Show revision history for each payroll run.
- View payroll history from the main history page or from an employee's profile.
- No downloadable PDFs or ZIPs from history (out of scope for initial version).

## PRD References

- Section 9.10: Retrieve Payroll History (workflow)
- Section 4.3: Out of Scope — historical downloads

---

## E2E Behavior Tests

### E2E-01: Search payroll history by employee

```
GIVEN employee "EMP-001" (Ravi Kumar) has payroll records for 8 weeks
WHEN the user searches for "Ravi Kumar" on the Payroll History page
THEN the results show 8 payroll week entries for "Ravi Kumar"
AND each entry shows: week dates, regular hours, OT hours, regular pay, OT pay, deductions, additions, gross pay, net payable
```

### E2E-02: Search payroll history by payroll week

```
GIVEN the payroll week March 6-12 has payroll data for 15 employees
WHEN the user selects the March 6-12 week filter on the Payroll History page
THEN the results show payroll records for all 15 employees for that week
```

### E2E-03: Combined search — employee + week

```
GIVEN the user searches for "EMP-001" and selects week March 6-12
THEN the result shows the payroll record for EMP-001 for March 6-12
AND the record includes: attendance per day, regular hours, OT hours, regular pay, OT pay, deductions, additions, gross pay, net payable
```

### E2E-04: No historical downloads available

```
GIVEN the user is viewing payroll history for March 6-12
THEN there are no "Download PDF" or "Download ZIP" buttons
AND the app displays data in-app only
```

### E2E-05: History shows latest revision data

```
GIVEN the March 6-12 payroll has 2 revisions (revision 2 is current)
WHEN the user views history for March 6-12
THEN the displayed data reflects revision 2's values
AND a note shows "Revision 2 (Current)" with a link to revision history
```

### E2E-06: Access history from employee profile

```
GIVEN the user is on the employee profile for "EMP-001"
WHEN the user clicks "Payroll History"
THEN the history page opens pre-filtered for "EMP-001"
```
