# F07 — Payroll Reports & Slips

## Goal

Generate PDF payroll summary reports and per-employee payroll slips after payroll approval, package all slips into a downloadable ZIP file, and delete temporary generated files after download/generation once data is saved.

## Scope

- Generate a PDF weekly payroll summary report from an approved payroll run.
- Generate one PDF payroll slip per employee.
- Package all payroll slips into a ZIP file using the naming pattern `payroll_slips_<startDate>_<endDate>.zip`.
- Store payroll slip snapshot data as JSON in InvoiceSnapshot for regeneration.
- Delete temporary PDF and ZIP files immediately after download or generation once payroll data is saved.
- Slips are simple and unbranded — no company logo, no invoice numbers.

## PRD References

- Section 10: Reports and Payroll Slips
- Section 9.8: Generate Employee Payroll Slips (workflow)
- Section 15.11: Invoice / Payroll Slip Snapshot

---

## E2E Behavior Tests

### E2E-01: Generate PDF payroll summary

```
GIVEN payroll for March 6-12 is approved with 15 employees
WHEN the user clicks "Generate PDF Summary"
THEN a PDF is generated containing:
  - Payroll week dates (6 Mar – 12 Mar 2025)
  - Per-employee rows: ID, Name, Designation, Site, GPay, Bank Account, Reg Hrs, OT Hrs, Reg Pay, OT Pay, Additions, Deductions, Net Payable
  - Footer totals
AND the PDF is downloaded to the user's browser
AND the temporary PDF file is deleted after download
```

### E2E-02: Generate payroll slips ZIP

```
GIVEN payroll for March 6-12 is approved with 15 employees
WHEN the user clicks "Generate Payroll Slips"
THEN 15 individual PDF payroll slips are generated
AND all 15 PDFs are packaged into a ZIP file named "payroll_slips_06Mar_12Mar.zip"
AND the ZIP is downloaded to the user's browser
AND all temporary PDF and ZIP files are deleted after download
```

### E2E-03: Payroll slip content is correct

```
GIVEN employee "EMP-001" is in the approved payroll with:
  regularHours = 46, overtimeHours = 6, regularPay = ₹2,875, overtimePay = ₹375
  deductions = ₹500, additions = ₹200, grossPay = ₹3,250, netPayable = ₹2,950
WHEN the payroll slip PDF for "EMP-001" is generated
THEN the slip contains: Employee ID, Name, Designation, GPay, Bank Account, daily attendance breakdown, total hours, OT hours, deductions, additions, gross wage, net payable, payroll week dates, generated date
AND no company branding or invoice number
```

### E2E-04: ZIP file naming follows pattern

```
GIVEN payroll week is March 6-12
WHEN slips are generated
THEN the ZIP file is named "payroll_slips_06Mar_12Mar.zip"
```

### E2E-05: InvoiceSnapshot data is stored

```
GIVEN payroll slips are generated for 15 employees
THEN 15 InvoiceSnapshot records are created
AND each record contains invoiceSnapshotJson with all payroll slip data
AND the snapshot can be used to regenerate the slip in the future
```

### E2E-06: Temporary files are cleaned up

```
GIVEN the user downloads the ZIP file
THEN no PDF or ZIP files remain on the server filesystem or temp storage
AND each InvoiceSnapshot has temporaryFileDeletedAt set
```
