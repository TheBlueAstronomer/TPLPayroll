# F03 — Employee Import / Export: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen 1: Import Upload Dialog

Triggered from Employee List via "Import" dropdown → "Import from Excel".

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Dialog: rounded-2xl, max-w-md                      │
│  bg-white border border-zinc-200/60                 │
│  shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]       │
│                                                     │
│  h2: "Import Employee Master"                   [X] │
│  text-lg font-semibold tracking-tight text-zinc-900 │
│                                                     │
│  p: "Upload an .xlsx file with the sheet            │
│  'Employee Master List' to import employees."       │
│  text-sm text-zinc-500 leading-relaxed              │
│                                                     │
│  ┌─ Dropzone ─────────────────────────────────────┐ │
│  │  rounded-2xl border-2 border-dashed            │ │
│  │  border-zinc-200 bg-zinc-50/50                 │ │
│  │  hover:border-emerald-400                      │ │
│  │  hover:bg-emerald-50/20                        │ │
│  │  transition-all duration-300                   │ │
│  │  p-10 text-center                              │ │
│  │                                                │ │
│  │  <UploadSimple size={32}                       │ │
│  │   className="text-zinc-300 mx-auto mb-3" />    │ │
│  │                                                │ │
│  │  "Drag and drop your file here"                │ │
│  │  text-sm font-medium text-zinc-600             │ │
│  │                                                │ │
│  │  "or click to browse"                          │ │
│  │  text-xs text-zinc-400                         │ │
│  │                                                │ │
│  │  "Supported: .xlsx"                            │ │
│  │  text-xs text-zinc-300 mt-2                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Selected file state ──────────────────────────┐ │
│  │  flex items-center gap-3 bg-emerald-50/50      │ │
│  │  rounded-xl p-3 border border-emerald-200/50   │ │
│  │  <FileXls size={20} text-emerald-600 />        │ │
│  │  "employees_master.xlsx"                       │ │
│  │  text-sm font-medium text-zinc-700             │ │
│  │  <X size={16} text-zinc-400 /> (remove)        │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  Actions: flex justify-end gap-3 pt-4               │
│                       [Cancel]  [Upload]             │
│  Cancel: outline, rounded-xl                         │
│  Upload: emerald bg, rounded-xl, disabled until      │
│          file selected. Loading: shimmer bar          │
│          active:scale-[0.98]                         │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Dialog | `Dialog`, `DialogContent` | `rounded-2xl max-w-md`. Overlay: `bg-zinc-950/40 backdrop-blur-sm` |
| Dropzone | Custom `Input` type file | Styled drag-and-drop. Active drag: `border-emerald-500 bg-emerald-50/30`. Shows file name after selection with `FileXls` icon |
| Cancel | `Button` outline | `rounded-xl`. Closes dialog |
| Upload | `Button` default | `bg-emerald-600 rounded-xl active:scale-[0.98]`. Disabled until file selected. Loading: Phosphor `SpinnerGap` with `animate-spin` |

---

