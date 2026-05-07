# F08 — Payroll Correction: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Correction Entry Point (on approved payroll run)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Payroll — Week 6 Mar – 12 Mar 2025"                        │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Badge: "Approved (Revision 1)" bg-emerald-50 text-emerald-700   │
│        rounded-full text-xs px-2 py-0.5                          │
│                                                                  │
│ ┌── Action Bar: flex gap-3 ────────────────────────────────────┐│
│ │ [PDF Summary]        [Payroll Slips]       [Correct Payroll]  ││
│ │ Button outline sm    Button outline sm     Button outline sm   ││
│ │ <FileText size={14}  <Package size={14}    <PencilSimple      ││
│ │  />                   />                    size={14} />       ││
│ │ rounded-xl           rounded-xl            rounded-xl          ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Revision History: border-t border-zinc-200/60 pt-8 ────────┐│
│ │ Section label: "Revision History"                              ││
│ │ text-sm font-medium text-zinc-900 mb-4                         ││
│ │                                                                ││
│ │ Table: divide-y divide-zinc-100                                ││
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │                                                                ││
│ │ Rev   Status      Correction Reason       Total       Date    ││
│ │ ────  ──────────  ──────────────────────   ─────────   ─────  ││
│ │ 1     Current     —                        ₹44,674.50  13 Mar ││
│ │                                                                ││
│ │ Rev: font-mono text-sm font-medium text-zinc-900               ││
│ │ Status badges:                                                 ││
│ │   Current: bg-emerald-50 text-emerald-700 rounded-full         ││
│ │            text-xs px-2 py-0.5                                 ││
│ │   Superseded: bg-zinc-100 text-zinc-400 rounded-full           ││
│ │               text-xs px-2 py-0.5 line-through                 ││
│ │ Total: font-mono tabular-nums text-zinc-800                    ││
│ │ Date: text-sm text-zinc-500                                    ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Payroll Summary: border-t border-zinc-200/60 pt-8 ─────────┐│
│ │ Section label: "Current Payroll Summary"                       ││
│ │ (Same table as F06 Step 3)                                     ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Correct button | `Button` outline sm | Phosphor `PencilSimple` size 14. `rounded-xl`. Opens correction flow |
| Revision table | `Table` | `divide-y divide-zinc-100`. Rev#: `font-mono`. Current: emerald badge. Superseded: zinc badge with `line-through` |
| PDF/Slips buttons | `Button` outline sm | Phosphor `FileText`, `Package`. `rounded-xl` |

---

