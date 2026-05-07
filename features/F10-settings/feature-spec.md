# F10 — Settings

## Goal

Provide a simple settings page that allows the Payroll Owner to configure the payroll week start day, with fixed defaults for currency display and document expiry threshold.

## Scope

- Editable setting: Payroll week start day (e.g., Thursday).
- Fixed defaults (displayed but not editable):
  - Currency: ₹ INR.
  - Document nearing-expiry threshold: 7 days (Phase 2).
- The configured payroll week start day is used for payroll week defaults throughout the app.

## PRD References

- Section 12: Settings

---

## E2E Behavior Tests

### E2E-01: View current settings

```
GIVEN the settings page exists
WHEN the user navigates to Settings
THEN the current payroll week start day is displayed (default: Thursday)
AND the currency is shown as "₹ INR" (read-only)
AND the document expiry threshold is shown as "7 days" (read-only, Phase 2 label)
```

### E2E-02: Change payroll week start day

```
GIVEN the payroll week start day is currently "Thursday"
WHEN the user changes it to "Monday"
AND clicks "Save"
THEN the setting is saved
AND future payroll week detection defaults to Monday as the start day
```

### E2E-03: Settings persist across sessions

```
GIVEN the user sets payroll week start day to "Monday"
WHEN the user closes the browser and reopens the app
AND navigates to Settings
THEN the payroll week start day still shows "Monday"
```

### E2E-04: Payroll week start day affects payroll workflow

```
GIVEN the payroll week start day is set to "Monday"
WHEN the user uploads attendance with auto-detected dates
THEN the app validates the payroll week against a Monday-to-Sunday structure
AND flags non-standard weeks accordingly
```
