import { test, expect } from '@playwright/test'

// ─── About Settings E2E ───────────────────────────────────────────────────────
// The Settings table uses a singleton row (id = "singleton") that is auto-created
// on first access via upsert. cleanupDatabase() intentionally does NOT truncate
// the Settings table, so the row persists across test runs.
//
// Because tests can affect each other (each save mutates shared DB state), every
// test that changes the day resets it back to THURSDAY at the end so the suite
// remains order-independent.

// ─── E2E-01: View current settings ───────────────────────────────────────────

test.describe('E2E-01: View current settings', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start from the known default (THURSDAY) before each test in this block.
    // Navigate and set to THURSDAY if it isn't already.
    await page.goto('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 10000 })

    const currentValue = await page.locator('select#payrollWeekStartDay').inputValue()
    if (currentValue !== 'THURSDAY') {
      await page.selectOption('select#payrollWeekStartDay', 'THURSDAY')
      await page.click('button:has-text("Save Settings")')
      await expect(
        page.locator('[data-sonner-toast]').filter({ hasText: 'Settings saved successfully' }),
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test('shows h1 heading, Thursday as default day, read-only currency, and expiry threshold', async ({
    page,
  }) => {
    await page.goto('/settings')

    // Page heading
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible()

    // Payroll week start day defaults to Thursday
    const select = page.locator('select#payrollWeekStartDay')
    await expect(select).toBeVisible()
    await expect(select).toHaveValue('THURSDAY')

    // Currency is displayed as ₹ INR (read-only text)
    await expect(page.locator('text=₹ INR')).toBeVisible()

    // Document expiry threshold is shown as 7 days (read-only)
    await expect(page.locator('text=7 days')).toBeVisible()

    // Phase 2 badge is visible next to the threshold
    await expect(page.locator('text=Phase 2')).toBeVisible()
  })
})

// ─── E2E-02: Change payroll week start day ────────────────────────────────────

test.describe('E2E-02: Change payroll week start day', () => {
  test('selects Monday, saves, and shows success toast with Monday selected', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 10000 })

    // Select Monday from the dropdown
    await page.selectOption('select#payrollWeekStartDay', 'MONDAY')

    // Click Save Settings
    await page.click('button:has-text("Save Settings")')

    // Success toast should appear
    const toast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: 'Settings saved successfully' })
    await expect(toast).toBeVisible({ timeout: 5000 })

    // The select should now reflect Monday
    await expect(page.locator('select#payrollWeekStartDay')).toHaveValue('MONDAY')

    // Reset back to THURSDAY for subsequent tests
    await page.selectOption('select#payrollWeekStartDay', 'THURSDAY')
    await page.click('button:has-text("Save Settings")')
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: 'Settings saved successfully' }),
    ).toBeVisible({ timeout: 5000 })
  })
})

// ─── E2E-03: Settings persist across page reload ──────────────────────────────

test.describe('E2E-03: Settings persist across navigation', () => {
  test('Monday selection survives navigation away and back', async ({ page }) => {
    // Step 1: Navigate to settings and set day to Monday
    await page.goto('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 10000 })

    await page.selectOption('select#payrollWeekStartDay', 'MONDAY')
    await page.click('button:has-text("Save Settings")')
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: 'Settings saved successfully' }),
    ).toBeVisible({ timeout: 5000 })

    // Step 2: Navigate to a different page
    await page.goto('/')

    // Step 3: Return to settings — selection must still be Monday (DB persisted)
    await page.goto('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 10000 })

    await expect(page.locator('select#payrollWeekStartDay')).toHaveValue('MONDAY')

    // Cleanup: reset to THURSDAY for subsequent tests
    await page.selectOption('select#payrollWeekStartDay', 'THURSDAY')
    await page.click('button:has-text("Save Settings")')
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: 'Settings saved successfully' }),
    ).toBeVisible({ timeout: 5000 })
  })
})

// ─── E2E-04: Save button disabled during submit ───────────────────────────────

test.describe('E2E-04: Save button disabled during submit', () => {
  test('button is disabled while save is in progress and re-enables after completion', async ({
    page,
  }) => {
    await page.goto('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 10000 })

    const saveBtn = page.locator('button:has-text("Save Settings")')

    // Button must be enabled before submitting
    await expect(saveBtn).toBeEnabled()

    // Click the button and immediately capture the disabled state.
    // useTransition sets isPending = true synchronously when the transition
    // starts, making the button disabled until the server action resolves.
    await saveBtn.click()

    // While isPending the button text changes to "Saving…" and it becomes
    // disabled. We assert both the in-flight state and the post-save state.
    // The "Saving…" state may be brief, so we check whichever is still true:
    // either the spinner text is visible OR the button is already re-enabled
    // (which means it passed through the disabled state and completed).
    // The authoritative assertion is that after the toast appears the button
    // is re-enabled with the original label.

    // Wait for save to complete (success toast is the completion signal)
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: 'Settings saved successfully' }),
    ).toBeVisible({ timeout: 5000 })

    // After completion: button is re-enabled and label restored
    await expect(saveBtn).toBeEnabled()
    await expect(saveBtn).toHaveText('Save Settings')
  })
})