## Screen 2: Import Preview (`/employees/import/preview`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back to directory]                                            │
│ h1: "Import Preview"                                             │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Summary Strip: flex divide-x divide-zinc-200 ──────────────┐│
│ │  border-t border-b border-zinc-200/60 py-4                    ││
│ │  NO card wrappers — horizontal stat strip                      ││
│ │                                                                ││
│ │  Total Rows    Valid     Invalid   Duplicates  New    Updates  ││
│ │  27            22        3         2           17     5        ││
│ │                                                                ││
│ │  label: text-xs uppercase tracking-wider text-zinc-400         ││
│ │  value: text-lg font-mono tabular-nums font-semibold           ││
│ │         text-zinc-900                                          ││
│ │  px-6 per stat block                                           ││
│ │  Invalid count: text-rose-600                                  ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Tabs: border-b border-zinc-200/60 ─────────────────────────┐│
│ │  [Valid Rows]  [Invalid Rows]  [Duplicates]                    ││
│ │  Active: border-b-2 border-emerald-500 text-emerald-700       ││
│ │          font-medium                                           ││
│ │  Inactive: text-zinc-400 hover:text-zinc-600                   ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Valid Rows Tab ────────────────────────────────────────────┐ │
│ │  Table: divide-y divide-zinc-100                              │ │
│ │  Header: text-xs uppercase tracking-wider text-zinc-400       │ │
│ │                                                               │ │
│ │  Row  Emp ID    Name                Designation  Action       │ │
│ │  ───  ────────  ──────────────────  ───────────  ──────────  │ │
│ │  2    EMP-042   Lakshmi Venkatesh   Guard        Update      │ │
│ │  3    EMP-218   Priya Chakraborty   Supervisor   Create      │ │
│ │                                                               │ │
│ │  Action badge:                                                │ │
│ │    Create: bg-emerald-50 text-emerald-700 rounded-full        │ │
│ │            text-xs px-2 py-0.5                                │ │
│ │    Update: bg-sky-50 text-sky-700 rounded-full                │ │
│ │            text-xs px-2 py-0.5                                │ │
│ │  Row#: font-mono text-xs text-zinc-400                        │ │
│ │  ID: font-mono text-xs text-zinc-500                          │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌── Invalid Rows Tab ──────────────────────────────────────────┐ │
│ │  Row  Emp ID    Name              Errors                      │ │
│ │  ───  ────────  ────────────────  ──────────────────────────  │ │
│ │  5    —         Suresh Narayanan  Missing Employee ID         │ │
│ │  12   EMP-008   —                 Missing Name, Invalid Salary│ │
│ │                                                               │ │
│ │  Error text: text-rose-600 text-xs                            │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Actions: flex justify-end gap-3 pt-6                             │
│                     [Cancel Import]  [Confirm Import]            │
│ Cancel: outline, rounded-xl                                      │
│ Confirm: emerald bg, rounded-xl, active:scale-[0.98]            │
│          Loading: shimmer bar in button                          │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Summary strip | `div` flex with `divide-x` | Horizontal stat bar. NO cards. `border-t border-b border-zinc-200/60 py-4`. Invalid count highlighted in `text-rose-600` |
| Tabs | `Tabs`, `TabsList`, `TabsTrigger` | Underline style. Active: `border-b-2 border-emerald-500 text-emerald-700`. Inactive: `text-zinc-400` |
| Data tables | `Table` | `divide-y divide-zinc-100`. Header: `text-xs uppercase tracking-wider text-zinc-400` |
| Action badge | `<span>` | Desaturated. Create: `bg-emerald-50 text-emerald-700`. Update: `bg-sky-50 text-sky-700`. Both `rounded-full text-xs px-2 py-0.5` |
| Error text | Inline | `text-rose-600 text-xs` |
| Confirm | `Button` | Executes import. Success: `Toast` "22 employees imported successfully" (emerald-tinted) |

---

## Screen 3: Import Result

After import confirmation — shown as a dialog.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Dialog: rounded-2xl max-w-sm                       │
│                                                     │
│  h2: "Import Complete"                          [X] │
│  text-lg font-semibold tracking-tight text-zinc-900 │
│                                                     │
│  ┌─ Results list: space-y-3 ──────────────────────┐ │
│  │                                                 │ │
│  │  <CheckCircle size={16} text-emerald-500 />     │ │
│  │  "17 employees created"                         │ │
│  │  text-sm text-zinc-700                          │ │
│  │                                                 │ │
│  │  <ArrowsClockwise size={16} text-sky-500 />     │ │
│  │  "5 employees updated"                          │ │
│  │                                                 │ │
│  │  <XCircle size={16} text-rose-500 />            │ │
│  │  "3 rows rejected"                              │ │
│  │                                                 │ │
│  │  <WarningCircle size={16} text-amber-500 />     │ │
│  │  "2 duplicate rows processed"                   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  p: "Source file has been deleted."                  │
│  text-xs text-zinc-400 mt-4                          │
│                                                     │
│  Actions: pt-4                                       │
│                         [View Employees]             │
│  Button: emerald bg, rounded-xl, full-width          │
│          active:scale-[0.98]                         │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Dialog | `Dialog`, `DialogContent` | `rounded-2xl max-w-sm` |
| Result items | List with Phosphor icons | Each: flex items-center gap-2. Icons: `CheckCircle`, `ArrowsClockwise`, `XCircle`, `WarningCircle`. Counts in `font-mono font-medium` |
| View button | `Button` | Navigates to `/employees`. Full width, emerald bg |
