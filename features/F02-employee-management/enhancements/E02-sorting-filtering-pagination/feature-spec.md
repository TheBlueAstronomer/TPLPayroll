# E02 — Sorting, Filtering & Pagination Enhancements

> **Status:** PLANNED
> **Parent Feature:** F02 — Employee Management
> **Affected Component:** `EmployeeListTable.tsx`
> **Affected Service:** `employee.service.ts` → `getEmployeeList`
> **Affected Types:** `employee.types.ts` → `EmployeeListOptions`
> **Affected Actions:** `employee.actions.ts` → `getEmployeeListAction`

---

## Goal

Improve the Team Directory screen so users can (1) sort by any visible column, (2) filter by the categorical fields Designation and Site, and (3) navigate to any page when the total page count exceeds 5.

---

## Enhancement 1 — Column Sorting

### Description

Every column header in the employee table (ID, Name, Designation, Site, Status) becomes a clickable sort control. Clicking a header sorts the data by that field. Clicking the same header again toggles between ascending and descending order. The currently active sort column and direction are visually indicated.

### Current Behaviour

The service hardcodes `orderBy: { employeeName: 'asc' }`. There is no UI control for sort direction or column selection.

### Proposed Behaviour

| Aspect | Detail |
|---|---|
| Default sort | `employeeName` ascending (unchanged from current) |
| Clickable columns | `employeeId`, `employeeName`, `designation`, `site`, `status` |
| Toggle cycle | Click once → ascending. Click same column again → descending. Click a different column → ascending on that column. |
| Sort indicator | A caret icon (up or down) appears next to the active column header text. Inactive columns show no indicator. |
| Server-side | Sorting is delegated to the database via Prisma `orderBy`. No client-side reordering. |

### Behavioural Acceptance Criteria

```
AC-1.1
GIVEN the user is viewing the Team Directory with default sort (Name ascending)
WHEN the user clicks the "ID" column header
THEN the table re-fetches data sorted by Employee ID ascending
AND the ID column header shows an upward caret indicator
AND the Name column header no longer shows a sort indicator

AC-1.2
GIVEN the table is sorted by Employee ID ascending
WHEN the user clicks the "ID" column header again
THEN the table re-fetches data sorted by Employee ID descending
AND the ID column header shows a downward caret indicator

AC-1.3
GIVEN the table is sorted by Employee ID descending
WHEN the user clicks the "Name" column header
THEN the table re-fetches data sorted by Name ascending
AND the Name column header shows an upward caret indicator
AND the ID column header no longer shows a sort indicator

AC-1.4
GIVEN the user has applied sorting by Designation descending
WHEN the user navigates to page 2
THEN the table data on page 2 respects the Designation descending sort order

AC-1.5
GIVEN the user changes the sort column
THEN the current page resets to 1
AND selections are cleared

AC-1.6 — Status sort mapping
GIVEN the user clicks the "Status" column header
THEN the sort is applied using the computed status field
AND employees are ordered as ACTIVE → INACTIVE → RESIGNED (ascending)
OR RESIGNED → INACTIVE → ACTIVE (descending)
```

---

## Enhancement 2 — Designation & Site Filters

### Description

Add two additional filter dropdowns alongside the existing Status filter, allowing the user to filter the employee list by Designation and by Site. Each dropdown is populated dynamically from the distinct values in the database.

### Current Behaviour

Only a Status filter (`<select>`) exists. There is no mechanism to filter by Designation or Site.

### Proposed Behaviour

| Aspect | Detail |
|---|---|
| New controls | Two `<select>` dropdowns: "Designation" and "Site", placed in the filter bar between Search and the existing Status filter. |
| Default value | "All Designations" / "All Sites" (no filter applied). |
| Options source | Populated dynamically from distinct non-null values in the Employee table (`SELECT DISTINCT designation`, `SELECT DISTINCT site`). |
| Multi-filter stacking | Designation, Site, Status, and Search can all be active simultaneously. They combine with AND logic. |
| Server-side | Filtering is delegated to the database via Prisma `where`. No client-side filtering. |

### Behavioural Acceptance Criteria

