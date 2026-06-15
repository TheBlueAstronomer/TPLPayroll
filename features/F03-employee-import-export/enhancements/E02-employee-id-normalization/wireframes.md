# E02 — Employee ID Normalization: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4
> **Parent Feature:** F03 — Employee Import / Export

---

## Screen E02-A: Excel Import Preview — Auto-Normalized Rows

Shows the state of the Import Preview screen after uploading a spreadsheet that contains legacy 15-character Employee IDs (e.g. `TPLGOAHLP002007`). The IDs are automatically parsed and displayed as normalized 12-character IDs (e.g. `TPLGOAHLP007`).

### Layout

```
┌── Import Preview (/employees/import/preview) ────────────────────────────┐
│                                                                          │
│  ┌─ Summary Strip ─────────────────────────────────────────────────────┐ │
│  │  Total Rows    Valid     Invalid   Duplicates  New    Updates       │ │
│  │  15            15        0         0           12     3             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Tabs: [ Valid Rows (15) ]  [ Invalid Rows (0) ]  [ Duplicates (0) ]     │
│                                                                          │
│  ┌─ Valid Rows Tab ────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  Row  Emp ID        Name                Designation  Action         │ │
│  │  ───  ────────────  ──────────────────  ───────────  ────────       │ │
│  │                                                                     │ │
│  │   2   TPLGOAHLP007  Suresh Narayanan    Guard        Update         │ │
│  │                                                                     │ │
│  │   3   TPLGOAHLP008  Amit Shinde         Supervisor   Update         │ │
│  │                                                                     │ │
│  │   4   TPLGOAHLP010  Rekha Patil         Guard        Create         │ │
│  │                                                                     │ │
│  │  Row#: font-mono text-xs text-zinc-400                              │ │
│  │  Emp ID: font-mono text-xs text-zinc-800                            │ │
│  │  (Auto-normalized from raw Excel values: e.g. TPLGOAHLP002007)      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                           [Cancel Import] [Confirm]      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Valid Rows Table | `table` | Displays the parsed rows. Rows with 15-character legacy IDs in the uploaded spreadsheet are rendered with their normalized 12-character IDs. |
| Action Badge | `StatusBadge` | Correctly displays `Update` for legacy IDs that match existing shortened records in the database, and `Create` for new IDs. |

---

## Screen E02-B: Fix Row Dialog — Manual Normalization

Shows the behavior of the Fix Row Dialog when the user manually enters a legacy 15-character ID. The ID is accepted in the text box but is normalized behind the scenes on submission.

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Fix Row 5                                           [X] │
│                                                          │
│  Enter the missing information to include this           │
│  row in the import.                                      │
│                                                          │
│  ┌─ Read-only context (valid fields from this row) ───┐  │
│  │  [Suresh Narayanan]  [Guard]  [Active]              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Editable fields ──────────────────────────────────┐  │
│  │                                                     │  │
│  │  Employee ID *                                      │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ TPLGOAHLP002007                               │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │  hint: text-xs text-zinc-400 "e.g. TPLGOAHLP007"     │  │
│  │  (Will be auto-normalized to TPLGOAHLP007 on apply) │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│                                     [Cancel]   [Apply Fix]│
└──────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Employee ID Input | `input` | Allows entering 15-character legacy IDs. |
| Help Text | `p` | Informational text explaining that the input will be automatically normalized to 12 characters when the user clicks "Apply Fix". |
| Apply Fix Button | `Button` | Standard click behavior. Processes validation and normalizes the input to 12 characters. If successful, closes the dialog and adds the normalized row to the Valid Rows list. |
