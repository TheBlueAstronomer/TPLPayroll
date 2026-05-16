# E01 — Bulk Employee Actions: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | Matches existing F02 design system

---

## Wireframe 1: Employee List with Checkboxes (`/employees` — enhanced)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Team Directory"                                             │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ (left-aligned)                    [Export]  [Import ▼]  [+ Add]  │
│                                                                  │
│ ┌── Filter Bar: flex gap-4, items-center ───────────────────────┐│
│ │ Search input (flex-1)         Status Select (w-[180px])       ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Table: divide-y divide-zinc-100 ──────────────────────────┐ │
│ │ ☐  ID          Name                Desig.   Site     Status  │ │
│ │ ──────────────────────────────────────────────────────────── │ │
│ │ ☑  EMP-042     Lakshmi Venkatesh   Guard    North   ● Active │ │
│ │ ☑  EMP-117     Arjun Mehrotra      Supvsr   South   ● Active │ │
│ │ ☐  EMP-203     Farida Begum        Guard    East    ● Resign │ │
│ │ ☑  EMP-089     Devendra Yadav      Guard    North   ● Active │ │
│ │ ☐  EMP-150     Sunita Patil        Guard    West    ○ Inactv │ │
│ │                                                              │ │
│ │  Checkbox column:                                            │ │
│ │  - Header: checkbox with indeterminate support               │ │
│ │  - Width: w-12, centered                                     │ │
│ │  - Accent: emerald-600 when checked                          │ │
│ │  - Click stops propagation (no row navigation)               │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Pagination: "Showing 1–10 of 27"    [← Prev]  [1] [2]  [Next →]│
│                                                                  │
│ ┌── Floating Toolbar (fixed bottom-center, appears when ≥1) ──┐ │
│ │  ┌────────────────────────────────────────────────────────┐  │ │
│ │  │  "3 selected"   [Mark Resigned] [Mark Inactive]       │  │ │
│ │  │                 [Change Hourly Rate]          [✕]      │  │ │
│ │  └────────────────────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown — Checkbox Column

| Element | Component | Styling & Behavior |
|---|---|---|
| Header checkbox | `<input type="checkbox">` | `w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/20`. Supports `indeterminate` via ref. Click selects/deselects all on page. |
| Row checkbox | `<input type="checkbox">` | Same styling. `onClick` with `e.stopPropagation()` to prevent row navigation. Toggles individual selection. |
| Checkbox cell | `<td>` / `<th>` | `w-12 px-4 py-3 text-center`. Vertically centered. |
| Selected row | `<tr>` | Additional class `bg-emerald-50/40` when selected for visual feedback. |

### Component Breakdown — Floating Toolbar

| Element | Component | Styling & Behavior |
|---|---|---|
| Container | `<div>` | `fixed bottom-6 left-1/2 -translate-x-1/2 z-40`. `bg-white rounded-2xl border border-zinc-200/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] px-4 py-3`. Appears via `animate-slideUp`, disappears via `animate-slideDown`. |
| Selection count | `<span>` | `text-sm font-medium text-zinc-700 mr-4`. E.g., "3 selected". |
| Mark Resigned | `<button>` | `text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors`. Icon: `UserMinus` size 15. |
| Mark Inactive | `<button>` | `text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors`. Icon: `Prohibit` size 15. |
| Change Hourly Rate | `<button>` | `text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors`. Icon: `CurrencyDollar` size 15. |
| Clear (✕) | `<button>` | `ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors`. Icon: `X` size 14. Clears all selections. |

### Motion Specs

- **Toolbar slide-up:** `transform: translateY(20px) → translateY(0)`, `opacity: 0 → 1`, `duration: 250ms`, `ease: cubic-bezier(0.16, 1, 0.3, 1)`
- **Toolbar slide-down:** reverse of above, `duration: 200ms`
- **Selected row highlight:** `transition: background-color 150ms ease`

---

## Wireframe 2: Bulk Mark as Resigned Dialog

### Layout

