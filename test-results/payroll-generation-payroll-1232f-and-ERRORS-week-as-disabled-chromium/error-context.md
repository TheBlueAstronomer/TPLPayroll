# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-generation\payroll-flow.spec.ts >> E2E-01: Payroll week list >> shows READY week with Generate button and ERRORS week as disabled
- Location: e2e\payroll-generation\payroll-flow.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('span:has-text("Generate")')
Expected: visible
Error: strict mode violation: locator('span:has-text("Generate")') resolved to 3 elements:
    1) <span class="text-xs text-zinc-400">Not generated</span> aka getByText('Not generated').first()
    2) <span title="Resolve attendance errors first" class="cursor-not-allowed rounded-xl bg-emerald-600/40 px-3 py-1.5 text-xs font-medium text-white">Generate</span> aka getByTitle('Resolve attendance errors')
    3) <span class="text-xs text-zinc-400">Not generated</span> aka getByText('Not generated').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('span:has-text("Generate")')

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
        - heading "Payroll Generation" [level=1] [ref=e41]
        - table [ref=e43]:
          - rowgroup [ref=e44]:
            - row "Week Attendance Payroll Action" [ref=e45]:
              - columnheader "Week" [ref=e46]
              - columnheader "Attendance" [ref=e47]
              - columnheader "Payroll" [ref=e48]
              - columnheader "Action" [ref=e49]
          - rowgroup [ref=e50]:
            - row "13 Mar 2025 – 19 Mar 2025 Errors Not generated Generate" [ref=e51]:
              - cell "13 Mar 2025 – 19 Mar 2025" [ref=e52]
              - cell "Errors" [ref=e53]:
                - generic [ref=e54]:
                  - img [ref=e55]
                  - text: Errors
              - cell "Not generated" [ref=e57]
              - cell "Generate" [ref=e58]
            - row "6 Mar 2025 – 12 Mar 2025 Ready Not generated Generate" [ref=e59]:
              - cell "6 Mar 2025 – 12 Mar 2025" [ref=e60]
              - cell "Ready" [ref=e61]:
                - generic [ref=e62]:
                  - img [ref=e63]
                  - text: Ready
              - cell "Not generated" [ref=e65]
              - cell "Generate" [ref=e66]:
                - link "Generate" [ref=e67] [cursor=pointer]:
                  - /url: /payroll/generate/2025-03-06
  - button "Open Next.js Dev Tools" [ref=e73] [cursor=pointer]:
    - img [ref=e74]
  - alert [ref=e77]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { cleanupDatabase, seedPayrollTestData } from '../utils/db'
  3   | 
  4   | // ─── Seed ─────────────────────────────────────────────────────────────────────
  5   | 
  6   | test.beforeAll(async () => {
  7   |   await cleanupDatabase()
  8   |   await seedPayrollTestData()
  9   | })
  10  | 
  11  | // ─── E2E-01: Payroll week list shows correct statuses ─────────────────────────
  12  | 
  13  | test.describe('E2E-01: Payroll week list', () => {
  14  |   test('shows READY week with Generate button and ERRORS week as disabled', async ({ page }) => {
  15  |     await page.goto('/payroll')
  16  |     await expect(page.locator('h1:has-text("Payroll Generation")')).toBeVisible()
  17  | 
  18  |     // Ready week (Mar 6-12)
  19  |     await expect(page.locator('text=6 Mar 2025 – 12 Mar 2025')).toBeVisible()
  20  |     await expect(page.locator('text=Ready')).toBeVisible()
  21  |     await expect(page.locator('a:has-text("Generate")')).toBeVisible()
  22  | 
  23  |     // Errors week (Mar 13-19)
  24  |     await expect(page.locator('text=13 Mar 2025 – 19 Mar 2025')).toBeVisible()
  25  |     await expect(page.locator('text=Errors')).toBeVisible()
  26  |     // Disabled generate (span, not a link)
> 27  |     await expect(page.locator('span:has-text("Generate")')).toBeVisible()
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  28  |     await expect(page.locator('a[href*="2025-03-13"]')).not.toBeVisible()
  29  |   })
  30  | })
  31  | 
  32  | // ─── E2E-02: Payroll blocked when attendance has errors ───────────────────────
  33  | 
  34  | test.describe('E2E-02: Blocked week', () => {
  35  |   test('shows blocker message when navigating to blocked week', async ({ page }) => {
  36  |     await page.goto('/payroll/generate/2025-03-13')
  37  |     await expect(page.locator('h2:has-text("Verify Attendance")')).toBeVisible()
  38  |     await expect(
  39  |       page.locator('text=Payroll cannot be generated — attendance has unresolved blocking errors'),
  40  |     ).toBeVisible()
  41  |     // Should show link to attendance review
  42  |     await expect(page.locator('a:has-text("Go to attendance review")')).toBeVisible()
  43  |     // Continue button should not be shown
  44  |     await expect(page.locator('button:has-text("Continue")')).not.toBeVisible()
  45  |   })
  46  | })
  47  | 
  48  | // ─── E2E-05: No upload for selected week ─────────────────────────────────────
  49  | 
  50  | test.describe('E2E-05: No attendance upload', () => {
  51  |   test('shows "no attendance" message for a week with no upload', async ({ page }) => {
  52  |     // Week with no upload at all
  53  |     await page.goto('/payroll/generate/2025-02-27')
  54  |     await expect(page.locator('h2:has-text("Verify Attendance")')).toBeVisible()
  55  |     await expect(page.locator('text=No attendance uploaded for this week')).toBeVisible()
  56  |     await expect(page.locator('a:has-text("Upload attendance for this week")')).toBeVisible()
  57  |   })
  58  | })
  59  | 
  60  | // ─── E2E-01: Generate payroll for a clean week (full flow) ────────────────────
  61  | 
  62  | test.describe('E2E-01: Full payroll generation flow', () => {
  63  |   test('generates and approves payroll for March 6-12', async ({ page }) => {
  64  |     await page.goto('/payroll/generate/2025-03-06')
  65  | 
  66  |     // Step 1: Attendance verified
  67  |     await expect(page.locator('h2:has-text("Verify Attendance")')).toBeVisible({ timeout: 8000 })
  68  |     await expect(
  69  |       page.locator('text=Attendance verified — 3 employees matched, 0 errors'),
  70  |     ).toBeVisible({ timeout: 8000 })
  71  | 
  72  |     // Quick stats should show employee count
  73  |     await expect(page.locator('text=3')).toBeVisible()
  74  | 
  75  |     // Advance to Step 2 (Adjustments)
  76  |     await page.click('button:has-text("Continue")')
  77  |     await expect(page.locator('h2:has-text("Review Adjustments")')).toBeVisible({ timeout: 5000 })
  78  | 
  79  |     // Should show 1 pending adjustment (deduction of ₹500)
  80  |     await expect(page.locator('text=Advance recovery')).toBeVisible()
  81  |     await expect(page.locator('text=Deduction')).toBeVisible()
  82  | 
  83  |     // Approve the adjustment
  84  |     await page.click('button[aria-label="Approve"]')
  85  | 
  86  |     // Continue button becomes active after all actioned
  87  |     await expect(
  88  |       page.locator('button:has-text("Continue to Payroll Summary")'),
  89  |     ).toBeEnabled({ timeout: 5000 })
  90  |     await page.click('button:has-text("Continue to Payroll Summary")')
  91  | 
  92  |     // Step 3: Payroll Summary
  93  |     await expect(page.locator('h2:has-text("Payroll Summary")')).toBeVisible({ timeout: 8000 })
  94  | 
  95  |     // Should show all 3 employees
  96  |     await expect(page.locator('text=Kavitha Rajan')).toBeVisible()
  97  |     await expect(page.locator('text=Ramesh Nair')).toBeVisible()
  98  |     await expect(page.locator('text=Sunita Pillai')).toBeVisible()
  99  | 
  100 |     // Net payable column header
  101 |     await expect(page.locator('th:has-text("Net Payable")')).toBeVisible()
  102 | 
  103 |     // Click "Approve Payroll"
  104 |     await page.click('button:has-text("Approve Payroll")')
  105 | 
  106 |     // Confirmation dialog
  107 |     await expect(
  108 |       page.locator('text=Approve this payroll run? This action cannot be reversed.'),
  109 |     ).toBeVisible({ timeout: 3000 })
  110 | 
  111 |     // Confirm
  112 |     await page.click('button:has-text("Confirm Approval")')
  113 | 
  114 |     // Step 4: Success
  115 |     await expect(page.locator('h2:has-text("Payroll Approved")')).toBeVisible({ timeout: 10000 })
  116 |     await expect(page.locator('text=3 employees')).toBeVisible()
  117 | 
  118 |     // Back to payroll list
  119 |     await page.click('a:has-text("Back to Payroll")')
  120 |     await expect(page).toHaveURL('/payroll', { timeout: 5000 })
  121 | 
  122 |     // The approved week should now show "Approved" badge
  123 |     await expect(page.locator('text=Approved').first()).toBeVisible({ timeout: 5000 })
  124 |   })
  125 | })
  126 | 
  127 | // ─── E2E-03: Calculation accuracy ────────────────────────────────────────────
```