# E02 — User Stories (TDD Vertical Slices)

> **Methodology:** Test-Driven Development — Red/Green/Refactor
> **Workflow:** Each story is a vertical slice. Write ONE test, make it pass, repeat.
> **Test philosophy:** Tests verify behavior through public interfaces, not implementation details.

---

## Story Map Overview

```
Enhancement 1: Column Sorting
  US-E02.1  Service accepts sortBy/sortOrder and returns sorted data
  US-E02.2  Status sort maps computed status to database fields
  US-E02.3  Sort column headers with visual indicators (UI)
  US-E02.4  Sort resets page to 1 and clears selections

Enhancement 2: Designation & Site Filters
  US-E02.5  Service returns distinct designation values
  US-E02.6  Service returns distinct site values
  US-E02.7  Service filters by designation
  US-E02.8  Service filters by site
  US-E02.9  Filters stack with existing search and status filters
  US-E02.10 Filter dropdowns render and dispatch (UI)

Enhancement 3: Dynamic Pagination
  US-E02.11 Sliding window algorithm produces correct page ranges
  US-E02.12 Pagination component renders dynamic page buttons (UI)
```

---

## Enhancement 1 — Column Sorting

### US-E02.1: Service accepts sortBy and sortOrder

**As** a developer,
**I want** `getEmployeeList` to accept `sortBy` and `sortOrder` parameters,
**So that** the database returns employees in the requested order.

**Tracer bullet test:**
```
RED:  "getEmployeeList sorts by employeeId ascending when sortBy=employeeId, sortOrder=asc"
      Call getEmployeeList({ sortBy: 'employeeId', sortOrder: 'asc' })
      Assert Prisma findMany was called with orderBy: { employeeId: 'asc' }
GREEN: Extend EmployeeListOptions type, update getEmployeeList to use dynamic orderBy.
```

**Incremental tests:**
```
RED→GREEN: "sorts by designation descending"
           Call getEmployeeList({ sortBy: 'designation', sortOrder: 'desc' })
           Assert orderBy: { designation: 'desc' }

RED→GREEN: "defaults to employeeName ascending when no sort specified"
           Call getEmployeeList({})
           Assert orderBy: { employeeName: 'asc' }

RED→GREEN: "sorts by site ascending"
           Call getEmployeeList({ sortBy: 'site', sortOrder: 'asc' })
           Assert orderBy: { site: 'asc' }
```

**Refactor:** Extract sort field mapping into a constant or validation set.

**Interface changes:**
- `EmployeeListOptions` gains `sortBy?: SortableField` and `sortOrder?: 'asc' | 'desc'`
- New type: `SortableField = 'employeeId' | 'employeeName' | 'designation' | 'site' | 'status'`

---

### US-E02.2: Status sort maps to database fields

**As** a developer,
**I want** sorting by `status` to map to Prisma-compatible orderBy,
**So that** the computed status field is sortable even though it isn't a stored column.

**Tracer bullet test:**
```
RED:  "sorts by status ascending: ACTIVE before INACTIVE before RESIGNED"
      Call getEmployeeList({ sortBy: 'status', sortOrder: 'asc' })
      Assert Prisma findMany was called with orderBy combining
      dateOfResignation and isActive fields (or raw SQL CASE).
GREEN: Implement status-to-field mapping in getEmployeeList.
```

**Incremental tests:**
```
RED→GREEN: "sorts by status descending: RESIGNED before INACTIVE before ACTIVE"
           Call getEmployeeList({ sortBy: 'status', sortOrder: 'desc' })
           Assert inverse orderBy from the ascending case.
```

**Technical note:** Status is derived from `dateOfResignation` (not null → RESIGNED) and `isActive` (false → INACTIVE, true → ACTIVE). The sort mapping should use a multi-field `orderBy`:
- Ascending: `[{ dateOfResignation: 'asc' }, { isActive: 'desc' }]`
- Or use `$queryRaw` with `CASE WHEN dateOfResignation IS NOT NULL THEN 2 WHEN isActive = false THEN 1 ELSE 0 END`

The exact approach should be decided during implementation based on Prisma capabilities.

---

### US-E02.3: Sort column headers with visual indicators

**As** a user,
**I want** to click table column headers to sort the data,
**So that** I can find employees faster.

**Tracer bullet test (component):**
```
RED:  "clicking the ID column header calls fetchEmployees with sortBy=employeeId, sortOrder=asc"
      Render EmployeeListTable.
      Click the "ID" header.
      Assert the server action was called with { sortBy: 'employeeId', sortOrder: 'asc' }.
GREEN: Make column headers interactive. Add onClick handlers.
       Add sortBy/sortOrder state to the component.
```