```
┌── Modal Overlay ─────────────────────────────────────────────────┐
│  bg-zinc-900/40 backdrop-blur-sm                                 │
│                                                                  │
│  ┌── Dialog Panel: max-w-md ────────────────────────────────────┐│
│  │  rounded-2xl bg-white p-6 shadow-xl border-zinc-200/60       ││
│  │                                                               ││
│  │  ┌── Icon ────────────────────────────────────────────────┐  ││
│  │  │  w-10 h-10 rounded-full bg-rose-50                     │  ││
│  │  │  <UserMinus size={20} weight="fill" text-rose-500 />   │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  h2: "Mark 3 employees as Resigned?"                         ││
│  │  text-base font-semibold text-zinc-900 mb-2                  ││
│  │                                                               ││
│  │  p: "The following employees will be marked as resigned       ││
│  │      and excluded from future payroll runs."                  ││
│  │  text-sm text-zinc-500 mb-4                                  ││
│  │                                                               ││
│  │  ┌── Employee List (scrollable) ──────────────────────────┐  ││
│  │  │  max-h-[180px] overflow-y-auto rounded-lg              │  ││
│  │  │  bg-zinc-50 border border-zinc-100 p-3                 │  ││
│  │  │                                                         │  ││
│  │  │  • EMP-042  Lakshmi Venkatesh                           │  ││
│  │  │  • EMP-117  Arjun Mehrotra                              │  ││
│  │  │  • EMP-089  Devendra Yadav                              │  ││
│  │  │                                                         │  ││
│  │  │  ID: font-mono text-xs text-zinc-400                    │  ││
│  │  │  Name: text-sm text-zinc-700                            │  ││
│  │  │  Each row: flex items-center gap-2 py-1                 │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  ┌── Date of Resignation* ────────────────────────────────┐  ││
│  │  │  Label: text-xs font-medium uppercase tracking-wider    │  ││
│  │  │         text-zinc-400 mb-1.5                            │  ││
│  │  │  Input: calendar picker, rounded-xl                     │  ││
│  │  │         border-zinc-200/60                              │  ││
│  │  │         Default: today                                  │  ││
│  │  │  Error: text-rose-600 text-xs mt-1                      │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  ┌── Actions: flex justify-end gap-3 ─────────────────────┐  ││
│  │  │                              [Cancel]  [Confirm]        │  ││
│  │  │  Cancel: variant outline, rounded-xl                    │  ││
│  │  │  Confirm: bg-rose-600 text-white rounded-xl             │  ││
│  │  │           active:scale-[0.98]                           │  ││
│  │  │  Loading: "Processing 2 of 3…" with spinner             │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Overlay | `<div>` | `fixed inset-0 z-50 flex items-center justify-center p-4`. `bg-zinc-900/40 backdrop-blur-sm`. Click-to-dismiss disabled during processing. |
| Panel | `<div>` | `relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200/60` |
| Icon badge | `<div>` | `w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-4` |
| Employee list | `<div>` scrollable | `max-h-[180px] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-100 p-3 mb-4`. Scrollbar: `scrollbar-thin scrollbar-thumb-zinc-200` |
| Date picker | `Popover` + `Calendar` | Same as existing employee form date picker. Rose accent on selected. Required field, validated on submit. |
| Cancel button | `<button>` | Standard outline style. Disabled during processing. |
| Confirm button | `<button>` | `bg-rose-600 hover:bg-rose-700 text-white rounded-xl`. Shows `SpinnerGap` during processing. Text changes to "Processing N of M…" |
| Processing state | Internal state | Buttons disabled. Backdrop click disabled. Progress text updates per-employee. |

---

## Wireframe 3: Bulk Mark as Inactive Dialog

### Layout

```
┌── Modal Overlay ─────────────────────────────────────────────────┐
│                                                                  │
│  ┌── Dialog Panel: max-w-md ────────────────────────────────────┐│
│  │                                                               ││
│  │  ┌── Icon ────────────────────────────────────────────────┐  ││
│  │  │  w-10 h-10 rounded-full bg-amber-50                    │  ││
│  │  │  <Warning size={20} weight="fill" text-amber-500 />    │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  h2: "Mark 5 employees as Inactive?"                         ││
│  │  text-base font-semibold text-zinc-900 mb-2                  ││
│  │                                                               ││
│  │  p: "These employees will be excluded from future payroll     ││
│  │      runs. They will remain visible in the directory."        ││
│  │  text-sm text-zinc-500 mb-4                                  ││
│  │                                                               ││
│  │  ┌── Employee List (scrollable) ──────────────────────────┐  ││
│  │  │  • EMP-042  Lakshmi Venkatesh         ● Active          │  ││
│  │  │  • EMP-117  Arjun Mehrotra            ● Active          │  ││
│  │  │  • EMP-089  Devendra Yadav            ● Active          │  ││
│  │  │  • EMP-201  Meena Sharma              ● Active          │  ││
│  │  │  • EMP-305  Rajan Pillai              ● Active          │  ││
│  │  │                                                         │  ││
│  │  │  Status badge shown for context                         │  ││
│  │  │  Already-inactive employees show "(already inactive)"   │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  ┌── Actions: flex justify-end gap-3 ─────────────────────┐  ││
│  │  │                              [Cancel]  [Confirm]        │  ││
│  │  │  Cancel: variant outline, rounded-xl                    │  ││
│  │  │  Confirm: bg-amber-600 text-white rounded-xl            │  ││
│  │  │           hover:bg-amber-700                            │  ││
│  │  │  Loading: "Processing 3 of 5…" with spinner             │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Panel | Same structure as Resigned dialog | Reuses dialog shell component |
| Icon badge | `<div>` | `bg-amber-50` with `Warning` icon `text-amber-500` — amber tint differentiates from rose/resign |
| Employee list | Scrollable list | Same as resigned dialog but includes current status badge per row. Rows already inactive show `text-zinc-400 italic` "(already inactive)" instead of status badge |
| Confirm button | `<button>` | `bg-amber-600 hover:bg-amber-700 text-white` — amber indicates caution (not destructive like resign) |

