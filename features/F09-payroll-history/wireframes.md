# F09 — Payroll History: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Payroll History Search (`/history`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Payroll History"                                            │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Filter Bar: grid grid-cols-1 md:grid-template-columns:     ┐│
│ │   2fr 1fr, gap-4 ────────────────────────────────────────────  ││
│ │                                                                ││
│ │ Search (wider, 2fr)            Week Select (narrower, 1fr)    ││
│ │ rounded-xl bg-zinc-50          rounded-xl border-zinc-200/60  ││
│ │ border-zinc-200/60             Options: All weeks + list of   ││
│ │ focus:ring-emerald-500          approved payroll weeks         ││
│ │ <MagnifyingGlass size={16}                                    ││
│ │  text-zinc-400 />                                             ││
│ │ placeholder: "Search by                                       ││
│ │  employee name or ID..."                                      ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Results Table: divide-y divide-zinc-100 ───────────────────┐│
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │         bg-zinc-50/50 font-medium                              ││
│ │                                                                ││
│ │ Week            Employee           Reg Hrs  OT Hrs  Gross  Net││
│ │ ──────────────  ─────────────────  ───────  ──────  ─────  ───││
│ │ 6–12 Mar 2025   Lakshmi Venkatesh  46.00    6.50   ₹3,281 ₹1,331│
│ │ 6–12 Mar 2025   Arjun Mehrotra     48.00    0.00   ₹3,428 ₹4,303│
│ │ 27 Feb–5 Mar    Lakshmi Venkatesh  40.00    4.00   ₹2,750 ₹2,750│
│ │                                                                ││
│ │ Week: text-sm text-zinc-900                                    ││
│ │ Name: text-sm font-medium text-zinc-900                        ││
│ │ Hours/Currency: font-mono tabular-nums text-sm text-zinc-800   ││
│ │ Row hover: hover:bg-zinc-50/80                                 ││
│ │ Clickable rows → /history/[recordId]                           ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Pagination: text-sm text-zinc-500                                │
│ [← Prev]  [1] [2] [3]  [Next →]                                │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Search | `Input` | `rounded-xl bg-zinc-50`. Debounced 300ms. Phosphor `MagnifyingGlass` icon |
| Week filter | `Select` | `rounded-xl`. Dropdown of approved payroll weeks |
| Results table | `Table` | `divide-y divide-zinc-100`. All numbers: `font-mono tabular-nums`. Clickable rows |
| Pagination | `Pagination` | Active: `bg-emerald-50 text-emerald-700 rounded-lg` |

### Interactive States

- **Loading:** Skeleton rows (5x) matching column widths
- **Empty:** Phosphor `ClockCounterClockwise` (size 48, text-zinc-200), "No payroll history found" (`text-lg font-medium text-zinc-600`), "Approved payroll runs will appear here" (`text-sm text-zinc-400`)
- **Row stagger:** `animation-delay: calc(var(--index) * 60ms)`

---

