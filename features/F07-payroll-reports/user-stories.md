# F07 — Payroll Reports & Slips: User Stories

---

## US-07.1: Generate PDF payroll summary report

**As a** Payroll Owner
**I want to** generate a PDF summary of the approved weekly payroll
**So that** I have a printable report for record-keeping.

### Acceptance Criteria

- AC1: Only available after payroll is approved.
- AC2: PDF includes: payroll week dates, per-employee rows (ID, Name, Designation, Site, GPay, Bank Account, Reg Hrs, OT Hrs, Reg Pay, OT Pay, Additions, Deductions, Net Payable), footer totals.
- AC3: All amounts in ₹ INR with 2 decimal places.
- AC4: The PDF downloads automatically to the user's browser.
- AC5: The temporary PDF file is deleted from the server after download.

### Unit Tests

```
TEST: generatePayrollSummaryPdf creates valid PDF buffer
  GIVEN payroll data for 15 employees
  WHEN generatePayrollSummaryPdf(payrollRunId) is called
  THEN it returns a valid PDF buffer
  AND the PDF contains 15 employee rows plus totals

TEST: generatePayrollSummaryPdf includes correct columns
  GIVEN payroll data for 1 employee
  WHEN generatePayrollSummaryPdf() is called
  THEN the PDF contains: Employee ID, Employee Name, Designation, Site, GPay, Bank Account, Regular Hours, Overtime Hours, Regular Pay, Overtime Pay, Additions, Deductions, Net Payable

TEST: generatePayrollSummaryPdf formats amounts correctly
  GIVEN netPayable = 2950.50
  WHEN the PDF is generated
  THEN the amount appears as "₹2,950.50"
```

---

## US-07.2: Generate individual employee payroll slips

**As a** Payroll Owner
**I want to** generate a PDF payroll slip for each employee in the approved payroll
**So that** employees receive a record of their weekly pay.

### Acceptance Criteria

- AC1: One PDF is generated per employee.
- AC2: Each slip includes: Employee ID, Name, Designation, GPay, Bank Account, daily attendance (hours worked and OT per day), deductions, additions, gross wage, net payable, payroll week, generated date.
- AC3: Slips are simple and unbranded (no company logo).
- AC4: No invoice numbers.
- AC5: An InvoiceSnapshot record is created for each employee with the full slip data as JSON.

### Unit Tests

```
TEST: generatePayrollSlip creates valid PDF for one employee
  GIVEN PayrollRunEmployee data for EMP-001
  WHEN generatePayrollSlip(payrollRunEmployeeId) is called
  THEN it returns a valid PDF buffer

TEST: generatePayrollSlip includes daily attendance breakdown
  GIVEN EMP-001 has 7 days of attendance records
  WHEN generatePayrollSlip() is called
  THEN the slip shows hours worked and OT for each day of the week

TEST: generatePayrollSlip includes generated date
  WHEN generatePayrollSlip() is called
  THEN the slip includes "Generated: <current date>"

TEST: generatePayrollSlip creates InvoiceSnapshot
  GIVEN payroll slip for EMP-001
  WHEN generatePayrollSlip() is called
  THEN an InvoiceSnapshot record is created with invoiceFormat = "PDF"
  AND invoiceSnapshotJson contains all slip data
```

---

## US-07.3: Package payroll slips into ZIP

**As a** Payroll Owner
**I want to** download all payroll slips as a single ZIP file
**So that** I can distribute them easily.

### Acceptance Criteria

- AC1: All employee payroll slip PDFs are packaged into one ZIP.
- AC2: ZIP file naming: `payroll_slips_<startDate>_<endDate>.zip` (e.g., `payroll_slips_06Mar_12Mar.zip`).
- AC3: Each PDF inside the ZIP is named meaningfully (e.g., `EMP-001_Ravi_Kumar.pdf`).
- AC4: The ZIP downloads automatically.

### Unit Tests

```
TEST: generatePayrollSlipsZip creates valid ZIP
  GIVEN 15 payroll slip PDFs
  WHEN generatePayrollSlipsZip(payrollRunId) is called
  THEN it returns a valid ZIP buffer containing 15 PDFs

TEST: generatePayrollSlipsZip uses correct naming pattern
  GIVEN payroll week March 6-12
  WHEN generatePayrollSlipsZip() is called
  THEN the filename is "payroll_slips_06Mar_12Mar.zip"

TEST: generatePayrollSlipsZip names PDFs meaningfully
  GIVEN employee EMP-001 named "Ravi Kumar"
  WHEN the ZIP is generated
  THEN the PDF inside is named "EMP-001_Ravi_Kumar.pdf"
```

---

## US-07.4: Delete temporary generated files

**As a** Payroll Owner
**I want to** temporary report files to be automatically cleaned up
**So that** no unnecessary files accumulate on the server.

### Acceptance Criteria

- AC1: Generated PDF files are deleted after download or after generation once payroll data is saved.
- AC2: Generated ZIP files are deleted after download.
- AC3: InvoiceSnapshot records have `temporaryFileDeletedAt` set after cleanup.
- AC4: The payroll data remains in the database for future regeneration.

### Unit Tests

```
TEST: cleanupTemporaryFiles deletes PDFs and ZIPs
  GIVEN temporary files exist at known paths
  WHEN cleanupTemporaryFiles(payrollRunId) is called
  THEN the files no longer exist on disk

TEST: cleanupTemporaryFiles sets temporaryFileDeletedAt
  GIVEN InvoiceSnapshot records without temporaryFileDeletedAt
  WHEN cleanupTemporaryFiles() is called
  THEN all snapshots have temporaryFileDeletedAt set
```

---

## US-07.5: Regenerate reports from stored data

**As a** Payroll Owner
**I want to** be able to regenerate reports from stored payroll data
**So that** I can get new copies even after temporary files are deleted.

### Acceptance Criteria

- AC1: The "Generate PDF Summary" and "Generate Payroll Slips" buttons remain available on approved payroll runs.
- AC2: Regeneration uses stored PayrollRunEmployee data and InvoiceSnapshot JSON.
- AC3: Regenerated files follow the same temporary file lifecycle (generated → downloaded → deleted).

### Unit Tests

```
TEST: regeneratePayrollSummary uses stored data
  GIVEN an approved payroll run with 15 PayrollRunEmployee records
  AND temporary files have been deleted
  WHEN regeneratePayrollSummary(payrollRunId) is called
  THEN a new PDF is generated from stored data
```
