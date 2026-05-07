# F11 — Audit Logging: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen: Audit Log Viewer (`/audit-log`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Audit Log"                                                  │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Filter Bar: flex gap-4 ────────────────────────────────────┐│
│ │ Entity Select (w-[180px])      Action Select (w-[180px])      ││
│ │ rounded-xl border-zinc-200/60  rounded-xl border-zinc-200/60  ││
│ │ Options: All, Employee,        Options: All, Create, Update   ││
│ │          Wage History                                          ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Audit Table: divide-y divide-zinc-100 (NO card wrapper) ───┐│
│ │ Header: text-xs uppercase tracking-wider text-zinc-400         ││
│ │         bg-zinc-50/50 font-medium                              ││
│ │                                                                ││
│ │ Timestamp         Action    Entity        ID        Summary   ││
│ │ ────────────────  ────────  ────────────  ────────  ───────── ││
│ │ 2 hours ago       UPDATE    WAGE_HISTORY  wh-001   Hourly    ││
│ │                                                     rate:     ││
│ │                                                     62.50 →   ││
│ │                                                     75.00     ││
│ │ 2 hours ago       UPDATE    EMPLOYEE      emp-042  Phone,    ││
│ │                                                     Hourly    ││
│ │                                                     Rate      ││
│ │ 2 days ago        CREATE    EMPLOYEE      emp-042  New       ││
│ │                                                     employee  ││
│ │                                                                ││
│ │ Timestamp:                                                     ││
│ │   font-mono text-xs text-zinc-400                              ││
│ │   Relative time ("2 hours ago")                                ││
│ │   Tooltip on hover: full timestamp                             ││
│ │   "7 May 2025, 14:32:18"                                      ││
│ │   Tooltip: bg-zinc-900 text-white rounded-lg                   ││
│ │            text-xs px-2 py-1                                   ││
│ │                                                                ││
│ │ Action badges:                                                 ││
│ │   CREATE: bg-emerald-50 text-emerald-700 rounded-full          ││
│ │           text-xs font-medium px-2 py-0.5                      ││
│ │   UPDATE: bg-sky-50 text-sky-700 rounded-full                  ││
│ │           text-xs font-medium px-2 py-0.5                      ││
│ │                                                                ││
│ │ Entity badges:                                                 ││
│ │   border border-zinc-200 text-zinc-500 rounded-full            ││
│ │   text-xs px-2 py-0.5 font-mono                               ││
│ │                                                                ││
│ │ ID: font-mono text-xs text-zinc-500                            ││
│ │ Summary: text-sm text-zinc-600, truncated to 2-3 fields        ││
│ │ Row hover: hover:bg-zinc-50/80 cursor-pointer                  ││
│ │ Clickable rows → toggle expanded detail                        ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Expanded Detail (for selected row) ────────────────────────┐│
│ │ Collapsible: smooth expand                                     ││
│ │ transition: max-height 300ms ease-[cubic-bezier(0.16,1,0.3,1)]││
│ │                                                                ││
│ │ Code block:                                                    ││
│ │ bg-zinc-950 rounded-xl p-4 mt-2 mb-4                           ││
│ │ font-mono text-xs                                              ││
│ │ overflow-x-auto                                                ││
│ │                                                                ││
│ │ {                                                              ││
│ │   "changedFields": {                                           ││
│ │     "hourlyRate": {                                            ││
│ │       "old": 62.50,         ← text-rose-400                   ││
│ │       "new": 75.00          ← text-emerald-400                ││
│ │     },                                                         ││
│ │     "phone": {                                                 ││
│ │       "old": "+91 98765 43210",  ← text-rose-400              ││
│ │       "new": "+91 99112 33445"   ← text-emerald-400           ││
│ │     }                                                          ││
│ │   },                                                           ││
│ │   "changeSource": "MANUAL"   ← text-zinc-500                  ││
│ │ }                                                              ││
│ │                                                                ││
│ │ Keys: text-zinc-400                                            ││
│ │ Strings: text-amber-300                                        ││
│ │ Numbers: text-sky-300                                          ││
│ │ Old values: text-rose-400                                      ││
│ │ New values: text-emerald-400                                   ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Pagination: text-sm text-zinc-500                                │
│ [← Prev]  [1] [2] [3]  [Next →]                                │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Entity filter | `Select` | `rounded-xl border-zinc-200/60`. Options: All, Employee, Wage History |
| Action filter | `Select` | `rounded-xl border-zinc-200/60`. Options: All, Create, Update |
| Audit table | `Table` | `divide-y divide-zinc-100`. NO card wrapper. Sortable by timestamp (default desc). Row: `hover:bg-zinc-50/80 cursor-pointer` |
| Timestamp | `<span>` + `Tooltip` | Relative time in `font-mono text-xs text-zinc-400`. Tooltip: full datetime in `bg-zinc-900 text-white rounded-lg text-xs px-2 py-1` |
| Action badge | `<span>` | CREATE: `bg-emerald-50 text-emerald-700`. UPDATE: `bg-sky-50 text-sky-700`. Both `rounded-full text-xs font-medium px-2 py-0.5` |
| Entity badge | `<span>` | `border border-zinc-200 text-zinc-500 rounded-full text-xs px-2 py-0.5 font-mono` |
| ID | `<span>` | `font-mono text-xs text-zinc-500` |
| Summary | Truncated text | `text-sm text-zinc-600`. First 2-3 changed fields. Full details on expand |
| Expanded detail | `Collapsible` | Smooth expand via `transition: max-height 300ms`. Contains syntax-highlighted JSON |
| JSON viewer | `<pre>` | `bg-zinc-950 rounded-xl p-4 font-mono text-xs overflow-x-auto`. Syntax colors: keys=zinc-400, strings=amber-300, numbers=sky-300, old=rose-400, new=emerald-400 |
| Pagination | `Pagination` | Active: `bg-emerald-50 text-emerald-700 rounded-lg` |

### Interactive States

- **Loading:** Skeleton rows (5x) matching table column widths. Shimmer animation
- **Empty:** Phosphor `ListChecks` (size 48, text-zinc-200), "No audit log entries found" (`text-lg font-medium text-zinc-600`), "Actions performed in the system will appear here" (`text-sm text-zinc-400`)
- **Row expand/collapse:** Smooth CSS `max-height` transition with `ease-[cubic-bezier(0.16,1,0.3,1)]`
- **Row stagger:** `animation-delay: calc(var(--index) * 60ms)` on mount

### Behaviors

- **Read-only:** No edit, delete, or export controls
- **Expandable rows:** Click any row to toggle JSON detail expansion below the row
- **Time formatting:** Relative time (e.g., "2 hours ago") with full timestamp on hover via `Tooltip`
