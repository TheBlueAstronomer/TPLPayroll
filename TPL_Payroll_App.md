# Payroll App Product Requirements Document

## 1. Product Overview

The payroll app is a single-user, GCP-hosted web application for calculating weekly employee payroll from uploaded attendance Excel files and employee master data.

The app helps the user:
- Import and maintain an employee master database.
- Upload a weekly attendance report.
- Review attendance import errors before payroll generation.
- Calculate weekly payroll using regular hours, overtime hours, hourly rates, deductions, and additions.
- Preview and approve a weekly payroll summary.
- Generate a PDF payroll summary report.
- Generate one PDF payroll slip per employee and package all slips into a ZIP file.
- Store payroll calculation history for in-app lookup by employee and payroll week.

The primary objective is to reduce manual payroll calculation work while keeping payroll data accurate, reviewable, and retrievable.

## 2. Product Goals

1. Calculate weekly payroll accurately from uploaded attendance files.
2. Maintain employee wage, payment, active/inactive, and resignation data.
3. Support recurring and one-time payroll adjustments.
4. Generate payroll reports and employee payroll slips in PDF format.
5. Preserve payroll data history for future lookup.
6. Keep the first version focused on payroll before adding document management.

## 3. User Personas

### 3.1 Payroll Owner

The primary user of the application. This user manages employee data, uploads attendance files, reviews payroll calculations, approves reports, generates payroll slips, and retrieves payroll history.

Key needs:
- Import and export employee master data.
- Upload weekly attendance reports.
- Review import errors and employee matching issues.
- Review deductions and additions before applying them.
- Approve weekly payroll summaries.
- Generate PDF reports and payroll slips.
- View historical payroll data by employee and week.

### 3.2 Payroll Admin / HR Admin

A future or conceptual persona responsible for employee maintenance and payroll adjustments. The first version is single-user, so this persona’s responsibilities are handled by the Payroll Owner.

Key needs:
- Add and update employee records.
- Update wages.
- Manage deductions and additions.
- Track inactive and resigned employees.
- Manage employee documents in a later phase.

### 3.3 Accountant

A future or conceptual persona responsible for reviewing payroll totals and payment details. The first version is single-user, so this persona’s responsibilities are handled by the Payroll Owner.

Key needs:
- View payroll totals.
- See GPay and Bank Account details.
- Download payroll summary PDFs and payroll slip ZIP files after approval.

## 4. Scope

### 4.1 Phase 1 In Scope: Payroll Core

- Single-user web application.
- Employee master database.
- Employee create, update, deactivate, and search.
- Employee master Excel import.
- Employee master Excel export.
- Wage history tracking.
- Attendance Excel upload for the current supported attendance format.
- Attendance import preview with on-screen errors.
- Employee matching against the master database.
- Payroll blocking when uploaded employees are unmatched, inactive, resigned before the payroll week, or have blocking attendance upload errors.
- Weekly payroll calculation.
- One-time and recurring deductions/additions.
- Weekly review and approval of applicable deductions/additions.
- In-app payroll summary preview.
- PDF payroll summary report generation.
- PDF employee payroll slip generation.
- ZIP generation for all employee payroll slips.
- Payroll correction and revision workflow.
- In-app payroll history lookup by employee and payroll week.
- Dashboard quick totals.
- Simple settings page for payroll week start day.
- Audit logs for employee create/update and wage changes.

### 4.2 Phase 2 In Scope: Employee Documents

Employee document upload and retrieval should come after the payroll workflow is working.

Phase 2 includes:
- Employee document upload to Google Cloud Storage.
- Document type metadata.
- Expiry date metadata.
- Notes metadata.
- Expired document highlighting.
- Nearing-expiry document highlighting for documents expiring within 7 days.
- Dashboard document expiry cards.

### 4.3 Out of Scope for Initial Version

- Employee document upload before payroll core is complete.
- Multi-user login and role-based access control.
- Direct bank transfers.
- Government tax filing.
- Biometric attendance device integration.
- Employee self-service portal.
- Accounting software integration.
- Multi-company payroll.
- Configurable attendance import mapping.
- Automated GCP database backups.
- Historical report, payroll slip, or ZIP downloads from payroll history.
- Explicit Prisma schema definitions in the PRD.
- Acceptance criteria sections in the PRD.

