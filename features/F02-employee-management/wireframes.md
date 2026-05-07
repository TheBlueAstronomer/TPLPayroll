# F02 — Employee Management: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Employee List (`/employees`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Team Directory"                                             │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ (left-aligned)                    [Import ▼]  [+ Add Employee]   │
│                                                                  │
│ ┌── Filter Bar: flex gap-4, items-center ───────────────────────┐│
│ │ Search input (flex-1)         Status Select (w-[180px])       ││
│ │ rounded-xl bg-zinc-50         rounded-xl border-zinc-200/60   ││
│ │ border-zinc-200/60            focus:ring-emerald-500           ││
│ │ pl-10 (icon inset)                                            ││
│ │ <MagnifyingGlass size={16}                                    ││
│ │  text-zinc-400 />                                             ││
│ │ placeholder: "Search by                                       ││
│ │  name or ID..."                                               ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Table: divide-y divide-zinc-100 (NO card wrapper) ─────────┐│
│ │ Header row: text-xs uppercase tracking-wider text-zinc-400    ││
│ │ bg-zinc-50/50 font-medium                                     ││
│ │                                                                ││
│ │ ID          Name                Designation  Site     Status   ││
│ │ ──────────  ──────────────────  ───────────  ──────  ──────── ││
│ │ EMP-042     Lakshmi Venkatesh   Guard        North   ● Active ││
│ │ EMP-117     Arjun Mehrotra      Supervisor   South   ● Active ││
│ │ EMP-203     Farida Begum        Guard        East    ● Resigned│
│ │ EMP-089     Devendra Yadav      Guard        North   ○ Inactive│
│ │                                                                ││
│ │ ID: font-mono text-xs text-zinc-500                           ││
│ │ Name: text-sm font-medium text-zinc-900                       ││
│ │ Row hover: hover:bg-zinc-50/80                                ││
│ │ Row: cursor-pointer, clickable → /employees/[id]              ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Pagination: text-sm text-zinc-500                                │
│ "Showing 1–10 of 27"    [← Prev]  [1] [2] [3]  [Next →]       │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Styling & Behavior |
|---|---|---|
| Page header | `<h1>` | `text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900` |
| Add Employee | `Button` (default) | `bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-[0.98]` |
| Import dropdown | `DropdownMenu` | Trigger: `Button` variant `outline`, `rounded-xl`. Items: "Import from Excel", "Export to Excel" |
| Search | `Input` | `rounded-xl bg-zinc-50 border-zinc-200/60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`. Debounced 300ms. Icon: Phosphor `MagnifyingGlass` size 16 text-zinc-400, absolute positioned left |
| Status filter | `Select` | `rounded-xl border-zinc-200/60`. Options: All, Active, Inactive, Resigned |
| Table | `Table` | NO card wrapper. `divide-y divide-zinc-100`. Header: `text-xs uppercase tracking-wider text-zinc-400 font-medium bg-zinc-50/50`. Sortable columns |
| Status badge | Custom dot + text | Active: `<Circle weight="fill" size={8} className="text-emerald-500" />` + `text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium`. Inactive: zinc dot + `text-zinc-400 bg-zinc-100`. Resigned: rose dot + `text-rose-600 bg-rose-50` |
| Row data | Mixed typography | ID: `font-mono text-xs text-zinc-500`. Name: `text-sm font-medium text-zinc-900`. Other: `text-sm text-zinc-600` |
| Pagination | `Pagination` | `text-sm text-zinc-500`. Active page: `bg-emerald-50 text-emerald-700 rounded-lg` |

### Motion Specs

- **Row stagger:** On mount, rows reveal sequentially via `animation-delay: calc(var(--index) * 60ms)`, `opacity: 0→1`, `translateY(4px)→0`
- **Row hover:** `transition-colors duration-200`

### Interactive States

- **Loading:** 5× skeleton rows matching table column widths. Shimmer animation
- **Empty:** Centered composition: Phosphor `UsersThree` icon (size 48, text-zinc-200), heading "No team members yet" (`text-lg font-medium text-zinc-600`), body "Add your first employee to get started" (`text-sm text-zinc-400`), CTA "Add Employee" button (emerald bg, `rounded-xl`)
- **Error:** Centered: `WarningCircle` icon, "Failed to load employees", "Try again" button

---

