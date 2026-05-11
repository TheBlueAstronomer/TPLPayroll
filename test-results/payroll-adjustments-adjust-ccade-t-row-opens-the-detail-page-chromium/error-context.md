# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-adjustments\adjustments-flow.spec.ts >> E2E-07: View all adjustments >> navigating to an adjustment row opens the detail page
- Location: e2e\payroll-adjustments\adjustments-flow.spec.ts:147:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('tbody tr')
Expected: 3
Received: 4
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" with timeout 10000ms
  - waiting for locator('tbody tr')
    2 × locator resolved to 10 elements
      - unexpected value "10"
    - locator resolved to 4 elements
    - unexpected value "4"
    - locator resolved to 10 elements
    - unexpected value "10"
    10 × locator resolved to 4 elements
       - unexpected value "4"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]: TPL Payroll
      - navigation [ref=e5]:
        - link "Dashboard" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e8]
          - text: Dashboard
        - link "Employees" [ref=e10] [cursor=pointer]:
          - /url: /employees
          - img [ref=e12]
          - text: Employees
        - link "Attendance" [ref=e14] [cursor=pointer]:
          - /url: /attendance
          - img [ref=e16]
          - text: Attendance
        - link "Payroll" [ref=e18] [cursor=pointer]:
          - /url: /payroll
          - img [ref=e20]
          - text: Payroll
        - link "Adjustments" [ref=e22] [cursor=pointer]:
          - /url: /adjustments
          - img [ref=e24]
          - text: Adjustments
        - link "History" [ref=e26] [cursor=pointer]:
          - /url: /history
          - img [ref=e28]
          - text: History
        - link "Settings" [ref=e30] [cursor=pointer]:
          - /url: /settings
          - img [ref=e32]
          - text: Settings
        - link "Audit Log" [ref=e34] [cursor=pointer]:
          - /url: /audit-log
          - img [ref=e36]
          - text: Audit Log
    - main [ref=e39]:
      - generic [ref=e40]:
        - generic [ref=e41]:
          - heading "Payroll Adjustments" [level=1] [ref=e42]
          - button "New Adjustment" [ref=e43]:
            - img [ref=e44]
            - text: New Adjustment
        - generic [ref=e46]:
          - generic [ref=e47]:
            - img
            - textbox "Search employee…" [ref=e48]
          - combobox [ref=e49]:
            - option "All types" [selected]
            - option "Deduction"
            - option "Addition"
          - combobox [ref=e50]:
            - option "All statuses" [selected]
            - option "Active"
            - option "Done"
            - option "Cancelled"
        - table [ref=e52]:
          - rowgroup [ref=e53]:
            - row "Employee Type Amount Recurrence Status" [ref=e54]:
              - columnheader "Employee" [ref=e55]
              - columnheader "Type" [ref=e56]
              - columnheader "Amount" [ref=e57]
              - columnheader "Recurrence" [ref=e58]
              - columnheader "Status" [ref=e59]
          - rowgroup [ref=e60]:
            - row "Adjustment Test Employee EMP-ADJ-001 Deduction ₹2,000 Recurring Active" [ref=e61] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e62]:
                - generic [ref=e63]:
                  - generic [ref=e64]: Adjustment Test Employee
                  - generic [ref=e65]: EMP-ADJ-001
              - cell "Deduction" [ref=e66]:
                - generic [ref=e67]: Deduction
              - cell "₹2,000" [ref=e68]:
                - generic [ref=e69]: ₹2,000
              - cell "Recurring" [ref=e70]
              - cell "Active" [ref=e71]:
                - generic [ref=e72]:
                  - img [ref=e73]
                  - text: Active
            - row "Adjustment Test Employee EMP-ADJ-001 Deduction ₹2,000 Recurring Done" [ref=e75] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e76]:
                - generic [ref=e77]:
                  - generic [ref=e78]: Adjustment Test Employee
                  - generic [ref=e79]: EMP-ADJ-001
              - cell "Deduction" [ref=e80]:
                - generic [ref=e81]: Deduction
              - cell "₹2,000" [ref=e82]:
                - generic [ref=e83]: ₹2,000
              - cell "Recurring" [ref=e84]
              - cell "Done" [ref=e85]:
                - generic [ref=e86]:
                  - img [ref=e87]
                  - text: Done
            - row "Adjustment Test Employee EMP-ADJ-001 Addition ₹1,000 Recurring Active" [ref=e89] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e90]:
                - generic [ref=e91]:
                  - generic [ref=e92]: Adjustment Test Employee
                  - generic [ref=e93]: EMP-ADJ-001
              - cell "Addition" [ref=e94]:
                - generic [ref=e95]: Addition
              - cell "₹1,000" [ref=e96]:
                - generic [ref=e97]: ₹1,000
              - cell "Recurring" [ref=e98]
              - cell "Active" [ref=e99]:
                - generic [ref=e100]:
                  - img [ref=e101]
                  - text: Active
            - row "Adjustment Test Employee EMP-ADJ-001 Deduction ₹500 One-time Active" [ref=e103] [cursor=pointer]:
              - cell "Adjustment Test Employee EMP-ADJ-001" [ref=e104]:
                - generic [ref=e105]:
                  - generic [ref=e106]: Adjustment Test Employee
                  - generic [ref=e107]: EMP-ADJ-001
              - cell "Deduction" [ref=e108]:
                - generic [ref=e109]: Deduction
              - cell "₹500" [ref=e110]:
                - generic [ref=e111]: ₹500
              - cell "One-time" [ref=e112]
              - cell "Active" [ref=e113]:
                - generic [ref=e114]:
                  - img [ref=e115]
                  - text: Active
        - generic [ref=e117]:
          - paragraph [ref=e118]: Showing 1–4 of 4
          - generic [ref=e119]:
            - button "Previous page" [disabled] [ref=e120]:
              - img [ref=e121]
            - button "1" [ref=e123]
            - button "Next page" [disabled] [ref=e124]:
              - img [ref=e125]
  - button "Open Next.js Dev Tools" [ref=e132] [cursor=pointer]:
    - img [ref=e133]
  - alert [ref=e136]
