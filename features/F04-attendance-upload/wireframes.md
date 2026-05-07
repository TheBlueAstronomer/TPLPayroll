# F04 — Attendance Upload: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Attendance Upload Page (`/attendance`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Attendance Upload"                                          │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Current Uploads: divide-y divide-zinc-100 ─────────────────┐│
│ │  Section label: "Recent Uploads"                               ││
│ │  text-sm font-medium text-zinc-900 mb-4                        ││
│ │                                                                ││
│ │  Table: NO card wrapper                                        ││
│ │  Header: text-xs uppercase tracking-wider text-zinc-400        ││
│ │                                                                ││
│ │  Week                File            Status      Actions      ││
│ │  ──────────────────  ──────────────  ──────────  ──────────── ││
│ │  6 Mar – 12 Mar      attend.xlsx     Ready       [View][Replace]│
│ │  27 Feb – 5 Mar      week9.xlsx      Errors      [View][Replace]│
│ │                                                                ││
│ │  Week: text-sm text-zinc-900                                   ││
│ │  File: font-mono text-xs text-zinc-500                         ││
│ │  Status badges:                                                ││
│ │    Ready: <CheckCircle size={14} text-emerald-500 />           ││
│ │           + "Ready" text-emerald-700 bg-emerald-50             ││
│ │             rounded-full text-xs px-2 py-0.5                   ││
│ │    Errors: <WarningCircle size={14} text-amber-500 />          ││
│ │            + "Errors" text-amber-700 bg-amber-50               ││
│ │              rounded-full text-xs px-2 py-0.5                  ││
│ │  View: Button ghost, text-sm                                   ││
│ │  Replace: Button outline, text-sm                              ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Upload New: pt-8 border-t border-zinc-200/60 ──────────────┐│
│ │  Section label: "Upload New Attendance"                        ││
│ │  text-sm font-medium text-zinc-900 mb-4                        ││
│ │                                                                ││
│ │  Dropzone: rounded-2xl border-2 border-dashed                  ││
│ │  border-zinc-200 bg-zinc-50/50                                 ││
│ │  hover:border-emerald-400 hover:bg-emerald-50/20               ││
│ │  transition-all duration-300                                   ││
│ │  p-10 text-center                                              ││
│ │                                                                ││
│ │  <UploadSimple size={32} text-zinc-300 mx-auto mb-3 />         ││
│ │  "Drag and drop your attendance file here"                     ││
│ │  text-sm font-medium text-zinc-600                             ││
│ │  "or click to browse"                                          ││
│ │  text-xs text-zinc-400                                         ││
│ │  "Supported: .xls, .xlsx"                                      ││
│ │  text-xs text-zinc-300 mt-2                                    ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Replace confirmation:                                            │
│ AlertDialog: "An attendance file already exists for this week.   │
│ Uploading a new file will replace the existing data. Continue?"  │
│ Actions: [Cancel] [Replace File]                                 │
│ Replace: bg-amber-600 text-white rounded-xl                     │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Upload table | `Table` | NO card wrapper. `divide-y divide-zinc-100` |
| Status badge | Phosphor icon + text | Ready: `CheckCircle` emerald. Errors: `WarningCircle` amber. Both `rounded-full text-xs px-2 py-0.5` |
| View button | `Button` ghost, `sm` | Opens preview for that upload |
| Replace button | `Button` outline, `sm` | Triggers `AlertDialog` confirmation |
| Dropzone | Custom `Input` file | Same treatment as F03 dropzone |
| Replace dialog | `AlertDialog` | Amber-tinted warning. Replace button: `bg-amber-600` |

### Interactive States

- **Loading:** Skeleton rows for upload table
- **Empty uploads:** "No attendance files uploaded yet. Upload your first file above." with `CalendarBlank` icon (size 48, text-zinc-200)

---

## Screen 2: Payroll Week Selection (conditional dialog)

