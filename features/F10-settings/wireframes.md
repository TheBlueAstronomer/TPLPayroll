# F10 — Settings: Wireframes

> **Design Tokens:** Geist + Geist Mono | Zinc base, Emerald accent | VARIANCE 8, MOTION 6, DENSITY 4

---

## Screen: Settings Page (`/settings`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ h1: "Settings"                                                   │
│ text-2xl font-semibold tracking-tight text-zinc-900              │
│                                                                  │
│ ┌── Section: Payroll Configuration ────────────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8 (NO card wrapper)            ││
│ │ Section label: "Payroll Configuration"                         ││
│ │ text-sm font-medium text-zinc-900 mb-6                         ││
│ │                                                                ││
│ │ max-w-md (constrain form width for readability)                ││
│ │                                                                ││
│ │ Payroll Week Start Day                                         ││
│ │ text-xs font-medium uppercase tracking-wider text-zinc-400     ││
│ │ mb-1.5                                                         ││
│ │                                                                ││
│ │ [Thursday ▼]                                                   ││
│ │ Select: rounded-xl border-zinc-200/60                          ││
│ │ focus:ring-2 focus:ring-emerald-500/20                         ││
│ │ focus:border-emerald-500                                       ││
│ │ Options: Monday, Tuesday, Wednesday, Thursday,                 ││
│ │          Friday, Saturday, Sunday                              ││
│ │                                                                ││
│ │ Helper text:                                                   ││
│ │ "This determines the default payroll week structure.           ││
│ │  Example: Thursday → payroll week runs Thu to Wed."            ││
│ │ text-sm text-zinc-400 mt-2 max-w-[65ch]                       ││
│ │ leading-relaxed                                                ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── Section: Display Defaults (read-only) ─────────────────────┐│
│ │ border-t border-zinc-200/60 pt-8                               ││
│ │ Section label: "Display Defaults"                              ││
│ │ text-sm font-medium text-zinc-900 mb-6                         ││
│ │                                                                ││
│ │ <dl> grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8          ││
│ │                                                                ││
│ │ Currency                                                       ││
│ │ dt: text-xs uppercase tracking-wider text-zinc-400             ││
│ │ ₹ INR                                                         ││
│ │ dd: font-mono text-sm text-zinc-600                            ││
│ │                                                                ││
│ │ Document Expiry Threshold                                      ││
│ │ dt: text-xs uppercase tracking-wider text-zinc-400             ││
│ │ 7 days                                                         ││
│ │ dd: font-mono text-sm text-zinc-600                            ││
│ │ + Badge: "Phase 2"                                             ││
│ │   bg-zinc-100 text-zinc-400 rounded-full text-xs               ││
│ │   px-2 py-0.5 ml-2                                             ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Actions: pt-8 border-t border-zinc-200/60                        │
│                                          [Save Settings]         │
│ Button: bg-emerald-600 text-white rounded-xl                     │
│         active:scale-[0.98]                                      │
│         Loading: shimmer bar in button                           │
│         Success: Toast "Settings saved" (emerald-tinted)         │
│         transition-all duration-300                              │
│         ease-[cubic-bezier(0.16,1,0.3,1)]                       │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Element | Component | Behavior |
|---|---|---|
| Page header | `<h1>` | `text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900` |
| Payroll config section | `border-t border-zinc-200/60 pt-8` | NO card wrapper. `max-w-md` for form width |
| Day selector | `Select` | `rounded-xl border-zinc-200/60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`. 7 day options |
| Helper text | `<p>` | `text-sm text-zinc-400 mt-2 max-w-[65ch] leading-relaxed` |
| Defaults section | `border-t border-zinc-200/60 pt-8` | Read-only `<dl>`. Values in `font-mono text-zinc-600` |
| Phase 2 badge | `<span>` | `bg-zinc-100 text-zinc-400 rounded-full text-xs px-2 py-0.5` |
| Save button | `Button` | `bg-emerald-600 text-white rounded-xl active:scale-[0.98]`. Loading: shimmer. Success: emerald `Toast` |
| Toast | `Toast` | "Settings saved" — emerald-tinted border and icon |

### Interactive States

- **Loading:** Skeleton bar for select input, text placeholders for display defaults
- **Save loading:** Button shows shimmer bar, disabled during save
- **Success:** `Toast` notification "Settings saved" with Phosphor `CheckCircle` icon, emerald tint
- **Error:** `Toast` notification "Failed to save settings" with Phosphor `WarningCircle` icon, rose tint