## Screen 2: Add / Edit Employee (`/employees/new` or `/employees/[id]/edit`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to directory]                                            │
│ Button variant ghost, text-sm text-zinc-500                      │
│ <ArrowLeft size={16} />                                          │
│                                                                  │
│ h1: "Add Employee" / "Edit — Lakshmi Venkatesh"                  │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Section: Personal Details ──────────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8 (NO card wrapper)            ││
│ │ Section label: text-sm font-medium text-zinc-900 mb-6         ││
│ │                                                                ││
│ │ grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5              ││
│ │                                                                ││
│ │  Employee ID*          Employee Name*                          ││
│ │  [EMP-042]             [Lakshmi Venkatesh]                     ││
│ │                                                                ││
│ │  Designation*          Designation Short                       ││
│ │  [Guard]               [GRD]                                   ││
│ │                                                                ││
│ │  National ID           Aadhaar ID                              ││
│ │  [________]            [________]                              ││
│ │                                                                ││
│ │  Date of Birth         Phone                                   ││
│ │  [calendar picker]     [+91 98765 43210]                       ││
│ │                                                                ││
│ │  Date of Joining       Site                                    ││
│ │  [calendar picker]     [North Gate]                            ││
│ │                                                                ││
│ │  Police Verif ID       Health Card ID                          ││
│ │  [________]            [________]                              ││
│ │                                                                ││
│ │  Label: text-xs font-medium uppercase tracking-wider           ││
│ │         text-zinc-400 mb-1.5                                   ││
│ │  Input: rounded-xl bg-white border-zinc-200/60                ││
│ │         focus:ring-2 focus:ring-emerald-500/20                 ││
│ │         focus:border-emerald-500                               ││
│ │  Required: * after label in text-rose-500                      ││
│ │  Error: text-rose-600 text-xs mt-1                             ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Section: Compensation ──────────────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8                               ││
│ │ grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5              ││
│ │                                                                ││
│ │  Monthly Salary (₹)*     Hourly Rate (₹)*                     ││
│ │  [14,375]                [68.75]                               ││
│ │  Input type: number, step: 0.01                                ││
│ │  Values in font-mono tabular-nums                              ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Section: Payment Details ───────────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8                               ││
│ │ grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5              ││
│ │                                                                ││
│ │  GPay Number             Bank Account                          ││
│ │  [98765 43210]           [HDFC xxxxxx1234]                     ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Section: Status ────────────────────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8                               ││
│ │ flex items-center gap-x-8                                      ││
│ │                                                                ││
│ │  Active*                 Date of Resignation                   ││
│ │  [Switch: ON]            [calendar — disabled unless inactive] ││
│ │  Switch: emerald-600 when on                                   ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Actions: flex justify-end gap-3 pt-8 border-t ─────────────┐│
│ │                        [Cancel]  [Save Employee]               ││
│ │ Cancel: variant outline, rounded-xl                            ││
│ │ Save: bg-emerald-600 text-white rounded-xl active:scale-[0.98]││
│ │ Save loading: skeleton shimmer bar inside button               ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Back link | `Button` ghost | Phosphor `ArrowLeft` size 16. Navigates to `/employees` |
| Form sections | `border-t border-zinc-200/60 pt-8` | Dividers — NO card wrappers. Section title: `text-sm font-medium text-zinc-900 mb-6` |
| Text inputs | `Label` + `Input` | Label: `text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5`. Input: `rounded-xl bg-white border-zinc-200/60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-zinc-900` |
| Number inputs | `Input` type number | Step 0.01. Display: `font-mono tabular-nums` |
| Date pickers | `Popover` + `Calendar` | Calendar: emerald accent on selected date |
| Active toggle | `Switch` | Emerald-600 when on, zinc-200 when off |
| Employee ID | `Input` disabled in edit | `bg-zinc-50 text-zinc-500 cursor-not-allowed` |
| Required indicator | `*` | `text-rose-500` after label text |
| Validation errors | `<p>` | `text-rose-600 text-xs mt-1` below each field |
| Cancel | `Button` outline | `rounded-xl`. Navigates back |
| Save | `Button` default | `bg-emerald-600 text-white rounded-xl active:scale-[0.98]`. Loading: shimmer bar in button |
| Form lib | `react-hook-form` + `zod` | Client-side validation with server backup |

---

