# Wireframes: Dual-Format Summary UI

## 1. Payroll Run Detail Page - Reports Section

This section sits below the payroll summary tables and offers actions for downloading the summary and the slips.

### Default State

```text
Reports

[📄] Payroll Summary Report
     A tabular summary of all employees' payroll for this week.
     
     [ (⬇) Download Summary | (▼) ]

[📦] Employee Payroll Slips
     Individual payroll slips for all X employees.
     
     [ (⬇) Generate & Download ZIP ]
```

### Active Dropdown State

When the user clicks the `(▼)` caret button, a Framer Motion spring-animated dropdown appears. The entire split-button group has an `active:scale-[0.98]` tactile response.

```text
     [ (⬇) Download Summary | (▲) ]
     +--------------------------------+
     | 📄 Download as Excel (.xlsx)   |
     | 📄 Download as PDF (.pdf)      |
     +--------------------------------+
```

## Styling Details
- **Buttons**: `border-zinc-200`, `rounded-xl`, `bg-transparent` (hover: `bg-zinc-50`), `text-zinc-700`.
- **Dropdown Menu**: `bg-white`, `rounded-xl`, `border-zinc-200/60`, `shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)]`.
- **Animation**: `initial={{ opacity: 0, scale: 0.95, y: -4 }}`, `animate={{ opacity: 1, scale: 1, y: 0 }}`, `transition={{ type: 'spring', stiffness: 150, damping: 20 }}`.