```

# Test source

```ts
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
> 152 |     await expect(page.locator('tbody tr')).toHaveCount(3, { timeout: 10000 })
      |                                            ^ Error: expect(locator).toHaveCount(expected) failed
  153 | 
  154 |     // Click first row
  155 |     await page.click('tbody tr:first-child')
  156 | 
  157 |     // Should navigate to detail page
  158 |     await expect(page).toHaveURL(/\/adjustments\/[a-z0-9-]+/, { timeout: 5000 })
  159 |     await expect(page.locator('h1:has-text("Adjustment Detail")')).toBeVisible()
  160 |     await expect(page.locator('text=Application History')).toBeVisible()
  161 |   })
  162 | 
  163 |   test('filter by type shows only deductions', async ({ page }) => {
  164 |     await page.goto('/adjustments')
  165 |     await expect(page.locator('h1:has-text("Payroll Adjustments")')).toBeVisible()
  166 | 
  167 |     // Filter by Deduction
  168 |     await page.selectOption('select', { label: 'Deduction' })
  169 | 
  170 |     // Wait for table refresh
  171 |     await page.waitForTimeout(400)
  172 | 
  173 |     // All visible type badges should be Deduction
  174 |     const badges = page.locator('td span:has-text("Deduction")')
  175 |     await expect(badges.first()).toBeVisible({ timeout: 5000 })
  176 | 
  177 |     // No Addition badge should be visible
  178 |     const additionBadges = page.locator('td span:has-text("Addition")')
  179 |     await expect(additionBadges).toHaveCount(0)
  180 |   })
  181 | })
  182 | 
  183 | // ─── E2E-form-validation: Validate form errors ────────────────────────────────
  184 | 
  185 | test.describe('Form validation', () => {
  186 |   test('shows validation error when reason is missing', async ({ page }) => {
  187 |     await page.goto('/adjustments/new')
  188 | 
  189 |     // Select employee
  190 |     await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
  191 |     await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
  192 |     await page.click('text=Adjustment Test Employee')
  193 | 
  194 |     // Fill amount but leave reason empty
  195 |     await page.fill('input#amount', '500')
  196 | 
  197 |     // Select week
  198 |     const weekSelect = page.locator('select#weekValue')
  199 |     await weekSelect.selectOption({ index: 1 })
  200 | 
  201 |     // Submit without filling reason
  202 |     await page.click('button:has-text("Save Adjustment")')
  203 | 
  204 |     // Should show validation error
  205 |     await expect(page.locator('text=Reason is required')).toBeVisible({ timeout: 3000 })
  206 | 
  207 |     // Should NOT navigate away
  208 |     await expect(page).toHaveURL('/adjustments/new')
  209 |   })
  210 | })
  211 | 
```