## 5. Supported File Inputs

### 5.1 Attendance Report Upload

The app supports weekly attendance upload from Excel files.

Supported formats:
- `.xls`
- `.xlsx`

Initial attendance import constraint:
- The first version supports only the current attendance report format from the uploaded sample.
- Configurable import mapping is not included in the initial version.

Attendance workbook behavior:
- A workbook can contain multiple sheets.
- Each sheet can contain attendance blocks for three employees.
- The parser must iterate through every sheet.
- The parser must iterate through every employee block inside each sheet.
- The app must not assume that one sheet equals one employee.

Default payroll week structure:
- Payroll weeks usually run from Thursday to Wednesday.
- The app must still support week dates detected from the file or manually selected during upload.

Payroll week detection order:
1. Read week dates from inside the sheet when available.
2. Infer week dates from the file name when sheet dates are unavailable.
3. Ask the user to manually select the week when dates are missing, ambiguous, conflicting, or not Thursday to Wednesday.

Attendance data required for payroll:
- Payroll week start date.
- Payroll week end date.
- Employee identifier or matchable employee name.
- Regular hours worked per day.
- Overtime hours per day.
- Site, when available.

Attendance status behavior:
- The attendance sheet does not contain attendance status labels such as Absent, Half Day, or Leave.
- Payroll calculation must use regular hours and overtime hours only.
- Blank regular hour cells and blank overtime hour cells must be treated as `0` hours.

### 5.2 Employee Master Import

The app must support importing the employee master database from Excel.

Supported initial employee master import format:
- Workbook format: `.xlsx`.
- Source sheet name: `Employee Master List`.
- Header row: row 1.
- Data rows: row 2 onward.

Supported columns:
- `SL. NO`
- `Employee ID`
- `Employee Name`
- `National ID`
- `Designation`
- `Date of Joining`
- `Aadhaar ID`
- `Police Verification ID`
- `Salary`
- `Hourly Rate`
- `Phone`
- `D.O.B`
- `Health Card ID`
- `GPay`
- `Bank Account`
- `Date of Resignation`
- `Site`
- `Active`
- `Designation Short`

Required import fields:
- Employee ID
- Employee Name
- Designation
- Salary
- Hourly Rate
- Active

Import behavior:
- The app must support partial import.
- Valid rows must be imported.
- Invalid rows must be skipped and shown in the import result.
- The app must not block the entire import because some rows are invalid.
- Existing employees must be updated by Employee ID.
- New employees must be added when the imported Employee ID does not already exist.
- Duplicate Employee ID rows inside the uploaded Excel file must update the same employee and continue processing.
- The database must enforce unique Employee ID.
- If Salary or Hourly Rate changes for an existing employee, the app must automatically create a wage history entry with the import date as the effective date.
- The uploaded employee master file must be permanently deleted immediately after successful import.

Active field behavior:
- The `Active` column maps values such as Active and Inactive into the employee active status.
- Inactive employees remain visible in search and export.
- Resigned employees remain visible in search and export.

## 6. Employee Master Data

Each employee record must support the following fields:

| Field | Requirement |
|---|---|
| SL. NO | Internal serial number or import sequence |
| Employee ID | Required unique employee identifier |
| Employee Name | Required |
| National ID | Optional |
| Designation | Required |
| Date of Joining | Optional unless made mandatory later |
| Aadhaar ID | Optional |
| Police Verification ID | Optional |
| Salary | Required |
| Hourly Rate | Required |
| Phone | Optional |
| D.O.B | Optional |
| Health Card ID | Optional |
| GPay | Optional payment identifier |
| Bank Account | Optional payment account details |
| Date of Resignation | Optional |
| Site | Optional |
| Active | Required |
| Designation Short | Optional display abbreviation |

Employee master export:
- The app must allow exporting the current employee master database to Excel.
- Export must include all employees by default.
- Export must include active, inactive, and resigned employees.
- Export must use the supported employee master column structure.

## 7. Payroll Calculation Rules

### 7.1 Currency and Precision

- All monetary amounts must display in ₹ INR by default.
- Payroll amounts must retain paise and decimal values.
- The app must not round payroll amounts to the nearest rupee.

### 7.2 Regular Pay

Regular pay is calculated from actual regular hours worked and the employee hourly rate.

