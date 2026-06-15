# E03 — Shortened Employee IDs: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4
> **Parent Feature:** F02 — Employee Management

---

## Screen E03-A: Team Directory — Enhanced Employee ID Column

Displays the shortened 12-character Employee ID (e.g. `TPLGOAHLP007` instead of `TPLGOAHLP002007`) in the ID column.

### Layout

```
┌── Team Directory ────────────────────────────────────────────────────────┐
│                                                                          │
│  [Search by name or ID…]  [All Designations]  [All Sites]  [All Status]  │
│                                                                          │
│  [ ]  ID            NAME                 DESIGNATION   SITE      STATUS  │
│  ───  ────────────  ───────────────────  ────────────  ────────  ──────  │
│                                                                          │
│  [ ]  TPLGOAHLP007  Suresh Narayanan    Guard         North     Active  │
│                                                                          │
│  [ ]  TPLGOAHLP008  Amit Shinde          Supervisor    Main      Active  │
│                                                                          │
│  [ ]  TPLGOAHLP012  Vijay Deshmukh       Guard         West      Inactive│
│                                                                          │
│  ID: font-mono text-xs text-zinc-500                                     │
│  Row animation: fadeSlideIn 0.3s ease with incremental delays            │
│  Checkbox: w-4 h-4 rounded border-zinc-300 text-emerald-600              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| ID Column | `<td>` | Renders `emp.employeeId` wrapped in a monospace font span (`font-mono text-xs text-zinc-500`). |
| Search Input | `<input>` | Matches search queries on both the name and the new 12-character shortened ID format. |

---

## Screen E03-B: Add Employee Form — ID Validation

The Employee ID field is enabled in creation mode, accepting 12 characters, and disabled in edit mode.

### Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Add Employee                                                            │
│                                                                          │
│  Personal Details                                                        │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Employee ID *                             Employee Name *               │
│  ┌──────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ TPLGOAHLP008                         │  │ Lakshmi Venkatesh        │  │
│  └──────────────────────────────────────┘  └──────────────────────────┘  │
│  Error: text-xs text-rose-600 mt-0.5                                     │
│  (e.g., "Employee ID 'TPLGOAHLP008' already exists")                     │
│                                                                          │
│  Designation *                             Designation Short             │
│  ┌──────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Guard                                │  │ GRD                      │  │
│  └──────────────────────────────────────┘  └──────────────────────────┘  │
│                                                                          │
│  ... other form fields ...                                               │
│                                                                          │
│                                                     [Cancel]  [Save]     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Employee ID Input | `input` | Enabled in creation mode; placeholder: `EMP-042`. On submission, it is validated using `CreateEmployeeSchema` which parses and validates the 12-character format. Disabled in edit mode (`disabled={isEdit}`). |
| Inline Error | `<p>` | Displays a validation error if the parsed ID is not valid or is a duplicate ID (triggering `DUPLICATE_EMPLOYEE_ID`). `text-rose-600 text-xs mt-0.5`. |

---

## Screen E03-C: Employee Profile Header

Displays the shortened 12-character Employee ID in the profile header metadata strip.

### Layout

```
┌── Employee Profile ──────────────────────────────────────────────────────┐
│                                                                          │
│  [← Back to directory]                                                   │
│                                                                          │
│  ┌── Profile Header ──────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  Suresh Narayanan                                                  │  │
│  │  TPLGOAHLP007                                                      │  │
│  │                                                                    │  │
│  │  Guard  •  North Gate  •  [ Active ]                               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ID Subtitle: font-mono text-xs text-zinc-400 mt-1                       │
│  Status Badge: variant-based on state (Active / Inactive / Resigned)    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Profile Subtitle | `<p>` | Renders `employee.employeeId` (`font-mono text-xs text-zinc-400`). |
| History Link | `Link` | Redirects to wage and attendance history filter: `/history?search=${employee.employeeId}`. |
