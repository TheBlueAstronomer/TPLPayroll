# F05 — Payroll Adjustments: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Adjustments List (`/adjustments`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Payroll Adjustments"               [+ New Adjustment]       │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Filter Bar: flex gap-4, items-center ───────────────────────┐│
│ │ Search (flex-1)        Type Select (w-[160px])                ││
│ │ rounded-xl bg-zinc-50  rounded-xl                  Status     ││
│ │ border-zinc-200/60     border-zinc-200/60           Select    ││
│ │ <MagnifyingGlass       Options: All,                (w-[160px])│
│ │  size={16}             Deduction, Addition          Options:  ││
│ │  text-zinc-400 />                                   All,      ││
│ │ placeholder: "Search                                Active,   ││
│ │  employee..."                                       Done,     ││
│ │                                                     Cancelled ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Table: divide-y divide-zinc-100 (NO card wrapper) ─────────┐│
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │         bg-zinc-50/50 font-medium                              ││
│ │                                                                ││
│ │ Employee            Type       Amount    Recurrence  Status    ││
│ │ ──────────────────  ─────────  ────────  ──────────  ──────── ││
│ │ Lakshmi Venkatesh   Deduction  ₹2,150   Recurring   ● Active ││
│ │ Arjun Mehrotra      Addition   ₹875     One-time    ● Pending ││
│ │ Suresh Narayanan    Deduction  ₹500     Recurring   ● Done   ││
│ │                                                                ││
│ │ Type badge:                                                    ││
│ │   Deduction: text-rose-600 bg-rose-50 rounded-full             ││
│ │              text-xs px-2 py-0.5                               ││
│ │   Addition: text-emerald-700 bg-emerald-50 rounded-full        ││
│ │             text-xs px-2 py-0.5                                ││
│ │ Amount: font-mono tabular-nums text-sm text-zinc-900           ││
│ │ Status: dot + text                                             ││
│ │   Active: emerald dot, text-emerald-700                        ││
│ │   Pending: amber dot, text-amber-600                           ││
│ │   Done: zinc dot, text-zinc-400                                ││
│ │ Row hover: hover:bg-zinc-50/80                                 ││
│ │ Clickable rows → detail view                                   ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Pagination: text-sm text-zinc-500                                │
│ [← Prev]  [1] [2]  [Next →]                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| New Adjustment | `Button` | `bg-emerald-600 text-white rounded-xl active:scale-[0.98]`. Phosphor `Plus` icon |
| Search | `Input` | `rounded-xl bg-zinc-50 border-zinc-200/60`. Debounced 300ms. Phosphor `MagnifyingGlass` |
| Type filter | `Select` | `rounded-xl`. Options: All, Deduction, Addition |
| Status filter | `Select` | `rounded-xl`. Options: All, Active, Done, Cancelled |
| Table | `Table` | `divide-y divide-zinc-100`. Sortable. Row hover: `hover:bg-zinc-50/80` |
| Type badge | `<span>` | Deduction: rose-tinted. Addition: emerald-tinted. `rounded-full text-xs` |
| Status | Dot + text | Active: emerald. Pending: amber. Done: zinc. Phosphor `Circle` weight `fill`, size 8 |
| Pagination | `Pagination` | Active: `bg-emerald-50 text-emerald-700 rounded-lg` |

### Interactive States

- **Loading:** 5x skeleton rows
- **Empty:** Phosphor `Scales` (size 48, text-zinc-200), "No adjustments created", "Create your first payroll adjustment", CTA button
- **Row stagger:** `animation-delay: calc(var(--index) * 60ms)`

---