**Incremental tests:**
```
RED→GREEN: "clicking the same header twice toggles to descending"
           Click ID header once → ascending.
           Click ID header again → descending.
           Assert action called with sortOrder: 'desc'.

RED→GREEN: "active sort column shows a caret indicator"
           Set sort to employeeId/asc.
           Assert CaretUp icon is visible in the ID header.
           Assert no caret icon in other headers.

RED→GREEN: "clicking a different column resets direction to ascending"
           Set sort to employeeId/desc.
           Click Name header.
           Assert action called with sortBy: 'employeeName', sortOrder: 'asc'.
```

**Design specs (per design-taste-frontend):**
- Column header becomes a `<button>` with `cursor-pointer`
- Transition on caret icon: `transition-transform duration-200`
- Active header text uses `text-zinc-700` instead of default `text-zinc-400`
- Inactive headers keep `text-zinc-400` with a subtle hover → `text-zinc-500`
- Tactile feedback: `active:scale-[0.98]` on header click

---

### US-E02.4: Sort resets page and clears selections

**As** a user,
**I want** the page to reset to 1 when I change the sort,
**So that** I always see results from the beginning of the new sort order.

**Tracer bullet test:**
```
RED:  "changing sort column resets page to 1"
      Set page to 3. Click Designation header.
      Assert page state is 1.
      Assert fetchEmployees called with page: 1.
GREEN: Add page reset logic in the sort change handler.
```

**Incremental tests:**
```
RED→GREEN: "changing sort clears selected employee rows"
           Select 3 employees. Click a sort header.
           Assert selectedIds is empty.
```

---

## Enhancement 2 — Designation & Site Filters

### US-E02.5: Service returns distinct designation values

**As** a developer,
**I want** a service function that returns all distinct designation values,
**So that** the filter dropdown can be populated.

**Tracer bullet test:**
```
RED:  "getDistinctDesignations returns sorted unique designation strings"
      Seed DB with employees having designations: Guard, Supervisor, Guard, Manager
      Call getDistinctDesignations()
      Assert result: ['Guard', 'Manager', 'Supervisor'] (sorted, deduplicated)
GREEN: Implement getDistinctDesignations using Prisma groupBy or findMany + distinct.
```

**Interface:** `getDistinctDesignations(): Promise<string[]>`

---

### US-E02.6: Service returns distinct site values

**As** a developer,
**I want** a service function that returns all distinct site values,
**So that** the filter dropdown can be populated.

**Tracer bullet test:**
```
RED:  "getDistinctSites returns sorted unique non-null site strings"
      Seed DB with employees having sites: North Gate, South Gate, null, North Gate
      Call getDistinctSites()
      Assert result: ['North Gate', 'South Gate'] (sorted, null excluded)
GREEN: Implement getDistinctSites.
```

**Incremental tests:**
```
RED→GREEN: "returns empty array when all sites are null"
           Seed DB with employees where all sites are null.
           Assert result: []
```

**Interface:** `getDistinctSites(): Promise<string[]>`

---

### US-E02.7: Service filters by designation

**As** a developer,
**I want** `getEmployeeList` to filter by designation,
**So that** only employees matching the selected designation are returned.

**Tracer bullet test:**
```
RED:  "getEmployeeList filters by designation"
      Call getEmployeeList({ designation: 'Guard' })
      Assert Prisma where clause includes { designation: 'Guard' }
GREEN: Extend EmployeeListOptions and buildWhereClause.
```

**Interface change:** `EmployeeListOptions` gains `designation?: string`

---

### US-E02.8: Service filters by site

**As** a developer,
**I want** `getEmployeeList` to filter by site,
**So that** only employees at the selected site are returned.

**Tracer bullet test:**
```
RED:  "getEmployeeList filters by site"
      Call getEmployeeList({ site: 'North Gate' })
      Assert Prisma where clause includes { site: 'North Gate' }
GREEN: Extend EmployeeListOptions and buildWhereClause.
```

**Interface change:** `EmployeeListOptions` gains `site?: string`

---

### US-E02.9: Filters stack with AND logic

**As** a user,
**I want** all filters to work together,
**So that** I can narrow down the employee list precisely.

**Tracer bullet test:**
```
RED:  "designation + site + status + search all combine in the where clause"
      Call getEmployeeList({
        designation: 'Guard',
        site: 'North Gate',
        status: 'ACTIVE',
        search: 'Ravi'
      })
      Assert Prisma where includes all four filter conditions.
GREEN: Confirm buildWhereClause handles all fields. Likely already works if
       US-E02.7 and US-E02.8 were implemented correctly.
```

---

### US-E02.10: Filter dropdowns render and dispatch

**As** a user,
**I want** Designation and Site dropdown filters on the Team Directory page,
**So that** I can filter the employee list visually.

**Tracer bullet test (component):**
```
RED:  "renders Designation and Site dropdowns populated with distinct values"
      Mock getDistinctDesignationsAction → ['Guard', 'Supervisor']
      Mock getDistinctSitesAction → ['North Gate', 'South Gate']
      Render EmployeeListTable.
      Assert both selects are present and contain the expected options.
GREEN: Add state for designation/site. Fetch distinct values on mount.
       Render two new <select> elements in the filter bar.
```