```text
regularPay = sum(min(regularHoursWorkedPerDay, 8) * hourlyRate)
```

Rules:
- Regular hours are capped at 8 hours per day.
- Any hours above 8 are not automatically treated as overtime.
- Extra payable hours must come only from the overtime column.

### 7.3 Overtime Pay

Overtime pay is calculated from overtime hours in the attendance sheet.

```text
overtimePay = sum(overtimeHoursPerDay * hourlyRate)
```

Rules:
- Overtime is paid at the same hourly rate as regular hours.
- There is no overtime multiplier in the initial version.

### 7.4 Final Pay

```text
grossPay = regularPay + overtimePay
netPayable = grossPay + additions - deductions
```

Rules:
- Deductions reduce the payable amount only after weekly review approval.
- Additions increase the payable amount only after weekly review approval.
- One-time and recurring deductions/additions must appear for weekly review before being applied.

## 8. Payroll Adjustments

The app must support deductions and additions.

Adjustment types:
- Deduction: money to subtract from payroll.
- Addition: money to add to payroll.

Adjustment recurrence types:
- One-time adjustment for a selected payroll week.
- Recurring adjustment across multiple payroll weeks.

Recurring deductions and additions are included in the first version.

Recurring adjustment end conditions:
- Until a selected end payroll week.
- For a fixed number of payroll weeks.
- Until a total balance is fully deducted or paid.

Adjustment creation rules:
- Adjustment amount must support decimal values.
- Adjustment reason is required.
- Adjustment reason is required when the adjustment is created.

Weekly review behavior:
- Applicable deductions and additions must appear for review during payroll generation.
- Adjustments must be approved for the current week before they affect payroll.
- If a recurring adjustment is skipped during weekly review, it must remain pending for the next payroll week.

Each adjustment should store:
- Employee ID.
- Adjustment type.
- Amount.
- Required reason.
- Recurrence type.
- Start payroll week.
- End payroll week, when applicable.
- Fixed number of weeks, when applicable.
- Total balance, when applicable.
- Remaining balance, when applicable.
- Weekly approval status.
- Created date.

## 9. Core Workflows

### 9.1 Add Employee Manually

1. User opens Employee Management.
2. User selects Add Employee.
3. User enters required employee details.
4. User enters Salary and Hourly Rate.
5. App validates required fields and unique Employee ID.
6. App saves the employee.
7. App creates wage history where applicable.
8. App writes an audit log for employee creation.

Outcome:
- Employee is available for attendance matching and payroll generation.

### 9.2 Update Employee

1. User opens an employee profile.
2. User updates employee details.
3. If Salary or Hourly Rate changes, the app creates a wage history entry.
4. App writes an audit log for employee updates and wage changes.
5. App saves the employee.

Outcome:
- Employee details are updated while wage history remains traceable.

### 9.3 Import Employee Master from Excel

1. User opens Employee Management.
2. User selects Import Employee Master.
3. User uploads the employee master Excel workbook.
4. App validates the sheet name, columns, required fields, dates, Salary, Hourly Rate, and Active values.
5. App shows an import preview with valid rows, skipped invalid rows, duplicate Employee ID rows, and warnings.
6. User confirms import.
7. App imports valid rows.
8. App updates existing employees by Employee ID.
9. App adds new employees when the Employee ID does not already exist.
10. App creates wage history entries when imported wages change.
11. App deletes the uploaded employee master Excel file immediately after successful import.

Outcome:
- Valid employee data is imported without blocking the whole file because of invalid rows.

### 9.4 Export Employee Master to Excel

1. User opens Employee Management.
2. User selects Export Employee Master.
3. App generates an Excel file containing all employees.
4. App uses the supported employee master column structure.
5. User downloads the generated file.

Outcome:
- User can export the full employee master database, including active, inactive, and resigned employees.

### 9.5 Upload Weekly Attendance

1. User opens Attendance Upload.
2. User selects the weekly attendance Excel file.
3. App determines the payroll week from sheet content, file name, or manual user selection.
4. App validates the file type and supported structure.
5. App parses every sheet and every employee block.
6. App matches attendance records to employees in the master database.
7. App shows an import preview with matched employees, unmatched employees, inactive employees, resigned-before-week employees, valid records, invalid records, and detailed errors.
8. Attendance upload errors are shown on screen only.
9. User resolves issues through a corrected upload or employee master update.
10. Payroll generation remains blocked until all blocking issues are resolved.