## Screen 2: Payroll Record Detail (`/history/[recordId]`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to history]                                              │
│ Button ghost, text-sm text-zinc-500                              │
│ <ArrowLeft size={16} />                                          │
│                                                                  │
│ h1: "Lakshmi Venkatesh"                                          │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Subtitle: "Week 6 Mar – 12 Mar 2025"                            │
│ text-sm text-zinc-500                                            │
│ Badge: "Revision 2 (Current)" bg-emerald-50 text-emerald-700    │
│        rounded-full text-xs px-2 py-0.5                          │
│                                                                  │
│ ┌── Employee Info: border-t border-zinc-200/60 pt-6 ───────────┐│
│ │ flex divide-x divide-zinc-200                                  ││
│ │                                                                ││
│ │ ID: EMP-042      Designation: Guard    Hourly Rate: ₹68.75    ││
│ │                                                                ││
│ │ label: text-xs uppercase tracking-wider text-zinc-400          ││
│ │ value: text-sm text-zinc-900                                   ││
│ │ rate: font-mono tabular-nums                                   ││
│ │ px-6 per block (first: pl-0)                                   ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Content: grid grid-cols-1 md:grid-template-columns: 2fr 1fr ┐│
│ │                gap-8                                           ││
│ │                                                                ││
│ │ ┌─ Left Column (2fr) ──────────────────────────────────────┐  ││
│ │ │                                                           │  ││
│ │ │ Section: "Attendance"                                     │  ││
│ │ │ border-t border-zinc-200/60 pt-6                          │  ││
│ │ │ text-sm font-medium text-zinc-900 mb-4                    │  ││
│ │ │                                                           │  ││
│ │ │ Table: divide-y divide-zinc-100                           │  ││
│ │ │ Header: text-xs uppercase tracking-wider text-zinc-400    │  ││
│ │ │                                                           │  ││
│ │ │ Day        Date       Reg Hrs   OT Hrs                    │  ││
│ │ │ ─────────  ─────────  ────────  ────────                  │  ││
│ │ │ Thursday   6 Mar      8.00      2.00                      │  ││
│ │ │ Friday     7 Mar      8.00      0.00                      │  ││
│ │ │ Saturday   8 Mar      6.00      0.00                      │  ││
│ │ │ Sunday     9 Mar      0.00      0.00                      │  ││
│ │ │ Monday     10 Mar     8.00      3.50                      │  ││
│ │ │ Tuesday    11 Mar     8.00      1.00                      │  ││
│ │ │ Wednesday  12 Mar     8.00      0.00                      │  ││
│ │ │ ═════════  ═════════  ════════  ════════                  │  ││
│ │ │ TOTAL                 46.00     6.50                      │  ││
│ │ │                                                           │  ││
│ │ │ Hours: font-mono tabular-nums text-sm text-zinc-800       │  ││
│ │ │ Total: font-semibold border-t-2 border-zinc-300           │  ││
│ │ │        bg-zinc-50/50                                      │  ││
│ │ │ Day: text-sm text-zinc-600                                │  ││
│ │ │ Date: text-sm text-zinc-500                               │  ││
│ │ └──────────────────────────────────────────────────────────┘  ││
│ │                                                                ││
│ │ ┌─ Right Column (1fr) ─────────────────────────────────────┐  ││
│ │ │                                                           │  ││
│ │ │ Section: "Earnings"                                       │  ││
│ │ │ border-t border-zinc-200/60 pt-6                          │  ││
│ │ │                                                           │  ││
│ │ │ <dl> space-y-3                                            │  ││
│ │ │ dt: text-xs text-zinc-400                                 │  ││
│ │ │ dd: text-sm font-mono tabular-nums text-zinc-800          │  ││
│ │ │                                                           │  ││
│ │ │ Regular Pay     ₹2,875.00                                 │  ││
│ │ │ Overtime Pay    ₹406.25                                   │  ││
│ │ │ ──────────────────────── (border-t)                       │  ││
│ │ │ Gross Pay       ₹3,281.25                                 │  ││
│ │ │ dd: font-semibold                                         │  ││
│ │ │                                                           │  ││
│ │ │ Section: "Adjustments"                                    │  ││
│ │ │ border-t border-zinc-200/60 pt-6 mt-6                     │  ││
│ │ │                                                           │  ││
│ │ │ Table: divide-y divide-zinc-100                           │  ││
│ │ │ Type       Amount   Reason                                │  ││
│ │ │ ─────────  ───────  ──────────────────                    │  ││
│ │ │ Addition   +₹200    Transport allowance                   │  ││
│ │ │ Deduction  -₹2,150  Advance recovery                     │  ││
│ │ │                                                           │  ││
│ │ │ Addition: text-emerald-600                                │  ││
│ │ │ Deduction: text-rose-600                                  │  ││
│ │ │ Amount: font-mono tabular-nums                            │  ││
│ │ │                                                           │  ││
│ │ │ ──────────────────────────                                │  ││
│ │ │ NET PAYABLE                                               │  ││
│ │ │ border-t-2 border-zinc-300 pt-6 mt-6                      │  ││
│ │ │                                                           │  ││
│ │ │ ₹1,331.25                                                │  ││
│ │ │ text-3xl font-mono tabular-nums                           │  ││
│ │ │ font-semibold text-zinc-900                               │  ││
│ │ │                                                           │  ││
│ │ │ NO card box — generous spacing only                       │  ││
│ │ └──────────────────────────────────────────────────────────┘  ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Back link | `Button` ghost | Phosphor `ArrowLeft`. Returns to history list |
| Revision badge | `Badge` | `bg-emerald-50 text-emerald-700 rounded-full text-xs` |
| Employee info | `div` flex `divide-x` | Horizontal stat strip. `text-xs` labels, `text-sm` values. Rate: `font-mono` |
| Attendance table | `Table` | `divide-y divide-zinc-100`. Hours: `font-mono tabular-nums`. Total row: `font-semibold border-t-2 border-zinc-300 bg-zinc-50/50` |
| Earnings | `<dl>` | `dt`: zinc-400 labels. `dd`: `font-mono tabular-nums`. Gross: `font-semibold` |
| Adjustments table | `Table` | `divide-y divide-zinc-100`. Addition: `text-emerald-600`. Deduction: `text-rose-600`. `font-mono` amounts |
| Net payable | `<span>` | `text-3xl font-mono tabular-nums font-semibold text-zinc-900`. NO card wrapper — just generous spacing with `border-t-2 border-zinc-300 pt-6` |
| No downloads | — | History view is read-only. No PDF/ZIP buttons |