**Incremental tests:**
```
RED→GREEN: "selecting a designation triggers re-fetch with designation filter"
           Select "Guard" from designation dropdown.
           Assert getEmployeeListAction called with { designation: 'Guard' }.

RED→GREEN: "changing designation resets page to 1"
           Set page to 2. Select a designation.
           Assert page is 1.

RED→GREEN: "selecting 'All Designations' removes the designation filter"
           Select "Guard", then select "All Designations".
           Assert getEmployeeListAction called without designation param.
```

---

## Enhancement 3 — Dynamic Pagination

### US-E02.11: Sliding window algorithm produces correct page ranges

**As** a developer,
**I want** a pure function that computes visible page numbers from current page and total pages,
**So that** the pagination component can render the correct buttons.

This is a **pure function** with no side effects — ideal for unit testing.

**Tracer bullet test:**
```
RED:  "8 total pages, current page 1 → shows [1, 2, 3, 4, 5, '...', 8]"
      Call computePageRange(1, 8)
      Assert result: [1, 2, 3, 4, 5, 'ellipsis', 8]
GREEN: Implement computePageRange function.
```

**Incremental tests:**
```
RED→GREEN: "8 total pages, current page 4 → [1, '...', 3, 4, 5, '...', 8]"

RED→GREEN: "8 total pages, current page 8 → [1, '...', 4, 5, 6, 7, 8]"

RED→GREEN: "3 total pages, current page 2 → [1, 2, 3]"

RED→GREEN: "7 total pages, current page 4 → [1, 2, 3, 4, 5, 6, 7]"

RED→GREEN: "1 total page, current page 1 → [1]"

RED→GREEN: "12 total pages, current page 6 → [1, '...', 5, 6, 7, '...', 12]"
```

**Interface:** `computePageRange(currentPage: number, totalPages: number): (number | 'ellipsis')[]`

**Location:** This should be a standalone utility extracted into its own file (e.g., `utils/computePageRange.ts`) inside the employee-management feature, so it can be tested independently.

---

### US-E02.12: Pagination component renders dynamic page buttons

**As** a user,
**I want** to see the correct page numbers in the pagination controls,
**So that** I can navigate to any page directly.

**Tracer bullet test (component):**
```
RED:  "renders sliding window page buttons for 8 pages when on page 1"
      Render EmployeeListTable with totalCount = 80 (8 pages).
      Assert page buttons show: 1, 2, 3, 4, 5, ..., 8.
GREEN: Replace the static Array.from pagination with computePageRange output.
```

**Incremental tests:**
```
RED→GREEN: "ellipsis is rendered as non-clickable span"
           Assert ellipsis elements are <span> not <button>.
           Assert they have no onClick handler.

RED→GREEN: "clicking page 5 navigates to page 5"
           Click the "5" button.
           Assert page state is 5.
           Assert fetchEmployees called with page: 5.

RED→GREEN: "page buttons update when navigating to page 4"
           Navigate to page 4.
           Assert buttons reflect the new sliding window.
```

**Design specs (per design-taste-frontend):**
- Ellipsis rendered as `<span>` with `text-zinc-300` and `cursor-default`
- Active page button: `bg-emerald-50 text-emerald-700` (unchanged)
- Page buttons: `w-8 h-8 text-sm rounded-lg font-medium` (unchanged)
- Transition: `transition-colors duration-200`

---

## Implementation Order (Recommended)

The recommended sequence follows vertical TDD slices with dependencies resolved first:

```
Phase 1 — Pagination fix (standalone, no service changes)
  1. US-E02.11  computePageRange pure function (RED→GREEN)
  2. US-E02.12  Wire into EmployeeListTable (RED→GREEN)

Phase 2 — Sorting (service then UI)
  3. US-E02.1   Service: sortBy/sortOrder (RED→GREEN)
  4. US-E02.2   Service: status sort mapping (RED→GREEN)
  5. US-E02.3   UI: clickable headers + indicators (RED→GREEN)
  6. US-E02.4   UI: sort resets page + selections (RED→GREEN)

Phase 3 — Categorical filters (service then UI)
  7. US-E02.5   Service: getDistinctDesignations (RED→GREEN)
  8. US-E02.6   Service: getDistinctSites (RED→GREEN)
  9. US-E02.7   Service: filter by designation (RED→GREEN)
  10. US-E02.8  Service: filter by site (RED→GREEN)
  11. US-E02.9  Service: verify filter stacking (RED→GREEN)
  12. US-E02.10 UI: filter dropdowns (RED→GREEN)

Phase 4 — Refactor
  Review all changes for duplication, SOLID violations, and test quality.
```

---

## TDD Checklist (Per Story)

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only (service function or rendered component)
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```
