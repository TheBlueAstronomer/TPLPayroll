# F06 — Payroll Generation: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Payroll Week Selection (`/payroll`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Payroll Generation"                                         │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Week Table: divide-y divide-zinc-100 ──────────────────────┐│
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │         bg-zinc-50/50 font-medium                              ││
│ │                                                                ││
│ │ Week                   Attendance   Payroll         Action     ││
│ │ ─────────────────────  ───────────  ──────────────  ────────── ││
│ │ 6 Mar – 12 Mar 2025   Ready        Not generated   [Generate] ││
│ │ 27 Feb – 5 Mar 2025   Errors       Not generated      —       ││
│ │ 20 Feb – 26 Feb 2025  Ready        Approved        [View]     ││
│ │ 13 Feb – 19 Feb 2025  No upload       —               —       ││
│ │                                                                ││
│ │ Week: text-sm font-medium text-zinc-900                        ││
│ │ Attendance badges:                                             ││
│ │   Ready: <CheckCircle size={14} text-emerald-500 />            ││
│ │          "Ready" bg-emerald-50 text-emerald-700                ││
│ │          rounded-full text-xs px-2 py-0.5                      ││
│ │   Errors: <WarningCircle size={14} text-amber-500 />           ││
│ │           "Errors" bg-amber-50 text-amber-700                  ││
│ │   No upload: text-zinc-400 text-xs                             ││
│ │ Payroll badges:                                                ││
│ │   Not generated: text-zinc-400 text-xs                         ││
│ │   Approved: <CheckCircle size={14} text-emerald-500 />         ││
│ │             "Approved" bg-emerald-50 text-emerald-700          ││
│ │ Generate: Button sm, emerald bg, rounded-xl                    ││
│ │           disabled if attendance has errors                     ││
│ │ View: Button outline sm, rounded-xl                            ││
│ │ Row hover: hover:bg-zinc-50/80                                 ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Week table | `Table` | `divide-y divide-zinc-100`. NO card wrapper |
| Attendance badge | Phosphor icon + text | `CheckCircle`/`WarningCircle`. `rounded-full text-xs px-2 py-0.5` |
| Generate | `Button` sm | `bg-emerald-600 rounded-xl`. Disabled when attendance not ready (reduced opacity + `cursor-not-allowed`) |
| View | `Button` outline sm | `rounded-xl`. Opens approved payroll run |

---

## Screen 2: Payroll Generation Flow (`/payroll/generate/[weekId]`)

### Step Indicator

```
  ┌─ Stepper: flex items-center gap-0 ──────────────────────────┐
  │                                                              │
  │  [1]──────[2]──────[3]──────[4]                              │
  │                                                              │
  │  Completed step: bg-emerald-600 text-white rounded-full      │
  │  w-8 h-8 text-xs font-mono font-medium                      │
  │  Connecting line (done): h-[2px] bg-emerald-600              │
  │                                                              │
  │  Current step: border-2 border-emerald-600 text-emerald-600  │
  │  bg-white rounded-full                                       │
  │                                                              │
  │  Upcoming step: border border-zinc-300 text-zinc-400         │
  │  bg-white rounded-full                                       │
  │  Connecting line (pending): h-[2px] bg-zinc-200              │
  │                                                              │
  │  Step labels below: text-xs text-zinc-500                    │
  │  "Attendance" "Adjustments" "Summary" "Approve"              │
  └──────────────────────────────────────────────────────────────┘
```

### Step 1: Attendance Verification

```
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: "Verify Attendance"                                      │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Subtitle: "Week 6 Mar – 12 Mar 2025"                            │
│ text-sm text-zinc-500                                            │
│                                                                  │
│ ┌── Status Alert ──────────────────────────────────────────────┐│
│ │ bg-emerald-50 border border-emerald-200/60 rounded-xl p-4    ││
│ │ <CheckCircle size={20} text-emerald-500 />                    ││
│ │ "Attendance verified — 15 employees matched, 0 errors"        ││
│ │ text-sm font-medium text-emerald-700                          ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Quick Stats: flex divide-x divide-zinc-200 py-4 ───────────┐│
│ │ border-t border-b border-zinc-200/60                           ││
│ │                                                                ││
│ │ Total Employees   Total Regular Hrs   Total Overtime Hrs       ││
│ │ 15                693.5               47.0                     ││
│ │                                                                ││
│ │ label: text-xs uppercase tracking-wider text-zinc-400          ││
│ │ value: text-xl font-mono tabular-nums font-semibold            ││
│ │        text-zinc-900                                           ││
│ │ px-6 per block                                                 ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Actions: flex justify-end pt-6                                   │
│                                          [Continue →]            │
│ Button: emerald bg, rounded-xl, active:scale-[0.98]             │
└──────────────────────────────────────────────────────────────────┘
```

### Step 2: Adjustment Review

*(See F05 Wireframes — Screen 3: Weekly Adjustment Review)*

---

### Step 3: Payroll Summary Preview