## Screen 2: Create Adjustment (`/adjustments/new`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to adjustments]                                          │
│ h1: "New Payroll Adjustment"                                     │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Section: Employee ──────────────────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8                               ││
│ │                                                                ││
│ │ Employee*                                                      ││
│ │ text-xs uppercase tracking-wider text-zinc-400 mb-1.5          ││
│ │ [Combobox: Search employee... ]                                ││
│ │ Popover + Command + CommandInput + CommandList                  ││
│ │ rounded-xl border-zinc-200/60                                  ││
│ │ focus:ring-emerald-500                                         ││
│ │ <MagnifyingGlass size={16} text-zinc-400 />                    ││
│ │                                                                ││
│ │ Selected: flex items-center gap-2 bg-emerald-50/50             ││
│ │ rounded-xl p-3 border border-emerald-200/50                    ││
│ │ "EMP-042 — Lakshmi Venkatesh"                                  ││
│ │ font-mono text-xs for ID, text-sm for name                     ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Section: Adjustment Details ────────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8                               ││
│ │                                                                ││
│ │ Type*                                                          ││
│ │ RadioGroup: flex gap-4                                         ││
│ │ (●) Deduction  ( ) Addition                                   ││
│ │ Radio accent: emerald-600 when selected                        ││
│ │ Label: text-sm text-zinc-700                                   ││
│ │                                                                ││
│ │ grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5              ││
│ │                                                                ││
│ │ Amount (₹)*              Reason*                               ││
│ │ [2,150]                  [Advance recovery — kitchen supplies] ││
│ │ Input number, step 0.01  Textarea, 2 rows                      ││
│ │ font-mono tabular-nums   text-sm                               ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Section: Recurrence ────────────────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8                               ││
│ │                                                                ││
│ │ Recurrence Type*                                               ││
│ │ (●) One-time  ( ) Recurring                                   ││
│ │                                                                ││
│ │ ── If One-time: ──────────────────────────────────────        ││
│ │ Payroll Week*                                                  ││
│ │ [Select: Choose week...]                                       ││
│ │ rounded-xl                                                     ││
│ │                                                                ││
│ │ ── If Recurring: ─────────────────────────────────────        ││
│ │ grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5              ││
│ │                                                                ││
│ │ Start Week*              End Condition*                        ││
│ │ [Select week]            [Select condition...]                 ││
│ │                          Options:                              ││
│ │                            Until end week                      ││
│ │                            Fixed number of weeks               ││
│ │                            Until balance depleted              ││
│ │                                                                ││
│ │ Conditional fields:                                            ││
│ │   "Until end week" → End Week date selector                   ││
│ │   "Fixed weeks" → Total Weeks number input (font-mono)        ││
│ │   "Balance depleted" → Total Balance currency input           ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Actions: flex justify-end gap-3 pt-8 border-t ─────────────┐│
│ │                           [Cancel]  [Save Adjustment]          ││
│ │ Cancel: outline, rounded-xl                                    ││
│ │ Save: emerald bg, rounded-xl, active:scale-[0.98]             ││
│ │       Loading: shimmer bar in button                           ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Employee search | Combobox: `Popover` + `Command` | `rounded-xl`. Icon: `MagnifyingGlass`. Selected state shows employee card |
| Type radio | `RadioGroup` | Emerald accent when selected. `text-sm text-zinc-700` labels |
| Amount | `Input` number | `font-mono tabular-nums`. Step 0.01 |
| Reason | `Textarea` | Required. `rounded-xl border-zinc-200/60` |
| Recurrence radio | `RadioGroup` | Conditional field reveal with `transition-all duration-200` |
| End condition | `Select` | Dynamic sub-fields based on selection |
| Week selector | `Select` | Lists available payroll weeks. `rounded-xl` |
| Form validation | `react-hook-form` + `zod` | Client-side |

---

## Screen 3: Weekly Adjustment Review (embedded in Payroll Generation — F06)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Step 2 of 4: "Review Adjustments"                                │
│ Subtitle: "Week 6 Mar – 12 Mar"                                 │
│ text-sm text-zinc-500                                            │
│                                                                  │
│ ┌── Bulk Actions: flex gap-3 mb-4 ─────────────────────────────┐│
│ │ [Approve All] Button outline sm, emerald text                  ││
│ │ [Skip All] Button outline sm, zinc text                        ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Table: divide-y divide-zinc-100 ───────────────────────────┐│
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │                                                                ││
│ │ Employee           Type       Amount   Reason           Action ││
│ │ ────────────────── ──────── ──────── ──────────────── ─────── ││
│ │ Lakshmi Venkatesh  Deduction ₹2,150  Advance recovery  [v][x] ││
│ │ Arjun Mehrotra     Addition  ₹875    Transport allow.  [v][x] ││
│ │ Lakshmi Venkatesh  Deduction ₹500    Loan installment  [v][x] ││
│ │                                                                ││
│ │ Approve: <Check size={16} /> ghost button                      ││
│ │   Approved state: bg-emerald-50 text-emerald-600               ││
│ │   active:scale-[0.98]                                          ││
│ │ Skip: <X size={16} /> ghost button                             ││
│ │   Skipped state: bg-zinc-100 text-zinc-400 line-through        ││
│ │   active:scale-[0.98]                                          ││
│ │ Amount: font-mono tabular-nums                                 ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Info Alert ────────────────────────────────────────────────┐ │
│ │ bg-zinc-50 border border-zinc-200/60 rounded-xl p-3          │ │
│ │ <Info size={16} text-zinc-400 />                              │ │
│ │ "Skipped adjustments will carry forward to the next week."    │ │
│ │ text-sm text-zinc-500                                         │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Actions: flex justify-between                                    │
│ [← Back]                    [Continue to Payroll Summary]        │
│ Back: outline, rounded-xl                                        │
│ Continue: emerald bg, rounded-xl, active:scale-[0.98]           │
│ Disabled if no action taken on any row                           │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Step header | Custom | Step number + title. `text-2xl font-semibold tracking-tight text-zinc-900` |
| Adjustment table | `Table` | `divide-y divide-zinc-100`. Amounts: `font-mono tabular-nums` |
| Approve button | `Button` ghost icon | Phosphor `Check` size 16. Approved row: `bg-emerald-50` highlight. `active:scale-[0.98]` |
| Skip button | `Button` ghost icon | Phosphor `X` size 16. Skipped row: `bg-zinc-50 text-zinc-400`, amount gets `line-through` |
| Bulk actions | `Button` outline sm | "Approve All", "Skip All" above table |
| Info alert | `Alert` | `bg-zinc-50 border-zinc-200/60 rounded-xl`. Phosphor `Info` icon |
| Continue | `Button` | Disabled until every row has an action |