## Screen 2: Correction Flow (`/payroll/[runId]/correct`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Cancel Correction]                                            │
│ Button ghost, text-sm text-zinc-500                              │
│ <ArrowLeft size={16} />                                          │
│                                                                  │
│ h1: "Payroll Correction"                                         │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Subtitle: "Week 6 Mar – 12 Mar 2025"                            │
│ text-sm text-zinc-500                                            │
│                                                                  │
│ ┌── Section: Reason ─────────────────────────────────────────── │
│ │ border-t border-zinc-200/60 pt-8                               │
│ │                                                                │
│ │ Correction Reason (optional)                                   │
│ │ text-xs uppercase tracking-wider text-zinc-400 mb-1.5          │
│ │ [Input: e.g. "Overtime hours were miscalculated for 2         │
│ │  employees"]                                                   │
│ │ rounded-xl border-zinc-200/60 focus:ring-emerald-500           │
│ └────────────────────────────────────────────────────────────────│
│                                                                  │
│ ┌── Section: Correction Type ────────────────────────────────── │
│ │ border-t border-zinc-200/60 pt-8                               │
│ │                                                                │
│ │ "What do you want to correct?"                                 │
│ │ text-sm font-medium text-zinc-900 mb-4                         │
│ │                                                                │
│ │ ┌── Checkbox Group: space-y-3 ──────────────────────────────┐ │
│ │ │                                                            │ │
│ │ │ [x] Adjustments                                            │ │
│ │ │     "Modify deductions or additions"                       │ │
│ │ │     text-xs text-zinc-400                                  │ │
│ │ │                                                            │ │
│ │ │ [ ] Attendance                                             │ │
│ │ │     "Upload a corrected attendance file"                   │ │
│ │ │     text-xs text-zinc-400                                  │ │
│ │ │                                                            │ │
│ │ │ [ ] Employee data updated                                  │ │
│ │ │     "Recalculate with current employee directory data"     │ │
│ │ │     text-xs text-zinc-400                                  │ │
│ │ │                                                            │ │
│ │ │ Checkbox: emerald-600 accent when checked                  │ │
│ │ │ Label: text-sm text-zinc-700                               │ │
│ │ │ At least one required                                      │ │
│ │ └────────────────────────────────────────────────────────────┘ │
│ └────────────────────────────────────────────────────────────────│
│                                                                  │
│ ┌── Section: Adjustment Changes (if adjustments selected) ──── │
│ │ border-t border-zinc-200/60 pt-8                               │
│ │ (Reused table from F05 weekly review with additional actions:  │
│ │  reverse approved, re-approve skipped, add new adjustment)     │
│ └────────────────────────────────────────────────────────────────│
│                                                                  │
│ ┌── Section: Attendance Re-upload (if attendance selected) ──── │
│ │ border-t border-zinc-200/60 pt-8                               │
│ │ (Reused dropzone from F04)                                     │
│ └────────────────────────────────────────────────────────────────│
│                                                                  │
│ Actions: flex justify-end gap-3 pt-8 border-t                    │
│                    [Cancel]  [Recalculate & Preview →]           │
│ Cancel: outline, rounded-xl                                      │
│ Recalculate: emerald bg, rounded-xl, active:scale-[0.98]        │
│              Loading: shimmer bar + "Recalculating..."           │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Reason input | `Input` | Optional. `rounded-xl border-zinc-200/60 focus:ring-emerald-500` |
| Checkboxes | `Checkbox` + `Label` | Emerald accent. Description text below. At least one required for form submission |
| Adjustment review | Reused F05 table | With additional reverse/re-approve actions |
| Attendance dropzone | Reused F04 dropzone | Only visible when "Attendance" checkbox is selected |
| Recalculate | `Button` | Emerald bg. Triggers recalculation. Loading state: shimmer bar + status text |

---

## Screen 3: Revised Payroll Preview

Same as F06 Step 3 with these modifications:

### Layout Differences

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Revised Payroll"                                            │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Badge: "Revision 2" bg-amber-50 text-amber-700 rounded-full     │
│        text-xs px-2 py-0.5                                       │
│ Subtitle: "Week 6 Mar – 12 Mar 2025"                            │
│ text-sm text-zinc-500                                            │
│                                                                  │
│ ┌── Summary Table ─────────────────────────────────────────────┐│
│ │ (Same as F06 Step 3 table)                                     ││
│ │                                                                ││
│ │ Changed values have diff indicators:                           ││
│ │   Increased: text-emerald-600                                  ││
│ │   Decreased: text-rose-600                                     ││
│ │   Tooltip on hover: "Previous: ₹2,875.00"                     ││
│ │   text-xs bg-zinc-900 text-white rounded-lg px-2 py-1          ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Actions: flex justify-between pt-6                               │
│ [← Back]                              [Approve Revision]        │
│ Approve: emerald bg, rounded-xl, active:scale-[0.98]            │
│ AlertDialog: "Approve this revised payroll? The previous          │
│  revision will be superseded."                                   │
│ [Cancel] [Confirm Revision]                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Revision badge | `Badge` | `bg-amber-50 text-amber-700 rounded-full` — amber distinguishes revision from original |
| Diff indicators | Inline colored text | Increase: `text-emerald-600`. Decrease: `text-rose-600`. Both with `Tooltip` showing old value |
| Tooltip | `Tooltip` | `bg-zinc-900 text-white rounded-lg text-xs px-2 py-1`. Shows "Previous: ₹X,XXX.XX" |
| Approve | `Button` | Emerald bg. `AlertDialog` confirmation mentioning superseding |
