# F07 — Payroll Reports & Slips: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Report Generation (part of approved payroll view)

Shown on the payroll approval confirmation page (F06 Step 4) and on the existing payroll run detail page.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Payroll — Week 6 Mar – 12 Mar 2025"                        │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Badge: "Approved" bg-emerald-50 text-emerald-700 rounded-full   │
│        text-xs px-2 py-0.5                                       │
│                                                                  │
│ ┌── Reports Section: border-t border-zinc-200/60 pt-8 ─────────┐│
│ │ Section label: "Reports"                                       ││
│ │ text-sm font-medium text-zinc-900 mb-6                         ││
│ │                                                                ││
│ │ ┌── Report Row: flex items-start gap-4 py-4 ────────────────┐ ││
│ │ │ border-b border-zinc-100                                    │ ││
│ │ │                                                             │ ││
│ │ │ <FileText size={24} className="text-zinc-400 mt-0.5" />    │ ││
│ │ │                                                             │ ││
│ │ │ div (flex-1):                                               │ ││
│ │ │   "Payroll Summary Report"                                  │ ││
│ │ │   text-sm font-medium text-zinc-900                         │ ││
│ │ │   "A tabular summary of all employees' payroll for          │ ││
│ │ │    this week."                                               │ ││
│ │ │   text-sm text-zinc-500                                     │ ││
│ │ │                                                             │ ││
│ │ │ [Download PDF Summary]                                      │ ││
│ │ │ Button outline sm, rounded-xl                               │ ││
│ │ │ <DownloadSimple size={14} /> icon                           │ ││
│ │ │ active:scale-[0.98]                                         │ ││
│ │ └─────────────────────────────────────────────────────────────┘ ││
│ │                                                                ││
│ │ ┌── Report Row: flex items-start gap-4 py-4 ────────────────┐ ││
│ │ │                                                             │ ││
│ │ │ <Package size={24} className="text-zinc-400 mt-0.5" />     │ ││
│ │ │                                                             │ ││
│ │ │ div (flex-1):                                               │ ││
│ │ │   "Employee Payroll Slips"                                  │ ││
│ │ │   text-sm font-medium text-zinc-900                         │ ││
│ │ │   "Individual payroll slips for all 15 employees."          │ ││
│ │ │   text-sm text-zinc-500                                     │ ││
│ │ │                                                             │ ││
│ │ │ [Generate & Download ZIP]                                   │ ││
│ │ │ Button outline sm, rounded-xl                               │ ││
│ │ │ <DownloadSimple size={14} /> icon                           │ ││
│ │ └─────────────────────────────────────────────────────────────┘ ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Payroll Summary: border-t border-zinc-200/60 pt-8 ─────────┐│
│ │ Section label: "Payroll Summary"                               ││
│ │ (Same table as F06 Step 3 — inline preview)                    ││
│ │ divide-y divide-zinc-100, font-mono tabular-nums              ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Report section | `border-t border-zinc-200/60 pt-8` | NO card wrapper. Section divider |
| Report rows | `div` flex | Icon + content + button. `border-b border-zinc-100 py-4`. Icons: Phosphor `FileText`, `Package` |
| PDF button | `Button` outline sm | Phosphor `DownloadSimple`. Loading: shimmer bar in button. Success: `Toast` "PDF downloaded" |
| Slips button | `Button` outline sm | Multi-step progress. Loading: `Progress` bar below button showing generation stages. Success: `Toast` "Slips downloaded" |
| Progress | `Progress` bar | `h-1 bg-zinc-100 rounded-full`. Fill: `bg-emerald-500 rounded-full transition-all` |
| Toast | `Toast` | Emerald-tinted for success, Rose-tinted for error |
| Inline table | `Table` reused | F06 Step 3 table component |

---

## Payroll Slip PDF Layout (per employee)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                     WEEKLY PAYROLL SLIP                           │
│                     Font: Geist Mono                             │
│                     text-xs uppercase tracking-widest            │
│                     text-center                                  │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ Employee ID:  EMP-042           Designation: Guard                │
│ Employee:     Lakshmi Venkatesh Site: North Gate                  │
│ GPay:         +91 98765 43210   Bank: HDFC xxxxxx1234            │
│                                                                  │
│ Payroll Week: 6 Mar 2025 – 12 Mar 2025                          │
│                                                                  │
│ Labels: text-zinc-500 (left-aligned)                             │
│ Values: text-zinc-900 font-mono (right-aligned or tab-aligned)   │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ ATTENDANCE                                                       │
│ Section header: uppercase tracking-wider text-zinc-500           │
│                                                                  │
│ Day        Date       Regular Hrs  Overtime Hrs                  │
│ ─────────  ─────────  ───────────  ────────────                  │
│ Thursday   6 Mar      8.00         2.00                          │
│ Friday     7 Mar      8.00         0.00                          │
│ Saturday   8 Mar      6.00         0.00                          │
│ Sunday     9 Mar      0.00         0.00                          │
│ Monday     10 Mar     8.00         3.50                          │
│ Tuesday    11 Mar     8.00         1.00                          │
│ Wednesday  12 Mar     8.00         0.00                          │
│ ─────────  ─────────  ───────────  ────────────                  │
│ TOTAL                 46.00        6.50                          │
│                                                                  │
│ All numbers: Geist Mono, tabular-nums, right-aligned             │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ EARNINGS                                                         │
│                                                                  │
│ Regular Pay (46.00 hrs x ₹62.50):         ₹2,875.00             │
│ Overtime Pay (6.50 hrs x ₹62.50):         ₹406.25               │
│                                           ──────────             │
│ Gross Wage:                               ₹3,281.25             │
│                                                                  │
│ Additions:                                +₹200.00              │
│ Deductions:                               -₹2,150.00            │
│                                           ──────────             │
│ NET PAYABLE:                              ₹1,331.25             │
│                                                                  │
│ Net payable: bold, larger text                                   │
│ Currency: right-aligned, Geist Mono, tabular-nums                │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ Generated: 13 Mar 2025                                           │
│ text-zinc-400 text-xs                                            │
└──────────────────────────────────────────────────────────────────┘
```

### PDF Generation Notes

- Use a PDF library like `@react-pdf/renderer`, `pdfmake`, or `jspdf`
- Font: `Geist Mono` for all numeric data, `Geist` for labels
- Simple layout — no branding, no logos
- Currency amounts right-aligned with `tabular-nums` alignment
- Clear visual hierarchy with horizontal rules (`border-t` equivalents)
- Section headers: uppercase, tracking-wider
- Net Payable: visually emphasized with larger weight