## Screen 3: Employee Profile (`/employees/[id]`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to directory]                                            │
│                                                                  │
│ ┌── Header Row: flex justify-between items-start ───────────────┐│
│ │ Left:                                                          ││
│ │  h1: "Lakshmi Venkatesh"                                       ││
│ │  text-2xl font-semibold tracking-tight text-zinc-900           ││
│ │  flex items-center gap-3                                       ││
│ │  + Status badge: ● Active (emerald dot + text)                 ││
│ │                                                                ││
│ │  Subtitle: "EMP-042"                                           ││
│ │  font-mono text-xs text-zinc-400                               ││
│ │                                                                ││
│ │ Right:                                                         ││
│ │  [Edit] Button outline rounded-xl                              ││
│ │  [Deactivate] Button variant destructive (rose)                ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Content: grid grid-cols-1 md:grid-template-columns: 2fr 1fr ┐│
│ │                gap-8 pt-8                                      ││
│ │                                                                ││
│ │ ┌─ Left Column (2fr) ──────────────────────────────────────┐  ││
│ │ │ Section: "Personal Details"                               │  ││
│ │ │ border-t border-zinc-200/60 pt-6                          │  ││
│ │ │                                                           │  ││
│ │ │ <dl> grid grid-cols-2 gap-y-4 gap-x-8                    │  ││
│ │ │ dt: text-xs uppercase tracking-wider text-zinc-400        │  ││
│ │ │ dd: text-sm text-zinc-900                                 │  ││
│ │ │                                                           │  ││
│ │ │ Designation    Guard                                      │  ││
│ │ │ Site           North Gate                                 │  ││
│ │ │ Phone          +91 98765 43210                            │  ││
│ │ │ Date of Birth  15 Jan 1988                                │  ││
│ │ │ Date Joined    01 Mar 2023                                │  ││
│ │ └──────────────────────────────────────────────────────────┘  ││
│ │                                                                ││
│ │ ┌─ Right Column (1fr) ─────────────────────────────────────┐  ││
│ │ │ Section: "Compensation"                                   │  ││
│ │ │ border-t border-zinc-200/60 pt-6                          │  ││
│ │ │ Salary    ₹14,375   font-mono tabular-nums                │  ││
│ │ │ Hourly    ₹68.75    font-mono tabular-nums                │  ││
│ │ │                                                           │  ││
│ │ │ Section: "Payment"                                        │  ││
│ │ │ border-t border-zinc-200/60 pt-6 mt-6                     │  ││
│ │ │ GPay     +91 98765 43210                                  │  ││
│ │ │ Bank     HDFC xxxxxx1234                                  │  ││
│ │ └──────────────────────────────────────────────────────────┘  ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Wage History: border-t border-zinc-200/60 pt-8 ─────────────┐│
│ │ Section label: "Wage History"                                   ││
│ │ text-sm font-medium text-zinc-900 mb-4                         ││
│ │                                                                ││
│ │ Table: divide-y divide-zinc-100                                ││
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │                                                                ││
│ │ Effective From   Effective To   Salary      Hourly    Source   ││
│ │ ──────────────   ────────────   ─────────   ────────  ─────── ││
│ │ 01 Jun 2025      Current        ₹14,375     ₹68.75    Manual  ││
│ │ 01 Mar 2025      31 May 2025    ₹12,500     ₹62.50    Import  ││
│ │ 01 Mar 2023      28 Feb 2025    ₹10,200     ₹52.30    Import  ││
│ │                                                                ││
│ │ All amounts: font-mono tabular-nums text-zinc-800              ││
│ │ Dates: text-sm text-zinc-600                                   ││
│ │ Source badge: text-xs rounded-full px-2 py-0.5                 ││
│ │   Manual: bg-emerald-50 text-emerald-700                       ││
│ │   Import: bg-zinc-100 text-zinc-500                            ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Name header | `<h1>` + badge | `text-2xl font-semibold tracking-tight text-zinc-900`. Status: emerald/rose/zinc dot badge |
| Employee ID | `<span>` | `font-mono text-xs text-zinc-400` |
| Edit button | `Button` outline | `rounded-xl`. Navigates to `/employees/[id]/edit` |
| Deactivate | `Button` destructive | Rose bg. Triggers `AlertDialog` confirmation |
| Detail sections | `border-t border-zinc-200/60 pt-6` | NO card wrappers |
| Detail fields | `<dl>` | `dt`: `text-xs uppercase tracking-wider text-zinc-400`. `dd`: `text-sm text-zinc-900` |
| Wage History | `Table` | `divide-y divide-zinc-100`. Currency: `font-mono tabular-nums`. Source: colored badge |
| Confirmation | `AlertDialog` | "Deactivate this employee? They will be excluded from future payroll runs." |
| Loading | Skeleton | Per-section skeleton blocks |
