# E03 — Shortened Employee IDs

> **Status: ✅ IMPLEMENTED**
> **Parent Feature:** F02 — Employee Management

## Goal

Transition all employee IDs across the system from a 15-character format (e.g. `TPLGOAHLP002007`) to a more concise 12-character format (e.g. `TPLGOAHLP007`). This modification removes the redundant middle 3 digits, improving readability and data density while preserving the alphabetical prefix and uniqueness constraints.

## Motivation

Previously, employee IDs had a 15-character format that included a redundant middle sequence (such as `002` in `TPLGOAHLP002007`). This redundant sequence added visual clutter in lists, pay slips, and dashboards. Shortening the IDs to 12 characters by retaining the alphabetical prefix and the last 3 digits makes the IDs cleaner, more readable, and easier to manage.

## Scope

### In Scope

- Database updates shortening existing 15-character employee IDs matching `TPLGOA%` to 12 characters.
- Preserving the `@unique` constraint on the `employeeId` field in the `Employee` model.
- Validation patterns for new employee creation allowing 12-character IDs.
- Consistency of shortened IDs across all lists, directories, and profiles in the UI.

### Out of Scope

- Modifying the prefix string (e.g., `TPLGOAHLP` remains intact).
- Auto-generating employee IDs (they remain manually specified on creation).

## Affected Files (Implementation Reference)

| File | Change |
|---|---|
| `prisma/schema.prisma` | Model definition of `Employee` uses `@unique` on `employeeId` |
| `src/features/employee-management/types/employee.types.ts` | `CreateEmployeeSchema` validation for `employeeId` |
| `src/features/employee-management/services/employee.service.ts` | Service methods use the shortened format |

---

## E2E Behavior Tests

### E2E-E03-01: View shortened employee IDs in directory

```
GIVEN the database has an employee with ID "TPLGOAHLP007"
WHEN the Payroll Owner navigates to the Team Directory
THEN the employee list displays ID "TPLGOAHLP007" instead of "TPLGOAHLP002007"
```

### E2E-E03-02: Create new employee with 12-character ID

```
GIVEN the user is on the Add New Employee form
WHEN the user enters "TPLGOAHLP008" in the Employee ID field
AND fills out other required fields
AND clicks Create Employee
THEN the employee is successfully created with ID "TPLGOAHLP008"
AND is redirected to the profile view showing the shortened ID
```
