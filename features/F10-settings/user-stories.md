# F10 — Settings: User Stories

---

## US-10.1: View application settings

**As a** Payroll Owner
**I want to** view the current application settings
**So that** I know how the app is configured.

### Acceptance Criteria

- AC1: The settings page shows the current payroll week start day.
- AC2: The settings page shows the currency as "₹ INR" (read-only).
- AC3: The settings page shows the document expiry threshold as "7 days" with a "Phase 2" label (read-only).
- AC4: If no settings have been saved, defaults are shown (Thursday for start day).

### Unit Tests

```
TEST: getSettings returns current settings
  GIVEN settings have been saved with payrollWeekStartDay = "MONDAY"
  WHEN getSettings() is called
  THEN it returns { payrollWeekStartDay: "MONDAY", currency: "INR", docExpiryThreshold: 7 }

TEST: getSettings returns defaults when no settings exist
  GIVEN no settings record in database
  WHEN getSettings() is called
  THEN it returns { payrollWeekStartDay: "THURSDAY", currency: "INR", docExpiryThreshold: 7 }
```

---

## US-10.2: Update payroll week start day

**As a** Payroll Owner
**I want to** change the payroll week start day
**So that** the app uses the correct week structure for payroll.

### Acceptance Criteria

- AC1: A dropdown or select lists all 7 days of the week.
- AC2: The currently configured day is pre-selected.
- AC3: On save, the new day is persisted to the database.
- AC4: A success toast is shown: "Settings saved successfully".
- AC5: The new day is immediately reflected in payroll week detection and defaults.

### Unit Tests

```
TEST: updatePayrollWeekStartDay saves new value
  GIVEN current setting is "THURSDAY"
  WHEN updatePayrollWeekStartDay("MONDAY") is called
  THEN the database stores payrollWeekStartDay = "MONDAY"

TEST: updatePayrollWeekStartDay validates day name
  WHEN updatePayrollWeekStartDay("FUNDAY") is called
  THEN it throws validation error "INVALID_DAY"

TEST: getPayrollWeekStartDay returns updated value
  GIVEN settings updated to "MONDAY"
  WHEN getPayrollWeekStartDay() is called
  THEN it returns "MONDAY"
```

---

## US-10.3: Payroll week start day used in payroll workflow

**As a** Payroll Owner
**I want to** the payroll week start day setting to affect how the app determines standard payroll weeks
**So that** non-standard weeks are correctly flagged.

### Acceptance Criteria

- AC1: When detecting payroll week from attendance files, the app uses the configured start day to determine if the detected week is "standard."
- AC2: The payroll week selector in the payroll generation flow uses the configured start day.
- AC3: If the setting is changed, existing historical data is not retroactively affected.

### Unit Tests

```
TEST: isStandardPayrollWeek uses configured start day
  GIVEN payrollWeekStartDay = "THURSDAY"
  AND detected week is Thursday to Wednesday
  WHEN isStandardPayrollWeek() is called
  THEN it returns true

TEST: isStandardPayrollWeek flags non-matching week
  GIVEN payrollWeekStartDay = "THURSDAY"
  AND detected week is Monday to Sunday
  WHEN isStandardPayrollWeek() is called
  THEN it returns false

TEST: isStandardPayrollWeek adapts to changed setting
  GIVEN payrollWeekStartDay = "MONDAY"
  AND detected week is Monday to Sunday
  WHEN isStandardPayrollWeek() is called
  THEN it returns true
```
