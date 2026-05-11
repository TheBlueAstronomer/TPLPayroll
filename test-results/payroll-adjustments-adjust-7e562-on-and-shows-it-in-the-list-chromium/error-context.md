# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-adjustments\adjustments-flow.spec.ts >> E2E-01: Create one-time deduction >> creates a one-time deduction and shows it in the list
- Location: e2e\payroll-adjustments\adjustments-flow.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Adjustment Test Employee')
Expected: visible
Error: strict mode violation: locator('text=Adjustment Test Employee') resolved to 4 elements:
    1) <span class="text-sm font-medium text-zinc-900">Adjustment Test Employee</span> aka getByText('Adjustment Test Employee').first()
    2) <span class="text-sm font-medium text-zinc-900">Adjustment Test Employee</span> aka getByText('Adjustment Test Employee').nth(1)
    3) <span class="text-sm font-medium text-zinc-900">Adjustment Test Employee</span> aka getByText('Adjustment Test Employee').nth(2)
    4) <span class="text-sm font-medium text-zinc-900">Adjustment Test Employee</span> aka getByText('Adjustment Test Employee').nth(3)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Adjustment Test Employee')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]: Payroll Adjustments — TPL Payroll
  - generic [ref=e12]:
    - complementary [ref=e13]:
      - generic [ref=e14]: TPL Payroll
      - navigation [ref=e15]:
        - link "Dashboard" [ref=e16] [cursor=pointer]:
          - /url: /
          - img [ref=e18]
          - text: Dashboard
        - link "Employees" [ref=e20] [cursor=pointer]:
          - /url: /employees
          - img [ref=e22]
          - text: Employees
        - link "Attendance" [ref=e24] [cursor=pointer]:
          - /url: /attendance
          - img [ref=e26]
          - text: Attendance
        - link "Payroll" [ref=e28] [cursor=pointer]:
          - /url: /payroll
          - img [ref=e30]
          - text: Payroll
        - link "Adjustments" [ref=e32] [cursor=pointer]:
          - /url: /adjustments
          - img [ref=e34]
          - text: Adjustments
        - link "History" [ref=e36] [cursor=pointer]:
          - /url: /history
          - img [ref=e38]
          - text: History
        - link "Settings" [ref=e40] [cursor=pointer]:
          - /url: /settings
          - img [ref=e42]
          - text: Settings
        - link "Audit Log" [ref=e44] [cursor=pointer]:
          - /url: /audit-log
          - img [ref=e46]
          - text: Audit Log
    - main [ref=e49]:
      - generic [ref=e50]:
        - generic [ref=e51]:
          - heading "Payroll Adjustments" [level=1] [ref=e52]
          - button "New Adjustment" [ref=e53]:
            - img [ref=e54]
            - text: New Adjustment
        - generic [ref=e56]:
          - generic [ref=e57]:
            - img
            - textbox "Search employee…" [ref=e58]
          - combobox [ref=e59]:
            - option "All types" [selected]
            - option "Deduction"
            - option "Addition"
          - combobox [ref=e60]:
            - option "All statuses" [selected]
            - option "Active"
            - option "Done"
            - option "Cancelled"
        - table [ref=e62]:
          - rowgroup [ref=e63]:
            - row "Employee Type Amount Recurrence Status" [ref=e64]:
              - columnheader "Employee" [ref=e65]
              - columnheader "Type" [ref=e66]
              - columnheader "Amount" [ref=e67]
              - columnheader "Recurrence" [ref=e68]
              - columnheader "Status" [ref=e69]
          - rowgroup [ref=e70]:
            - row "Adjustment Test Employee EMP-ADJ-001 Deduction ₹500 One-time Active" [ref=e71] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e72]:
                - generic [ref=e73]:
                  - generic [ref=e74]: Adjustment Test Employee
                  - generic [ref=e75]: EMP-ADJ-001
              - cell "Deduction" [ref=e76]:
                - generic [ref=e77]: Deduction
              - cell "₹500" [ref=e78]:
                - generic [ref=e79]: ₹500
              - cell "One-time" [ref=e80]
              - cell "Active" [ref=e81]:
                - generic [ref=e82]:
                  - img [ref=e83]
                  - text: Active
            - row "Adjustment Test Employee EMP-ADJ-001 Deduction ₹2,000 Recurring Done" [ref=e85] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e86]:
                - generic [ref=e87]:
                  - generic [ref=e88]: Adjustment Test Employee
                  - generic [ref=e89]: EMP-ADJ-001
              - cell "Deduction" [ref=e90]:
                - generic [ref=e91]: Deduction
              - cell "₹2,000" [ref=e92]:
                - generic [ref=e93]: ₹2,000
              - cell "Recurring" [ref=e94]
              - cell "Done" [ref=e95]:
                - generic [ref=e96]:
                  - img [ref=e97]
                  - text: Done
            - row "Adjustment Test Employee EMP-ADJ-001 Addition ₹1,000 Recurring Active" [ref=e99] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e100]:
                - generic [ref=e101]:
                  - generic [ref=e102]: Adjustment Test Employee
                  - generic [ref=e103]: EMP-ADJ-001
              - cell "Addition" [ref=e104]:
                - generic [ref=e105]: Addition
              - cell "₹1,000" [ref=e106]:
                - generic [ref=e107]: ₹1,000
              - cell "Recurring" [ref=e108]
              - cell "Active" [ref=e109]:
                - generic [ref=e110]:
                  - img [ref=e111]
                  - text: Active
            - row "Adjustment Test Employee EMP-ADJ-001 Deduction ₹500 One-time Active" [ref=e113] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e114]:
                - generic [ref=e115]:
                  - generic [ref=e116]: Adjustment Test Employee
                  - generic [ref=e117]: EMP-ADJ-001
              - cell "Deduction" [ref=e118]:
                - generic [ref=e119]: Deduction
              - cell "₹500" [ref=e120]:
                - generic [ref=e121]: ₹500
              - cell "One-time" [ref=e122]
              - cell "Active" [ref=e123]:
                - generic [ref=e124]:
                  - img [ref=e125]
                  - text: Active
        - generic [ref=e127]:
          - paragraph [ref=e128]: Showing 1–4 of 4
          - generic [ref=e129]:
            - button "Previous page" [disabled] [ref=e130]:
              - img [ref=e131]
            - button "1" [ref=e133]
            - button "Next page" [disabled] [ref=e134]:
              - img [ref=e135]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test'
  2   | import { cleanupDatabase, seedAdjustmentTestData } from '../utils/db'
  3   | 
  4   | // ─── Seed data for adjustment tests ──────────────────────────────────────────
  5   | 
  6   | test.beforeAll(async () => {
  7   |   await cleanupDatabase()
  8   |   await seedAdjustmentTestData()
  9   | })
  10  | 
  11  | // ─── E2E-01: Create a one-time deduction ─────────────────────────────────────
  12  | 
  13  | test.describe('E2E-01: Create one-time deduction', () => {
  14  |   test('creates a one-time deduction and shows it in the list', async ({ page }) => {
  15  |     await page.goto('/adjustments')
  16  |     await expect(page.locator('h1:has-text("Payroll Adjustments")')).toBeVisible()
  17  | 
  18  |     // Click "New Adjustment"
  19  |     await page.click('button:has-text("New Adjustment")')
  20  |     await expect(page).toHaveURL('/adjustments/new')
  21  |     await expect(page.locator('h1:has-text("New Payroll Adjustment")')).toBeVisible()
  22  | 
  23  |     // Select employee (EMP-ADJ-001 — Adjustment Test Employee)
  24  |     await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
  25  |     await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
  26  |     await page.click('text=Adjustment Test Employee')
  27  | 
  28  |     // Set type to Deduction (default)
  29  |     await page.check('input[value="DEDUCTION"]')
  30  | 
  31  |     // Fill amount
  32  |     await page.fill('input#amount', '500')
  33  | 
  34  |     // Fill reason
  35  |     await page.fill('textarea#reason', 'Advance recovery')
  36  | 
  37  |     // Keep recurrence as One-time (default)
  38  |     await page.check('input[value="ONE_TIME"]')
  39  | 
  40  |     // Select a payroll week
  41  |     const weekSelect = page.locator('select#weekValue')
  42  |     await weekSelect.selectOption({ index: 1 })
  43  | 
  44  |     // Submit
  45  |     await page.click('button:has-text("Save Adjustment")')
  46  | 
  47  |     // Should redirect back to list with success
  48  |     await expect(page).toHaveURL('/adjustments', { timeout: 5000 })
  49  | 
  50  |     // The new adjustment should appear in the list
> 51  |     await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  52  |     await expect(page.locator('text=Advance recovery')).not.toBeVisible() // reason not shown in list
  53  |     await expect(
  54  |       page.locator('td:has-text("One-time")'),
  55  |     ).toBeVisible()
  56  |   })
  57  | })
  58  | 
  59  | // ─── E2E-02: Create a recurring addition with fixed weeks ─────────────────────
  60  | 
  61  | test.describe('E2E-02: Create recurring addition with fixed weeks', () => {
  62  |   test('creates a recurring addition for 4 weeks', async ({ page }) => {
  63  |     await page.goto('/adjustments/new')
  64  | 
  65  |     // Select employee
  66  |     await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
  67  |     await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
  68  |     await page.click('text=Adjustment Test Employee')
  69  | 
  70  |     // Type = Addition
  71  |     await page.check('input[value="ADDITION"]')
  72  | 
  73  |     // Amount
  74  |     await page.fill('input#amount', '1000')
  75  | 
  76  |     // Reason
  77  |     await page.fill('textarea#reason', 'Transport allowance')
  78  | 
  79  |     // Recurrence = Recurring
  80  |     await page.check('input[value="RECURRING"]')
  81  | 
  82  |     // Select start week
  83  |     const weekSelect = page.locator('select#weekValue')
  84  |     await weekSelect.selectOption({ index: 1 })
  85  | 
  86  |     // End condition = Fixed weeks
  87  |     await page.selectOption('select#recurrenceEndType', 'FIXED_WEEKS')
  88  | 
  89  |     // Total weeks = 4
  90  |     await page.fill('input#totalRecurrenceWeeks', '4')
  91  | 
  92  |     // Submit
  93  |     await page.click('button:has-text("Save Adjustment")')
  94  | 
  95  |     // Should redirect back to list
  96  |     await expect(page).toHaveURL('/adjustments', { timeout: 5000 })
  97  | 
  98  |     // The recurring addition should appear
  99  |     await expect(page.locator('td:has-text("Recurring")')).toBeVisible({ timeout: 5000 })
  100 |   })
  101 | })
  102 | 
  103 | // ─── E2E-03: Create a recurring deduction with total balance ─────────────────
  104 | 
  105 | test.describe('E2E-03: Create recurring deduction with total balance', () => {
  106 |   test('creates a loan recovery adjustment with total balance of ₹8000', async ({ page }) => {
  107 |     await page.goto('/adjustments/new')
  108 | 
  109 |     // Select employee
  110 |     await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
  111 |     await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
  112 |     await page.click('text=Adjustment Test Employee')
  113 | 
  114 |     // Type = Deduction
  115 |     await page.check('input[value="DEDUCTION"]')
  116 | 
  117 |     // Amount per week
  118 |     await page.fill('input#amount', '2000')
  119 | 
  120 |     // Reason
  121 |     await page.fill('textarea#reason', 'Loan recovery')
  122 | 
  123 |     // Recurrence = Recurring
  124 |     await page.check('input[value="RECURRING"]')
  125 | 
  126 |     // Start week
  127 |     const weekSelect = page.locator('select#weekValue')
  128 |     await weekSelect.selectOption({ index: 1 })
  129 | 
  130 |     // End condition = Total balance
  131 |     await page.selectOption('select#recurrenceEndType', 'TOTAL_BALANCE')
  132 | 
  133 |     // Total balance
  134 |     await page.fill('input#totalBalance', '8000')
  135 | 
  136 |     // Submit
  137 |     await page.click('button:has-text("Save Adjustment")')
  138 | 
  139 |     // Should redirect back
  140 |     await expect(page).toHaveURL('/adjustments', { timeout: 5000 })
  141 |   })
  142 | })
  143 | 
  144 | // ─── E2E-07: View all adjustments for an employee ────────────────────────────
  145 | 
  146 | test.describe('E2E-07: View all adjustments', () => {
  147 |   test('navigating to an adjustment row opens the detail page', async ({ page }) => {
  148 |     await page.goto('/adjustments')
  149 |     await expect(page.locator('h1:has-text("Payroll Adjustments")')).toBeVisible()
  150 | 
  151 |     // Wait for table to load
```