---

## Wireframe 4: Bulk Change Hourly Rate Dialog

### Layout

```
┌── Modal Overlay ─────────────────────────────────────────────────┐
│                                                                  │
│  ┌── Dialog Panel: max-w-lg ────────────────────────────────────┐│
│  │                                                               ││
│  │  ┌── Icon ────────────────────────────────────────────────┐  ││
│  │  │  w-10 h-10 rounded-full bg-emerald-50                  │  ││
│  │  │  <CurrencyCircleDollar size={20} weight="fill"          │  ││
│  │  │   text-emerald-600 />                                   │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  h2: "Change hourly rate for 3 employees"                    ││
│  │  text-base font-semibold text-zinc-900 mb-2                  ││
│  │                                                               ││
│  │  p: "A new wage history entry will be created for each        ││
│  │      employee. The weekly salary remains unchanged."          ││
│  │  text-sm text-zinc-500 mb-4                                  ││
│  │                                                               ││
│  │  ┌── Employee List with current rates (scrollable) ───────┐  ││
│  │  │  max-h-[200px] overflow-y-auto rounded-lg               │  ││
│  │  │  bg-zinc-50 border border-zinc-100 p-3                  │  ││
│  │  │                                                          │  ││
│  │  │  EMP-042  Lakshmi Venkatesh       current: ₹62.50       │  ││
│  │  │  EMP-117  Arjun Mehrotra          current: ₹55.00       │  ││
│  │  │  EMP-089  Devendra Yadav          current: ₹70.00       │  ││
│  │  │                                                          │  ││
│  │  │  ID: font-mono text-xs text-zinc-400                     │  ││
│  │  │  Name: text-sm text-zinc-700                             │  ││
│  │  │  Rate: font-mono text-xs text-zinc-400 ml-auto           │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  ┌── Form: grid grid-cols-2 gap-x-6 gap-y-4 ─────────────┐  ││
│  │  │                                                          │  ││
│  │  │  NEW HOURLY RATE (₹)*          EFFECTIVE FROM             │  ││
│  │  │  [75.00]                       [calendar — today]        │  ││
│  │  │  type: number, step: 0.01      Default: today            │  ││
│  │  │  font-mono tabular-nums        Optional                  │  ││
│  │  │  Error: text-rose-600           rounded-xl               │  ││
│  │  │         text-xs mt-1            border-zinc-200/60       │  ││
│  │  │                                                          │  ││
│  │  │  Label: text-xs font-medium uppercase tracking-wider     │  ││
│  │  │         text-zinc-400 mb-1.5                             │  ││
│  │  │  Input: rounded-xl bg-white border-zinc-200/60           │  ││
│  │  │         focus:ring-2 focus:ring-emerald-500/20            │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  │                                                               ││
│  │  ┌── Actions: flex justify-end gap-3 pt-4 ────────────────┐  ││
│  │  │                              [Cancel]  [Update Rate]    │  ││
│  │  │  Cancel: variant outline, rounded-xl                    │  ││
│  │  │  Update Rate: bg-emerald-600 text-white rounded-xl      │  ││
│  │  │               hover:bg-emerald-700                      │  ││
│  │  │               active:scale-[0.98]                       │  ││
│  │  │  Loading: "Updating 2 of 3…" with spinner               │  ││
│  │  └────────────────────────────────────────────────────────┘  ││
│  └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Panel | `<div>` | `max-w-lg` (slightly wider than status dialogs to accommodate rate column). Same shadow/border as other dialogs. |
| Icon badge | `<div>` | `bg-emerald-50` with `CurrencyCircleDollar` icon `text-emerald-600` |
| Employee list | Scrollable list | Each row: `flex items-center justify-between`. Left: ID + Name. Right: `current: ₹XX.XX` in `font-mono text-xs text-zinc-400`. Rows where new rate = current rate show `text-zinc-300 line-through` on the current rate for preview. |
| Hourly rate input | `<input type="number">` | `step="0.01" min="0"`. `font-mono tabular-nums`. Standard focus ring emerald. Required, validates > 0. |
| Effective from | `Popover` + `Calendar` | Same as existing employee form. Emerald accent. Defaults to today. Optional — if not set, uses today. |
| Cancel button | `<button>` | Standard outline. |
| Update Rate button | `<button>` | `bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl`. Shows progress during bulk processing. |

---

## Wireframe 5: Processing State (shared pattern for all dialogs)

### Layout

```
┌── Dialog Panel (during processing) ─────────────────────────────┐
│                                                                  │
│  [Icon badge unchanged]                                          │
│                                                                  │
│  h2: "Updating employees…"                                       │
│  text-base font-semibold text-zinc-900 mb-2                      │
│                                                                  │
│  ┌── Progress Bar ───────────────────────────────────────────┐   │
│  │  w-full h-1.5 rounded-full bg-zinc-100                     │   │
│  │  Inner bar: h-1.5 rounded-full bg-emerald-500              │   │
│  │             transition-all duration-300                     │   │
│  │             width: calc(current / total * 100%)             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  p: "Processing 2 of 5…"                                         │
│  text-sm text-zinc-500 text-center mt-2                          │
│                                                                  │
│  ┌── Actions (disabled) ─────────────────────────────────────┐   │
│  │                    [Cancel ◌]  [Confirm ◌]                 │   │
│  │  Both buttons: opacity-50 cursor-not-allowed               │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 6: Success/Failure Toast