Outcome:
- Attendance can be used for payroll only after errors, matching issues, inactive employees, and resignation conflicts are resolved.

### 9.6 Replace Attendance Upload for Same Week

1. User uploads a new attendance file for a payroll week that already has an upload.
2. App asks the user to proceed with replacement.
3. App validates the new file.
4. If accepted, the new upload replaces the previous file.
5. The previous attendance file is permanently deleted immediately.
6. The latest upload becomes the active source of truth for that payroll week.

Outcome:
- Only the latest attendance upload is used for payroll calculations.

### 9.7 Generate Payroll Summary

1. User selects a payroll week.
2. App loads the active attendance upload for that week.
3. App loads employee wage data and applicable adjustments.
4. App shows applicable deductions/additions for weekly review.
5. User approves or skips adjustments for the week.
6. App calculates payroll.
7. App shows an in-app payroll summary preview.
8. User reviews the summary.
9. User approves the payroll summary.
10. App generates the PDF payroll summary report.

Outcome:
- Payroll is approved and becomes eligible for payroll slip generation.

### 9.8 Generate Employee Payroll Slips

1. User approves the weekly payroll summary.
2. User selects Generate Payroll Slips.
3. App generates one PDF payroll slip per employee in the approved payroll run.
4. App packages all PDF payroll slips into one ZIP file.
5. App names the ZIP file using this pattern:

```text
payroll_slips_<startDate>_<endDate>.zip
```

Example:

```text
payroll_slips_26Mar_01Apr.zip
```

6. User downloads the ZIP file.
7. App deletes generated PDF and ZIP files permanently and immediately after download or generation once payroll data has been saved.

Outcome:
- User receives one ZIP containing all employee payroll slips for the week.

### 9.9 Correct Approved Payroll

1. User opens an approved payroll run.
2. User makes a permitted correction.
3. App creates a new payroll revision instead of overwriting the previous result.
4. User reviews the revised in-app payroll summary preview.
5. User approves the revised payroll summary.
6. App regenerates the PDF summary and payroll slip ZIP from stored payroll data.

Allowed corrections:
- Deductions.
- Additions.
- Employee wage rate.
- Employee matching.
- Employee master data used in the payroll run.
- Attendance values through a corrected attendance sheet upload.

Correction rules:
- Correction reason is optional.
- Previous calculation data remains available for audit/history.
- The latest approved revision is the current payable version.

### 9.10 Retrieve Payroll History

1. User opens Payroll History or an employee profile.
2. User searches by employee and payroll week.
3. App displays stored payroll data in the app.

Payroll history displays:
- Attendance for the week.
- Regular hours.
- Overtime hours.
- Regular pay.
- Overtime pay.
- Deductions.
- Additions.
- Gross pay.
- Net payable.

History limitations:
- Payroll history is searchable only by employee and payroll week.
- Historical summary report PDFs, payroll slip PDFs, and ZIP files are not downloadable from history.
- The app stores payroll data, not permanent generated report files.

## 10. Reports and Payroll Slips

### 10.1 Weekly Payroll Summary Report

The app must show an in-app payroll summary preview before generating the PDF report.

The weekly payroll summary report must be PDF only.

The report must include:
- Payroll week start and end date.
- Employee ID.
- Employee name.
- Designation.
- Site.
- GPay.
- Bank Account.
- Regular hours.
- Overtime hours.
- Regular pay.
- Overtime pay.
- Additions.
- Deductions.
- Net payable.
- Payroll total.

### 10.2 Employee Payroll Slip

Employee payroll slips must be PDF only.

Each payroll slip must be a simple payroll slip without company branding.

Invoice numbers are not required.

Each payroll slip must include:
- Employee ID.
- Employee name.
- Designation.
- GPay.
- Bank Account.
- Attendance for that week.
- Hours worked per day.
- Overtime per day.
- Deductions.
- Additions.
- Gross wage.
- Net payable.
- Payroll week.
- Generated date.

### 10.3 Generated File Storage Rules

Generated files are temporary.