```
AC-2.1
GIVEN the user is viewing the Team Directory
WHEN the page loads
THEN a "Designation" dropdown appears with "All Designations" selected by default
AND a "Site" dropdown appears with "All Sites" selected by default
AND both dropdowns are populated with the distinct values from the database

AC-2.2
GIVEN 40 employees exist with designations Guard, Supervisor, Manager
WHEN the user selects "Supervisor" from the Designation filter
THEN only employees with designation "Supervisor" are shown
AND the pagination count reflects the filtered total
AND the page resets to 1

AC-2.3
GIVEN the user has "Supervisor" selected in Designation and "North Gate" selected in Site
THEN only employees matching BOTH Supervisor AND North Gate are shown

AC-2.4
GIVEN the user has Designation filtered to "Guard" and types "Ravi" in the search box
THEN only employees matching designation "Guard" AND name/ID containing "Ravi" are shown

AC-2.5
GIVEN the user selects "Guard" from the Designation filter
WHEN the user changes it back to "All Designations"
THEN the full unfiltered list (respecting other active filters) is restored

AC-2.6
GIVEN no employees have a site value (all sites are null)
THEN the Site dropdown shows only "All Sites" (no other options)

AC-2.7
GIVEN the user changes a filter
THEN current row selections are cleared
```

---

## Enhancement 3 — Dynamic Pagination

### Description

Fix the pagination controls so they dynamically display the correct page numbers based on the total number of pages, instead of always showing a static range of 1-5.

### Current Behaviour (Bug)

The pagination renders `Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)`. This means:
- Only pages 1 through 5 are ever shown as numbered buttons.
- When the current page is 6 or higher (reached via the Next button), the numbered buttons still show 1, 2, 3, 4, 5.
- The user has no way to jump to a specific page beyond 5.

### Proposed Behaviour — Sliding Window Pagination

The numbered page buttons should use a **sliding window** algorithm centered on the current page:

| Scenario | Visible pages |
|---|---|
| Total pages <= 7 | Show all pages: 1, 2, ... N |
| Current page near start (<= 4) | 1, 2, 3, 4, 5, ..., N |
| Current page near end (>= N-3) | 1, ..., N-4, N-3, N-2, N-1, N |
| Current page in the middle | 1, ..., P-1, P, P+1, ..., N |

Where `...` is rendered as a non-clickable ellipsis. `P` is the current page. `N` is the total page count. The first page (1) and last page (N) are always visible.

### Behavioural Acceptance Criteria

```
AC-3.1
GIVEN 80 employees exist with PAGE_SIZE = 10 (8 total pages)
WHEN the user is on page 1
THEN the pagination shows: [<] 1 2 3 4 5 ... 8 [>]
AND page 1 is highlighted as active

AC-3.2
GIVEN 8 total pages and the user is on page 4
THEN the pagination shows: [<] 1 ... 3 4 5 ... 8 [>]
AND page 4 is highlighted as active

AC-3.3
GIVEN 8 total pages and the user is on page 8
THEN the pagination shows: [<] 1 ... 4 5 6 7 8 [>]
AND page 8 is highlighted as active
AND the [>] (Next) button is disabled

AC-3.4
GIVEN 3 total pages
THEN the pagination shows: [<] 1 2 3 [>]
(No ellipsis, all pages visible)

AC-3.5
GIVEN the user clicks page 5 in the pagination
THEN the table re-fetches data for page 5
AND the sliding window re-centers around page 5

AC-3.6
GIVEN the user clicks the ellipsis "..."
THEN nothing happens (the ellipsis is not interactive)

AC-3.7
GIVEN 1 total page
THEN the Previous and Next buttons are both disabled
AND only page "1" is shown as a button
```

---

## Out of Scope

- Client-side sorting or filtering (all operations remain server-side)
- Configurable page sizes (PAGE_SIZE remains 10)
- Multi-column sort
- Persisting filter/sort state to URL query params (can be a future enhancement)
- Changes to the employee profile or form views

---

## Technical Notes

### Service Layer Changes

- `EmployeeListOptions` must be extended with `sortBy`, `sortOrder`, `designation`, and `site` fields.
- `buildWhereClause` must be extended to support Designation and Site filtering.
- `getEmployeeList` must accept dynamic `orderBy` from the options.
- A new service function `getDistinctFilterValues()` (or similar) is needed to populate the Designation and Site dropdowns.

### Component Changes

- `EmployeeListTable.tsx` gains new state: `sortBy`, `sortOrder`, `designation`, `site`.
- Filter bar adds two new `<select>` dropdowns.
- Column headers become clickable with sort indicator icons.
- Pagination section is rewritten with the sliding window algorithm.

### Status Sort

The `status` field is computed (not stored in the database). Sorting by status requires either:
- A Prisma `orderBy` using a raw SQL `CASE WHEN` expression, or
- Mapping status to the underlying fields (`dateOfResignation`, `isActive`) for ordering.

The recommended approach is to use Prisma `orderBy` on `isActive` and `dateOfResignation` fields to approximate status ordering.