### Layout

```
┌── Toast (top-right, auto-dismiss 5s) ────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ✓  "Hourly rate updated for 3 employees"                   │ │
│  │     text-sm text-zinc-700                                    │ │
│  │     Icon: CheckCircle text-emerald-500 size 18               │ │
│  │     bg-white border-zinc-200/60 rounded-xl shadow-lg         │ │
│  │     px-4 py-3                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ── Partial failure variant ──                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ⚠  "4 succeeded, 1 failed"                                 │ │
│  │     text-sm text-zinc-700                                    │ │
│  │     Icon: WarningCircle text-amber-500 size 18               │ │
│  │     bg-white border-amber-200/60 rounded-xl shadow-lg        │ │
│  │     px-4 py-3                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Variant | Icon | Border | Auto-dismiss |
|---|---|---|---|
| Full success | `CheckCircle` emerald-500 | `border-zinc-200/60` | 5 seconds |
| Partial failure | `WarningCircle` amber-500 | `border-amber-200/60` | 8 seconds |
| Full failure | `XCircle` rose-500 | `border-rose-200/60` | 8 seconds |

### Motion Specs

- **Enter:** `translateX(100%) → translateX(0)`, `opacity: 0 → 1`, `duration: 300ms`, `ease: cubic-bezier(0.16, 1, 0.3, 1)`
- **Exit:** `translateX(0) → translateX(100%)`, `opacity: 1 → 0`, `duration: 200ms`

---

## Interactive State Summary

| State | Visual |
|---|---|
| No selection | Standard table, no toolbar visible |
| ≥ 1 selected | Checkbox filled emerald, row bg `emerald-50/40`, toolbar slides up |
| All on page selected | Header checkbox checked (not indeterminate), toolbar visible |
| Some on page selected | Header checkbox indeterminate, toolbar visible |
| Dialog open | Overlay with backdrop-blur, dialog panel centered |
| Dialog processing | Progress bar, processing text, buttons disabled |
| Dialog complete (success) | Dialog auto-closes, toast slides in from right |
| Dialog complete (partial fail) | Dialog shows brief summary, then closes, amber toast |