The app must permanently delete the following immediately after download or generation once payroll data has been saved:
- Payroll summary PDFs.
- Employee payroll slip PDFs.
- Payroll slip ZIP files.

The app must preserve payroll calculation data so reports and slips can be regenerated when needed.

## 11. Dashboard

The dashboard must show quick operational totals and alerts.

Dashboard cards:
- Current active employee count.
- Latest payroll total in ₹ INR.
- Pending attendance upload errors.
- Pending adjustment approvals.
- Expired employee documents, after document upload is added.
- Employee documents nearing expiry within 7 days, after document upload is added.

Dashboard cards should navigate to the relevant workflow.

## 12. Settings

The app must include a simple settings page.

Initial editable setting:
- Payroll week start day.

Fixed defaults for the initial version:
- Currency display: ₹ INR.
- Document nearing-expiry threshold: 7 days.

The app must use the configured payroll week start day for future payroll week defaults.

## 13. Access Model

The initial version is a single-user app.

Rules:
- No role-based access control is required in the first version.
- The single user has full access to all app features.
- The architecture should not block adding authentication, users, and roles in a future version.

## 14. Technical Architecture

### 14.1 Application Stack

The app will be built using:
- Next.js.
- React.
- Tailwind CSS.
- ShadCN UI.
- PostgreSQL.
- Prisma.

### 14.2 Hosting

The app will be hosted on Google Cloud Platform.

Recommended GCP services:
- Application hosting on GCP.
- PostgreSQL hosted on Cloud SQL.
- Google Cloud Storage private buckets for files.

Automated GCP database backups are not required for the initial version.

### 14.3 Backend Architecture

The backend can be implemented using Next.js API routes or server actions.

Core backend services:
- Employee service.
- Employee master import service.
- Employee master export service.
- Attendance import service for the current uploaded attendance sheet format.
- Payroll calculation service.
- Adjustment service.
- Payroll revision service.
- PDF generation service.
- ZIP generation service.
- Payroll history service.
- Dashboard service.
- Settings service.
- Audit log service.
- Document service after payroll core is working.

### 14.4 File Storage

Google Cloud Storage must be used for:
- Active attendance uploads.
- Employee documents in Phase 2.

Temporary generated files:
- Payroll summary PDFs.
- Payroll slip PDFs.
- Payroll slip ZIP files.

Deletion rules:
- Replaced attendance files must be permanently deleted immediately.
- Employee master import files must be permanently deleted immediately after successful import.
- Generated PDFs and ZIP files must be permanently deleted immediately after download or generation once payroll data has been saved.

## 15. Data Model Draft

This section describes the logical data model. It is not intended to be an explicit Prisma schema.

### 15.1 Employee

- id.
- employeeImportBatchId.
- employeeId.
- serialNumber.
- employeeName.
- nationalId.
- designation.
- dateOfJoining.
- aadhaarId.
- policeVerificationId.
- phone.
- dateOfBirth.
- healthCardId.
- gPay.
- bankAccount.
- dateOfResignation.
- site.
- isActive.
- designationShort.
- createdAt.
- updatedAt.

### 15.2 Employee Import Batch

- id.
- fileName.
- fileType.
- status.
- importedAt.
- importedRowCount.
- updatedEmployeeCount.
- createdEmployeeCount.
- rejectedRowCount.
- duplicateEmployeeIdRowCount.
- sourceFileDeletedAt.

### 15.3 Employee Wage History

- id.
- employeeId.
- weeklySalary.
- hourlyRate.
- effectiveFrom.
- effectiveTo.
- changeSource.
- employeeImportBatchId.
- changedBy.
- createdAt.

### 15.4 Attendance Upload

- id.
- fileName.
- fileType.
- payrollWeekStartDate.
- payrollWeekEndDate.
- payrollWeekSource.
- status.
- isActiveForPayrollWeek.
- uploadedBy.
- uploadedAt.
- sourceFilePath.

### 15.5 Attendance Record

- id.
- attendanceUploadId.
- employeeId.
- attendanceDate.
- regularHours.
- overtimeHours.
- sourceSheetName.
- sourceEmployeeBlockIndex.
- createdAt.

### 15.6 Payroll Adjustment

