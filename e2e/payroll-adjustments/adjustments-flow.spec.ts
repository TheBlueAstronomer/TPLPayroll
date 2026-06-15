import { test, expect, type Page } from '@playwright/test'
import { cleanupDatabase, seedAdjustmentTestData } from '../utils/db'

// ─── Seed data for adjustment tests ──────────────────────────────────────────

test.beforeAll(async () => {
  await cleanupDatabase()
  await seedAdjustmentTestData()
})

// ─── E2E-01: Create a one-time deduction ─────────────────────────────────────

test.describe('E2E-01: Create one-time deduction', () => {
  test('creates a one-time deduction and shows it in the list', async ({ page }) => {
    await page.goto('/adjustments')
    await expect(page.locator('h1:has-text("Payroll Adjustments")')).toBeVisible()

    // Click "New Adjustment"
    await page.click('button:has-text("New Adjustment")')
    await expect(page).toHaveURL('/adjustments/new')
    await expect(page.locator('h1:has-text("New Payroll Adjustment")')).toBeVisible()

    // Select employee (EMP-ADJ-001 — Adjustment Test Employee)
    await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
    await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
    await page.click('text=Adjustment Test Employee')

    // Set type to Deduction (default)
    await page.check('input[value="DEDUCTION"]')

    // Fill amount
    await page.fill('input#amount', '500')

    // Fill reason
    await page.fill('textarea#reason', 'Advance recovery')

    // Keep recurrence as One-time (default)
    await page.check('input[value="ONE_TIME"]')

    // Select a payroll week
    const weekSelect = page.locator('select#weekValue')
    await weekSelect.selectOption({ index: 1 })

    // Submit
    await page.click('button:has-text("Save Adjustment")')

    // Should redirect back to list with success
    await expect(page).toHaveURL('/adjustments', { timeout: 5000 })

    // The new adjustment should appear in the list
    await expect(page.locator('text=Adjustment Test Employee').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Advance recovery')).not.toBeVisible() // reason not shown in list
    await expect(
      page.locator('td:has-text("One-time")').first(),
    ).toBeVisible()
  })
})

// ─── E2E-02: Create a recurring addition with fixed weeks ─────────────────────

test.describe('E2E-02: Create recurring addition with fixed weeks', () => {
  test('creates a recurring addition for 4 weeks', async ({ page }) => {
    await page.goto('/adjustments/new')

    // Select employee
    await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
    await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
    await page.click('text=Adjustment Test Employee')

    // Type = Addition
    await page.check('input[value="ADDITION"]')

    // Amount
    await page.fill('input#amount', '1000')

    // Reason
    await page.fill('textarea#reason', 'Transport allowance')

    // Recurrence = Recurring
    await page.check('input[value="RECURRING"]')

    // Select start week
    const weekSelect = page.locator('select#weekValue')
    await weekSelect.selectOption({ index: 1 })

    // End condition = Fixed weeks
    await page.selectOption('select#recurrenceEndType', 'FIXED_WEEKS')

    // Total weeks = 4
    await page.fill('input#totalRecurrenceWeeks', '4')

    // Submit
    await page.click('button:has-text("Save Adjustment")')

    // Should redirect back to list
    await expect(page).toHaveURL('/adjustments', { timeout: 5000 })

    // The recurring addition should appear
    await expect(page.locator('td:has-text("Recurring")').first()).toBeVisible({ timeout: 5000 })
  })
})

// ─── E2E-03: Create a recurring deduction with total balance ─────────────────

test.describe('E2E-03: Create recurring deduction with total balance', () => {
  test('creates a loan recovery adjustment with total balance of ₹8000', async ({ page }) => {
    await page.goto('/adjustments/new')

    // Select employee
    await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
    await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
    await page.click('text=Adjustment Test Employee')

    // Type = Deduction
    await page.check('input[value="DEDUCTION"]')

    // Amount per week
    await page.fill('input#amount', '2000')

    // Reason
    await page.fill('textarea#reason', 'Loan recovery')

    // Recurrence = Recurring
    await page.check('input[value="RECURRING"]')

    // Start week
    const weekSelect = page.locator('select#weekValue')
    await weekSelect.selectOption({ index: 1 })

    // End condition = Total balance
    await page.selectOption('select#recurrenceEndType', 'TOTAL_BALANCE')

    // Total balance
    await page.fill('input#totalBalance', '8000')

    // Submit
    await page.click('button:has-text("Save Adjustment")')

    // Should redirect back
    await expect(page).toHaveURL('/adjustments', { timeout: 5000 })
  })
})

// ─── E2E-07: View all adjustments for an employee ────────────────────────────

test.describe('E2E-07: View all adjustments', () => {
  test('navigating to an adjustment row opens the detail page', async ({ page }) => {
    await page.goto('/adjustments')
    await expect(page.locator('h1:has-text("Payroll Adjustments")')).toBeVisible()

    // Wait for table to load — seed creates 3 adjustments, E2E-01 and E2E-02 each create 1 more,
    // and E2E-03 creates another. By this point there should be 6 total.
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    const rowCount = await page.locator('tbody tr').count()
    expect(rowCount).toBeGreaterThanOrEqual(3)

    // Click first row
    await page.click('tbody tr:first-child')

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/adjustments\/[a-z0-9-]+/, { timeout: 5000 })
    await expect(page.locator('h1:has-text("Adjustment Detail")')).toBeVisible()
    await expect(page.locator('text=Application History')).toBeVisible()
  })

  test('filter by type shows only deductions', async ({ page }) => {
    await page.goto('/adjustments')
    await expect(page.locator('h1:has-text("Payroll Adjustments")')).toBeVisible()

    // Filter by Deduction
    await page.selectOption('select', { label: 'Deduction' })

    // Wait for table refresh
    await page.waitForTimeout(400)

    // All visible type badges should be Deduction
    const badges = page.locator('td span:has-text("Deduction")')
    await expect(badges.first()).toBeVisible({ timeout: 5000 })

    // No Addition badge should be visible
    const additionBadges = page.locator('td span:has-text("Addition")')
    await expect(additionBadges).toHaveCount(0)
  })
})

// ─── E2E-form-validation: Validate form errors ────────────────────────────────

test.describe('Form validation', () => {
  test('shows validation error when reason is missing', async ({ page }) => {
    await page.goto('/adjustments/new')

    // Select employee
    await page.fill('input[placeholder="Search employee…"]', 'Adjustment Test')
    await expect(page.locator('text=Adjustment Test Employee')).toBeVisible({ timeout: 5000 })
    await page.click('text=Adjustment Test Employee')

    // Fill amount but leave reason empty
    await page.fill('input#amount', '500')

    // Select week
    const weekSelect = page.locator('select#weekValue')
    await weekSelect.selectOption({ index: 1 })

    // Submit without filling reason
    await page.click('button:has-text("Save Adjustment")')

    // Should show validation error
    await expect(page.locator('text=Reason is required')).toBeVisible({ timeout: 3000 })

    // Should NOT navigate away
    await expect(page).toHaveURL('/adjustments/new')
  })
})