Shown when payroll week cannot be auto-detected from file.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Dialog: rounded-2xl max-w-sm                       │
│                                                     │
│  h2: "Select Payroll Week"                      [X] │
│  text-lg font-semibold tracking-tight text-zinc-900 │
│                                                     │
│  p: "We couldn't detect the payroll week from       │
│  the uploaded file. Please select dates manually."   │
│  text-sm text-zinc-500 leading-relaxed              │
│                                                     │
│  ┌─ Form: space-y-5 ─────────────────────────────┐ │
│  │                                                 │ │
│  │  Week Start Date                                │ │
│  │  text-xs uppercase tracking-wider text-zinc-400 │ │
│  │  [Calendar Picker]                              │ │
│  │  rounded-xl border-zinc-200/60                  │ │
│  │  focus:ring-emerald-500                         │ │
│  │                                                 │ │
│  │  Week End Date                                  │ │
│  │  [Calendar Picker]                              │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Warning (conditional) ────────────────────────┐ │
│  │  Alert: bg-amber-50/50 border border-amber-200  │ │
│  │  rounded-xl p-3                                 │ │
│  │  <WarningCircle size={16} text-amber-500 />     │ │
│  │  "Standard payroll week runs Thursday to         │ │
│  │   Wednesday"                                     │ │
│  │  text-sm text-amber-700                          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  Actions: flex justify-end gap-3 pt-4               │
│                          [Cancel]  [Confirm]        │
│  Confirm: emerald bg, rounded-xl                    │
│           disabled until both dates selected         │
│           active:scale-[0.98]                       │
└─────────────────────────────────────────────────────┘
```

---

## Screen 3: Attendance Import Preview (`/attendance/[id]/preview`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to attendance]                                           │
│ h1: "Attendance Preview"                                         │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│ Subtitle: "Week 6 Mar – 12 Mar 2025"                            │
│ text-sm text-zinc-500                                            │
│                                                                  │
│ ┌── Status Banner ─────────────────────────────────────────────┐│
│ │  BLOCKED variant:                                             ││
│ │  bg-rose-50 border border-rose-200/60 rounded-xl p-4          ││
│ │  <Prohibit size={20} className="text-rose-500" />              ││
│ │  "Payroll Blocked" text-sm font-semibold text-rose-700         ││
│ │  "2 unmatched employees, 1 inactive"                           ││
│ │  text-sm text-rose-600                                         ││
│ │                                                                ││
│ │  READY variant:                                                ││
│ │  bg-emerald-50 border border-emerald-200/60 rounded-xl p-4    ││
│ │  <CheckCircle size={20} className="text-emerald-500" />        ││
│ │  "Ready for Payroll" text-sm font-semibold text-emerald-700    ││
│ │  "All employees matched"                                       ││
│ │  text-sm text-emerald-600                                      ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Summary Strip: flex divide-x divide-zinc-200 py-4 ─────────┐│
│ │  border-t border-b border-zinc-200/60                          ││
│ │  Total: 17  Matched: 15  Unmatched: 2  Errors: 1              ││
│ │  label: text-xs uppercase tracking-wider text-zinc-400         ││
│ │  value: text-lg font-mono tabular-nums font-semibold           ││
│ │  Unmatched/Errors: text-rose-600                               ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Attendance Table: divide-y divide-zinc-100 ────────────────┐│
│ │  Header: text-xs uppercase tracking-wider text-zinc-400        ││
│ │                                                                ││
│ │  Employee          Status       Reg Hrs  OT Hrs  Sheet        ││
│ │  ────────────────  ───────────  ───────  ──────  ──────────── ││
│ │  Lakshmi Venkatesh  Matched     48.0     6.5     Sheet1       ││
│ │  Arjun Mehrotra     Matched     40.0     0.0     Sheet1       ││
│ │  Unknown Name       Unmatched   56.0     8.0     Sheet2       ││
│ │  Devendra Yadav     Inactive    44.0     4.0     Sheet2       ││
│ │                                                                ││
│ │  Status icons:                                                 ││
│ │    Matched: <CheckCircle size={14} text-emerald-500 />         ││
│ │             text-emerald-700                                   ││
│ │    Unmatched: <XCircle size={14} text-rose-500 />              ││
│ │               text-rose-600                                    ││
│ │    Inactive: <WarningCircle size={14} text-amber-500 />        ││
│ │              text-amber-600                                    ││
│ │  Hours: font-mono tabular-nums text-sm text-zinc-800           ││
│ │  Sheet: font-mono text-xs text-zinc-400                        ││
│ │  Row hover: hover:bg-zinc-50/80                                ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Help Text ─────────────────────────────────────────────────┐│
│ │  <Info size={16} text-zinc-400 />                              ││
│ │  "To resolve: update the employee directory or upload a        ││
│ │   corrected attendance file."                                  ││
│ │  text-sm text-zinc-500                                         ││
│ └───────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Status banner (blocked) | `Alert` | `bg-rose-50 border-rose-200/60 rounded-xl`. Icon: Phosphor `Prohibit` |
| Status banner (ready) | `Alert` | `bg-emerald-50 border-emerald-200/60 rounded-xl`. Icon: Phosphor `CheckCircle` |
| Summary strip | `div` flex `divide-x` | Same pattern as F03 preview. `border-t border-b` |
| Attendance table | `Table` | `divide-y divide-zinc-100`. Status: Phosphor icons with colored text. Hours: `font-mono tabular-nums` |
| Status tooltip | `Tooltip` | On hover, shows detailed reason (e.g. "No matching Employee ID found in directory") |
| Help text | `<p>` | `Info` icon + guidance. `text-sm text-zinc-500` |