- id.
- employeeId.
- adjustmentType.
- recurrenceType.
- amount.
- reason.
- startPayrollWeekStartDate.
- startPayrollWeekEndDate.
- endPayrollWeekStartDate.
- endPayrollWeekEndDate.
- totalRecurrenceWeeks.
- totalBalance.
- remainingBalance.
- recurrenceEndType.
- status.
- skippedCarryForwardCount.
- createdBy.
- createdAt.

### 15.7 Payroll Adjustment Application

- id.
- payrollAdjustmentId.
- payrollRunId.
- payrollRevisionId.
- employeeId.
- payrollWeekStartDate.
- payrollWeekEndDate.
- appliedAmount.
- approvalStatus.
- approvedBy.
- approvedAt.
- appliedAt.
- skippedAt.
- carriedForwardToPayrollWeekStartDate.
- isReversed.

### 15.8 Payroll Run

- id.
- payrollWeekStartDate.
- payrollWeekEndDate.
- status.
- currentRevisionNumber.
- totalRegularPay.
- totalOvertimePay.
- totalAdditions.
- totalDeductions.
- totalNetPayable.
- generatedBy.
- approvedBy.
- generatedAt.
- approvedAt.
- invoicesGeneratedAt.

### 15.9 Payroll Revision

- id.
- payrollRunId.
- revisionNumber.
- status.
- correctionReason.
- totalRegularPay.
- totalOvertimePay.
- totalAdditions.
- totalDeductions.
- totalNetPayable.
- generatedBy.
- approvedBy.
- generatedAt.
- approvedAt.
- invoicesGeneratedAt.
- isCurrent.

### 15.10 Payroll Run Employee

- id.
- payrollRunId.
- payrollRevisionId.
- employeeId.
- weeklySalaryUsed.
- hourlyRateUsed.
- regularHours.
- overtimeHours.
- regularPay.
- overtimePay.
- additions.
- deductions.
- netPayable.

### 15.11 Invoice / Payroll Slip Snapshot

- id.
- payrollRunId.
- payrollRevisionId.
- employeeId.
- invoiceFormat.
- invoiceSnapshotJson.
- generatedAt.
- temporaryFileDeletedAt.

### 15.12 Audit Log

Audit logs are required only for:
- Employee creation.
- Employee updates.
- Wage changes.

Fields:
- id.
- actionType.
- entityType.
- entityId.
- detailsJson.
- createdAt.

### 15.13 Employee Document: Phase 2

- id.
- employeeId.
- documentType.
- expiryDate.
- notes.
- filePath.
- uploadedAt.
- updatedAt.

## 16. Validation and Blocking Rules

### 16.1 Attendance Upload Blocking Rules

Payroll generation must be blocked when:
- Attendance upload has unresolved blocking errors.
- An uploaded employee cannot be matched to the employee master database.
- An uploaded employee is matched to an inactive employee record.
- An uploaded employee has Date of Resignation before the payroll week.
- Attendance data contains invalid dates or invalid hour values.

Payroll generation must not be blocked when:
- Regular hour cells are blank.
- Overtime hour cells are blank.

Blank hour cells must be converted to `0` hours.

### 16.2 Employee Import Validation Rules

Employee master import must support partial import.

Rows must be skipped when required fields are missing or invalid.

Required fields:
- Employee ID.
- Employee Name.
- Designation.
- Salary.
- Hourly Rate.
- Active.

Duplicate Employee ID values inside the uploaded file must not block the import. The app must update the employee and continue processing.

### 16.3 Inactive and Resigned Employee Rules

- Inactive employees remain visible in employee search.
- Resigned employees remain visible in employee search.
- Inactive and resigned employees are included in employee master export.
- Payroll generation is blocked when an inactive employee appears in attendance.
- Payroll generation is blocked when an employee’s Date of Resignation is before the payroll week.

## 17. Security, Privacy, and Reliability

### 17.1 Security

- Initial version is single-user.
- Uploaded documents must be stored privately in Google Cloud Storage after Phase 2 is added.
- Bank Account and GPay details are visible on payroll slips and payroll summary reports.
- The app should avoid exposing sensitive employee details unnecessarily outside relevant screens and reports.

### 17.2 Reliability

- The app must preserve payroll calculation data.
- Approved payroll corrections must create revisions instead of overwriting prior data.
- The current approved revision must be clearly identifiable.
- Attendance replacement must delete the previous attendance file immediately.
- Temporary generated report and ZIP files must be deleted immediately after download or generation once data is saved.