```
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: "Payroll Summary"                                        │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Subtitle: "Week 6 Mar – 12 Mar 2025"                            │
│ text-sm text-zinc-500                                            │
│                                                                  │
│ ┌── Summary Table: divide-y divide-zinc-100 ───────────────────┐│
│ │ Horizontal scroll on mobile: overflow-x-auto                   ││
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │         bg-zinc-50/50                                          ││
│ │                                                                ││
│ │ ID       Name              Desig.  Reg    OT     Reg Pay      ││
│ │                                    Hrs    Hrs                  ││
│ │          (continued row)          OT Pay  Add.   Ded.   Net   ││
│ │ ───────  ────────────────  ─────  ─────  ─────  ──────────── ││
│ │ EMP-042  Lakshmi Venkatesh Guard  46.00  6.50   ₹2,875.00    ││
│ │                                   ₹406   ₹200   ₹2,150 ₹1,331││
│ │ EMP-117  Arjun Mehrotra    Supv.  48.00  0.00   ₹3,428.50    ││
│ │                                   ₹0     ₹875   ₹0    ₹4,303 ││
│ │ ═════════════════════════════════════════════════════════════  ││
│ │ TOTAL                             693.5  47.0   ₹43,312.50   ││
│ │                                   ₹2,937 ₹1,075 ₹2,650       ││
│ │                                                  ₹44,674.50   ││
│ │                                                                ││
│ │ All numbers: font-mono tabular-nums text-sm                    ││
│ │ Currency: text-zinc-800                                        ││
│ │ ID: font-mono text-xs text-zinc-500                            ││
│ │ Name: text-sm font-medium text-zinc-900                        ││
│ │ Total row: bg-zinc-50 font-semibold                            ││
│ │            border-t-2 border-zinc-300                           ││
│ │ Net Payable column: font-semibold text-zinc-900                ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Actions: flex justify-between pt-6                               │
│ [← Back]                            [Approve Payroll →]         │
│ Back: outline, rounded-xl                                        │
│ Approve: emerald bg, rounded-xl, active:scale-[0.98]            │
│ Triggers AlertDialog:                                            │
│ "Approve this payroll run? This action cannot be reversed."      │
│ [Cancel] [Confirm Approval]                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Summary table | `Table` with scroll | `overflow-x-auto` on mobile. `divide-y divide-zinc-100`. All currency/hours: `font-mono tabular-nums` |
| Total row | `TableRow` | `bg-zinc-50 font-semibold border-t-2 border-zinc-300`. Sticky bottom or last row |
| Currency format | Utility | `₹` INR, comma-separated, 2 decimal places. `tabular-nums` alignment |
| Approve button | `Button` | Emerald bg. Triggers `AlertDialog` confirmation |
| Confirm dialog | `AlertDialog` | Destructive-warning tone. Actions: Cancel, Confirm |

---

### Step 4: Approval Confirmation

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│ ┌── Success Block: text-center py-12 ──────────────────────────┐│
│ │                                                                ││
│ │ <CheckCircle size={48} weight="fill"                           ││
│ │  className="text-emerald-500 mx-auto" />                       ││
│ │                                                                ││
│ │ h2: "Payroll Approved"                                         ││
│ │ text-2xl font-semibold tracking-tight text-zinc-900 mt-4       ││
│ │                                                                ││
│ │ ┌── Stats: inline, text-center, mt-6 ──────────────────────┐  ││
│ │ │ Week: 6 Mar – 12 Mar 2025  text-sm text-zinc-500          │  ││
│ │ │ Employees: 15  font-mono                                  │  ││
│ │ │ Total Net: ₹44,674.50  font-mono font-semibold            │  ││
│ │ │            text-lg text-zinc-900                           │  ││
│ │ └──────────────────────────────────────────────────────────┘  ││
│ │                                                                ││
│ │ Actions: flex justify-center gap-3 mt-8                        ││
│ │ [Download PDF Summary]  [Download Payroll Slips]               ││
│ │ PDF: Button outline, rounded-xl                                ││
│ │      <FileText size={16} /> icon                               ││
│ │ Slips: Button outline, rounded-xl                              ││
│ │        <Package size={16} /> icon                              ││
│ │                                                                ││
│ │ [← Back to Payroll]                                            ││
│ │ Button ghost, text-sm text-zinc-500, mt-4                      ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Success icon | Phosphor `CheckCircle` | `weight="fill" size={48} text-emerald-500`. Centered |
| Summary stats | `<dl>` or inline | Week, count, total. Currency in `font-mono tabular-nums` |
| PDF button | `Button` outline | Phosphor `FileText`. Triggers PDF generation (F07). Loading: shimmer bar |
| Slips button | `Button` outline | Phosphor `Package`. Triggers ZIP generation. Loading: progress bar |
| Back link | `Button` ghost | `text-sm text-zinc-500`. Returns to week list |

### Motion Specs

- **Success mount:** CheckCircle scales in from `scale-0 → scale-100` with `spring stiffness: 100, damping: 20`. Text fades in staggered `80ms` delay after icon
