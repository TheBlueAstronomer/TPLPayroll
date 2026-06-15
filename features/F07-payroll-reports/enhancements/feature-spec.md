# F07 Enhancements — Dual-Format Summary & UI Upgrades

> **Status: ✅ DONE**

## Goal

Enhance the existing payroll summary report to support both Excel (.xlsx) and PDF formats. Refine the UI with a premium split-button design, and standardise currency formatting to use the "₹" symbol across all reports and slips.

## Scope

- Support downloading the weekly payroll summary report in `.xlsx` format (default).
- Support downloading the weekly payroll summary report in `.pdf` format.
- Align columns across both formats: `["ID", "Employee", "GPay", "Bank Acct", "Regular Pay", "OT Pay", "Additions", "Deductions", "Net Pay"]`.
- Replace "Rs." with the "₹" symbol for all currency values in both Excel and PDF outputs.
- Upgrade the download button to an animated split-button (Framer Motion) allowing format selection.

---

## E2E Behavior Tests

### E2E-01: Dual-format payroll summary API

```
GIVEN an approved payroll run
WHEN the user requests `/api/.../summary?format=xlsx` or with no format
THEN an Excel file is generated and downloaded
AND WHEN the user requests `?format=pdf`
THEN a PDF file is generated and downloaded
```

### E2E-02: Consistent Currency Formatting

```
GIVEN an approved payroll run
WHEN any report or slip is generated (PDF or Excel)
THEN all monetary values are prefixed with the "₹" symbol instead of "Rs."
```

### E2E-03: UI Dropdown and Download Triggers

```
GIVEN the user is on the Payroll Run detail page
WHEN the user clicks the main "Download Summary" button
THEN the Excel summary is downloaded directly
AND WHEN the user clicks the caret to open the dropdown
THEN an animated menu appears offering both Excel and PDF options
AND clicking either option triggers the respective download
```
