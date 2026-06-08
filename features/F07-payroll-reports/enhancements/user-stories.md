# User Stories: Dual-Format Summary & Enhancements

## Epic
As a payroll admin, I want to download payroll summaries in Excel so I can easily edit and share data with accountants, while still having access to the PDF format and a premium user interface.

## User Stories

### 1. Excel Payroll Summary
**As a** payroll admin
**I want** to download the payroll summary in `.xlsx` format
**So that** I can manipulate the data and share it with accounting without manual data entry.

**Acceptance Criteria:**
- The existing summary endpoint supports `?format=xlsx`.
- Columns are updated to the 9-column format (removing hours, keeping pay breakdowns).
- Currency cells are formatted as numbers with the "₹" symbol.

### 2. PDF Payroll Summary Retention
**As a** payroll admin
**I want** to still be able to download the summary in `.pdf` format
**So that** I have an uneditable, print-ready document for official records.

**Acceptance Criteria:**
- The endpoint supports `?format=pdf`.
- Layout matches the 9-column format exactly like the Excel file.

### 3. Currency Symbol Standardization
**As a** payroll admin
**I want** all reports and slips to use the "₹" symbol instead of "Rs."
**So that** the documentation looks modern and mathematically consistent.

**Acceptance Criteria:**
- All PDF generations (slips and summaries) replace "Rs." with "₹".
- Excel generations format currency cells using the "₹" symbol.

### 4. Split-Button UI Experience
**As a** payroll admin
**I want** a clean, animated dropdown to select my download format
**So that** the interface remains uncluttered while offering advanced options.

**Acceptance Criteria:**
- The main action button triggers the default Excel download.
- A caret button opens a sleek, framer-motion animated dropdown.
- The UI matches the exact styling (padding, borders, tactile feedback) of adjacent buttons for a consistent design system.
