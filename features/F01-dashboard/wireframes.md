# F01 — Dashboard: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen: Dashboard (`/`)

### Layout

Asymmetric Bento grid — NOT a uniform 2x2. Row 1 uses a dominant 2fr metric + 1fr secondary. Row 2 distributes two compact strips.

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (240px)        │ Main: max-w-[1400px] mx-auto px-6     │
│                        │                                        │
│ TPL Payroll (brand)    │ h1: "Dashboard"                        │
│ text-sm font-semibold  │ text-2xl font-semibold tracking-tight  │
│ tracking-tight         │ text-zinc-900 (left-aligned)           │
│ text-zinc-900          │                                        │
│                        │ ┌── Row 1: grid 2fr 1fr, gap-6 ──────┐│
│ Nav (vertical, gap-1): │ │ ┌─ Active Team ────┐ ┌─ Payroll ──┐││
│ text-sm font-medium    │ │ │ label: text-xs    │ │ "Latest    │││
│                        │ │ │ uppercase         │ │  Payroll"  │││
│ ● Dashboard            │ │ │ tracking-wider    │ │            │││
│   text-emerald-600     │ │ │ text-zinc-400     │ │ ₹1,47,835  │││
│   bg-emerald-50/50     │ │ │                   │ │ font-mono  │││
│   rounded-xl           │ │ │ 14                │ │ tabular-   │││
│                        │ │ │ text-5xl font-mono│ │ nums       │││
│ ○ Employees            │ │ │ tabular-nums      │ │            │││
│ ○ Attendance           │ │ │ font-semibold     │ │ <CurrencyInr││
│ ○ Payroll              │ │ │ text-zinc-900     │ │  size={20} │││
│ ○ Adjustments          │ │ │                   │ │  text-zinc- │││
│ ○ History              │ │ │ <Users size={20}  │ │  400 />    │││
│ ○ Settings             │ │ │  text-emerald-500 │ │            │││
│ ○ Audit Log            │ │ │  weight="regular" │ │            │││
│                        │ │ │  />               │ │            │││
│ Icons: Phosphor        │ │ └───────────────────┘ └────────────┘││
│ weight: regular        │ │                                      ││
│ size: 20               │ │ ┌── Row 2: grid-cols-2, gap-6 ─────┐││
│ House, Users,          │ │ │ ┌─ Attendance ──┐ ┌─ Adjustments─┐│││
│ CalendarCheck,         │ │ │ │ "Pending Flags"│ │ "Awaiting"   ││││
│ CurrencyInr, Scales,  │ │ │ │ 3              │ │ 1            ││││
│ ClockCounterClockwise, │ │ │ │ <Warning       │ │ <Clock       ││││
│ GearSix, ListChecks   │ │ │ │  text-amber-   │ │  text-zinc-  ││││
│                        │ │ │ │  500 />        │ │  400 />      ││││
│ Hover: text-zinc-900   │ │ │ └────────────────┘ └──────────────┘│││
│ hover:bg-zinc-50       │ │ └────────────────────────────────────┘││
│                        │ └──────────────────────────────────────┘│
│ Mobile: Sheet hamburger│                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Styling & Behavior |
|---|---|---|
| App shell | Layout | Sidebar 240px fixed + scrollable main. `max-w-[1400px] mx-auto px-6 lg:px-10` |
| Sidebar | `Sidebar`, `SidebarMenu`, `SidebarMenuButton` | Nav items: `text-sm font-medium text-zinc-500`. Active: `text-emerald-600 bg-emerald-50/50 rounded-xl`. Hover: `hover:text-zinc-900 hover:bg-zinc-50`. Icons: `@phosphor-icons/react` weight `regular`, size `20`. Mobile: collapses to hamburger `Sheet` |
| Page header | `<h1>` | `text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900`. Left-aligned |
| Metric grid | CSS Grid | Row 1: `grid-template-columns: 2fr 1fr`. Row 2: `grid-cols-2`. Gap: `gap-4 md:gap-6`. Mobile: `grid-cols-1` |
| Card surface | `div` | `bg-white rounded-2xl border border-zinc-200/60 p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]`. Hover: `hover:shadow-md hover:border-zinc-300 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`. Press: `active:scale-[0.98]`. Wrapped in `Link` |
| Card label | `<span>` | `text-xs font-medium uppercase tracking-wider text-zinc-400` |
| Card value | `<span>` | `text-4xl md:text-5xl font-mono tabular-nums font-semibold text-zinc-900` |
| Card icon | Phosphor | `Users` (emerald-500), `CurrencyInr` (zinc-400), `Warning` (amber-500), `Clock` (zinc-400). Top-right positioned |

### Motion Specs

- **Mount:** Stagger reveal via `animation-delay: calc(var(--index) * 80ms)`. `opacity: 0→1`, `translateY(8px)→0`. Duration `400ms`, easing `cubic-bezier(0.16,1,0.3,1)`
- **Hover:** `transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`
- **Press:** `active:scale-[0.98]`

### Interactive States

- **Loading:** Skeleton shimmer per card matching geometry (short bar for label, tall bar for value, small square for icon). Shimmer: `background: linear-gradient(90deg, zinc-100, zinc-50, zinc-100)`, `animation: shimmer 1.5s infinite`
- **Error:** Centered block: `<WarningCircle size={32} className="text-rose-400" />`, "Something went wrong" (`text-lg font-medium text-zinc-700`), "We couldn't load your dashboard data" (`text-sm text-zinc-400`), "Try again" Button (emerald bg, `rounded-xl`)
- **Empty numeric:** Cards show `0` or `₹0.00` in `font-mono text-zinc-300`

### Navigation

| Card Clicked | Destination |
|---|---|
| Active Team Members | `/employees` |
| Latest Payroll Total | `/payroll` |
| Pending Attendance Flags | `/attendance` |
| Awaiting Adjustments | `/adjustments` |

### Responsive

- **Desktop (lg+):** Sidebar 240px. Bento as described
- **Tablet (md):** Sidebar icon-rail 64px. Grid 2-column
- **Mobile (<md):** Sidebar → Sheet hamburger. Grid → `grid-cols-1 gap-4 px-4 py-6`