### 17.3 Auditability

The app must keep audit logs for:
- Employee creation.
- Employee updates.
- Wage changes.

Audit logs are not required for every payroll or file action in the initial version.

## 18. Phased MVP Roadmap

### Phase 1: Payroll Core

Goal: deliver the core weekly payroll workflow from employee master data and attendance upload through payroll summary approval and payroll slip ZIP generation.

Scope:
- Employee master create, edit, deactivate, and search.
- Employee master Excel import and export.
- Wage history creation when wages change.
- Attendance Excel upload for the current supported attendance format.
- Attendance import preview with on-screen errors.
- Blocking payroll generation until upload errors, unmatched employees, inactive employees, and resigned-before-week employees are resolved.
- Payroll calculation using regular hours, overtime hours, hourly rate, deductions, and additions.
- One-time and recurring deductions/additions.
- Weekly review and approval of applicable deductions/additions.
- In-app payroll summary preview.
- PDF payroll summary report generation.
- Employee payroll slip PDF generation.
- Invoice ZIP generation using the configured naming pattern.
- Payroll history display by employee and payroll week.
- Dashboard quick totals.
- Settings page for payroll week start day.
- Audit logs for employee create/update and wage changes.

### Phase 2: Employee Documents

Goal: add employee document storage and expiry visibility after the payroll workflow is working.

Scope:
- Employee document upload to Google Cloud Storage.
- Document type, expiry date, and notes.
- Expired document highlighting.
- Nearing-expiry document highlighting within 7 days.
- Dashboard document expiry cards.

### Phase 3: Enhancements

Goal: improve operational convenience without changing the core payroll rules.

Potential scope:
- Multi-user login and roles.
- Configurable document expiry threshold.
- Additional payroll settings.
- Additional attendance import formats.
- Optional report export formats beyond PDF.
- Optional historical report regeneration from stored payroll data.

## 19. Confirmed Product Decisions

- Payroll week usually runs Thursday to Wednesday.
- Payroll week can be detected from the sheet, inferred from file name, or manually selected.
- Payroll is calculated using hourly rate, regular hours, and overtime hours.
- Regular hours are capped at 8 per day.
- Overtime is paid at the same hourly rate.
- Extra payable hours come only from the overtime column.
- Blank hour cells are treated as 0.
- Payroll amounts retain paise and decimals.
- Currency is ₹ INR by default.
- Attendance sheet is the source of truth for attendance.
- Attendance cannot be manually edited before payroll generation.
- Attendance corrections require uploading a corrected attendance file.
- New attendance upload for the same payroll week replaces the previous upload.
- Replaced attendance files are permanently deleted immediately.
- Payroll generation is blocked for unmatched employees.
- Payroll generation is blocked for inactive employees.
- Payroll generation is blocked for employees resigned before the payroll week.
- Employee master import supports partial import.
- Employee master import updates by Employee ID and adds new employees.
- Duplicate Employee ID rows in import update the same employee and continue.
- Employee master import file is deleted after successful import.
- Employee master export includes all employees.
- Recurring deductions/additions are included in the first version.
- Recurring adjustments can end by end week, fixed number of weeks, or total balance.
- Recurring adjustments require weekly review approval before being applied.
- Skipped recurring adjustments remain pending for the next week.
- Adjustment reasons are required when creating adjustments.
- Correction reasons are optional for payroll revisions.
- Payroll summary report is PDF only.
- Employee payroll slips are PDF only.
- Payroll slips are simple and unbranded.
- Invoice numbers are not required.
- Payroll slips and summary reports show GPay and Bank Account details.
- Payroll history is searchable only by employee and payroll week.
- Payroll history displays stored data in the app only.
- Generated PDFs and ZIP files are temporary and deleted after download or generation once payroll data is saved.
- The app is single-user in the first version.
- The app is hosted on GCP.
- File storage uses Google Cloud Storage.
- PostgreSQL with Prisma is used for the database layer.
- The app stack is Next.js, React, Tailwind CSS, and ShadCN UI.
- Automated GCP database backups are not required in the initial version.
- Audit logs are required for employee create/update and wage changes only.
- Employee document upload comes after payroll core is working.
- A simple settings page must include payroll week start day.

