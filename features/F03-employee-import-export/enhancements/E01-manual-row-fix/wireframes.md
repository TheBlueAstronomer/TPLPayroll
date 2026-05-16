# E01 — Manual Row Fix: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4
> **Parent Feature:** F03 — Employee Import / Export

---

## Screen E01-A: Invalid Rows Tab — Enhanced (with Fix buttons)

Replaces the original Invalid Rows table inside the Import Preview page (`/employees/import/preview`). Adds a **Fix** button per row as a new rightmost column.

### Layout

```
┌── Invalid Rows Tab ───────────────────────────────────────────────┐
│                                                                    │
│  Row  Emp ID    Name                Errors                  Fix    │
│  ───  ────────  ──────────────────  ─────────────────────  ─────  │
│                                                                    │
│   5   —         Suresh Narayanan   Missing Employee ID    [Fix ↗] │
│                                                                    │
│  12   EMP-008   —                  Missing Name            [Fix ↗] │
│                                    Invalid Salary                  │
│                                                                    │
│  19   —         —                  Missing Employee ID     [Fix ↗] │
│                                    Missing Name                    │
│                                    Missing Designation             │
│                                                                    │
│  Row#: font-mono text-xs text-zinc-400                             │
│  Emp ID dash "—": text-zinc-300 italic                             │
│  Errors: text-rose-600 text-xs, one per line                       │
│  [Fix ↗]: Button variant="outline" size="sm"                       │
│           text-xs rounded-lg border-zinc-200                       │
│           hover:border-emerald-400 hover:text-emerald-700          │
│           gap-1 with <ArrowSquareOut size={12} />                  │
│                                                                    │
│  Empty state (all rows fixed):                                     │
│  <CheckCircle size={20} className="text-emerald-400 mx-auto" />    │
│  "All invalid rows have been corrected."                           │
│  text-sm text-zinc-400 text-center py-8                            │
└────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Fix button | `Button` variant="outline" size="sm" | One per invalid row. Opens `FixInvalidRowDialog` passing `invalidRow` and `existingEmployeeIds` as props |
| Error list | Inline `<span>` per error | Each `ImportRowErrorCode` mapped to human-readable label. `text-rose-600 text-xs`. One per line |
| Empty state | Centered `<div>` | Shown when `invalidRows.length === 0` after all rows have been fixed. `CheckCircle` icon + message |

---

## Screen E01-B: Fix Invalid Row Dialog

Triggered by clicking Fix on any invalid row. Shows only the fields that failed validation for that row, with valid fields shown as read-only context.

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Dialog: rounded-2xl, max-w-md                           │
│  bg-white border border-zinc-200/60                      │
│  shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]            │
│                                                          │
│  h2: "Fix Row 12"                                    [X] │
│  text-lg font-semibold tracking-tight text-zinc-900      │
│                                                          │
│  p: "Enter the missing information to include this       │
│  row in the import."                                     │
│  text-sm text-zinc-500 leading-relaxed mb-4              │
│                                                          │
│  ┌─ Error badges ──────────────────────────────────────┐ │
│  │  flex flex-wrap gap-1.5 mb-5                         │ │
│  │  "Missing Name"  "Invalid Salary"                    │ │
│  │  Each: bg-rose-50 text-rose-700 rounded-full         │ │
│  │        text-xs px-2.5 py-0.5 font-medium             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Read-only context (valid fields from this row) ───┐  │
│  │  label: text-xs uppercase tracking-wider            │  │
│  │         text-zinc-400 mb-2                          │  │
│  │  "Already present"                                  │  │
│  │                                                     │  │
│  │  [EMP-008]  [Supervisor]  [Active]                  │  │
│  │  Each chip: bg-zinc-100 rounded px-2 py-0.5         │  │
│  │             text-sm font-mono text-zinc-600 mr-1.5  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Editable fields (only the failing ones) ──────────┐  │
│  │  space-y-4 mt-4                                     │  │
│  │                                                     │  │
│  │  Employee Name *          (if MISSING_EMPLOYEE_NAME)│  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │                                               │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │  Error: text-xs text-rose-600 mt-1                  │  │
│  │         "Employee name is required"                 │  │
│  │                                                     │  │
│  │  Salary (PHP)      (if MISSING_SALARY/INVALID_SALARY│  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │                                               │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │  Error: text-xs text-rose-600 mt-1                  │  │
│  │         "Must be a positive number"                 │  │
│  │                                                     │  │
│  │  Employee ID *     (if MISSING_EMPLOYEE_ID)         │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ EMP-                                          │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │  hint: text-xs text-zinc-400 "e.g. EMP-001"         │  │
│  │                                                     │  │
│  │  Designation *     (if MISSING_DESIGNATION)         │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │                               ▼               │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  Hourly Rate (PHP) (if MISSING/INVALID_HOURLY_RATE) │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │                                               │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  Status *    (if MISSING_ACTIVE / INVALID_ACTIVE)   │  │
│  │  ┌─ Radio group ─────────────────────────────────┐  │  │
│  │  │  ● Active    ○ Inactive                       │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  Actions: flex justify-end gap-3 pt-5                    │
│                         [Cancel]   [Apply Fix]           │
│  Cancel: variant="outline" rounded-xl                    │
│  Apply Fix: bg-emerald-600 rounded-xl active:scale-[0.98]│
│             Loading: SpinnerGap animate-spin             │
└──────────────────────────────────────────────────────────┘
```

### Field Mapping — Error Code → Form Field Shown

| Error Code | Form field |
|---|---|
| `MISSING_EMPLOYEE_ID` | Employee ID (text, required) |
| `MISSING_EMPLOYEE_NAME` | Employee Name (text, required) |
| `MISSING_DESIGNATION` | Designation (text/select, required) |
| `MISSING_SALARY` | Salary in PHP (number, required) |
| `INVALID_SALARY` | Salary in PHP (number, required) |
| `MISSING_HOURLY_RATE` | Hourly Rate in PHP (number, required) |
| `INVALID_HOURLY_RATE` | Hourly Rate in PHP (number, required) |
| `MISSING_ACTIVE` | Status (radio: Active / Inactive, required) |
| `INVALID_ACTIVE_VALUE` | Status (radio: Active / Inactive, required) |

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Dialog | `Dialog`, `DialogContent` | `rounded-2xl max-w-md`. Overlay: `bg-zinc-950/40 backdrop-blur-sm` |
| Error badges | `<span>` pills | One per error code mapped to human-readable label. `bg-rose-50 text-rose-700 rounded-full text-xs px-2.5 py-0.5` |
| Context strip | Flex chip row | Shows already-valid field values as read-only tokens. `bg-zinc-100 rounded px-2 py-0.5 text-sm font-mono text-zinc-600`. Omitted if no valid fields exist |
| Dynamic form | `react-hook-form` | Renders only the inputs whose error codes are in `invalidRow.errors`. Field list is fixed at mount |
| Inline errors | `<p>` below each `Input` | `text-xs text-rose-600 mt-1`. Shown after a failed submit attempt |
| Cancel | `Button` variant="outline" | Closes dialog; no state change |
| Apply Fix | `Button` | Calls `applyRowFix()`; on success fires `onRowFixed(validRow)` callback to `ImportPreviewClient`; on failure shows inline errors |

---

## Screen E01-C: Post-Fix State

State of the Import Preview page after one or more rows have been successfully fixed.

### Layout

```
┌── Summary Strip (updates reactively after each fix) ──────────────┐
│  Total Rows    Valid     Invalid   Duplicates  New    Updates       │
│  27            23        2         2           18     5             │
│                ↑+1       ↑-1                   ↑+1                  │
└────────────────────────────────────────────────────────────────────┘

┌── Tab bar (counts update) ────────────────────────────────────────┐
│  [Valid Rows (23)]  [Invalid Rows (2)]  [Duplicates (2)]           │
└────────────────────────────────────────────────────────────────────┘

┌── Invalid Rows Tab — remaining rows only ─────────────────────────┐
│  Row  Emp ID    Name                Errors                  Fix    │
│  ───  ────────  ──────────────────  ─────────────────────  ─────  │
│                                                                    │
│  12   EMP-008   —                  Missing Name            [Fix ↗] │
│  19   —         —                  Missing Employee ID     [Fix ↗] │
│                                    Missing Name                    │
│                                    Missing Designation             │
│                                                                    │
│  (Row 5 has been removed — it was fixed and promoted)              │
└────────────────────────────────────────────────────────────────────┘

┌── Valid Rows Tab — fixed row appears at bottom with badge ────────┐
│  Row  Emp ID    Name                Designation  Action            │
│  ───  ────────  ──────────────────  ───────────  ──────────────── │
│  ...original valid rows...                                         │
│   5   EMP-077   Suresh Narayanan   Guard         Create   Fixed ✓  │
│                                                                    │
│  "Fixed" badge: bg-emerald-50 text-emerald-700 rounded-full        │
│                 text-xs px-2 py-0.5                                │
│  Visually distinguishes user-fixed rows from originally-valid rows  │
└────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Summary strip | Reactive `useState` | Counts derived from `validRows.length` and `invalidRows.length` — re-render on each fix |
| Tab count badges | Inline in `TabsTrigger` | `(${count})` appended to label; re-renders with state |
| "Fixed" badge | `<span>` next to Action badge | `bg-emerald-50 text-emerald-700 rounded-full text-xs px-2 py-0.5`. Identifies rows fixed in this session |
| Invalid Rows empty state | Centered `<div>` | `CheckCircle` icon + "All invalid rows have been corrected." when `invalidRows.length === 0` |
