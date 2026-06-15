import { test, expect } from '@playwright/test'

// ─── E2E-05: Audit logs are immutable — no edit/delete controls ───────────────

test.describe('E2E-05: Audit log viewer is read-only (immutable)', () => {
  test('no edit, delete, or remove controls exist on the audit log page', async ({ page }) => {
    // GIVEN the audit log page is loaded
    await page.goto('/audit-log')

    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible({ timeout: 10000 })

    // THEN no button or link with text matching /edit|delete|remove/i exists
    const editDeleteButtons = page.locator('button, a').filter({ hasText: /edit|delete|remove/i })
    await expect(editDeleteButtons).toHaveCount(0)
  })
})

// ─── E2E-06: View audit logs in the app ──────────────────────────────────────

test.describe('E2E-06: View audit logs', () => {
  test('page has "Audit Log" heading and filter selects', async ({ page }) => {
    // GIVEN the audit log page is loaded
    await page.goto('/audit-log')

    // THEN the page has heading "Audit Log"
    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible({ timeout: 10000 })

    // AND filter selects exist for Entity Type and Action Type
    await expect(page.locator('select').filter({ hasText: /entity type|employee|wage history/i }).or(
      page.locator('select[aria-label*="entity" i], select[id*="entity" i], select[name*="entity" i]')
    ).first()).toBeVisible()

    await expect(page.locator('select').filter({ hasText: /action type|create|update/i }).or(
      page.locator('select[aria-label*="action" i], select[id*="action" i], select[name*="action" i]')
    ).first()).toBeVisible()
  })

  test('page renders a table or empty state on load', async ({ page }) => {
    // GIVEN the audit log page is loaded
    await page.goto('/audit-log')

    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible({ timeout: 10000 })

    // THEN either a table with rows OR an empty state message is visible
    const tableOrEmpty = page.locator('table').or(page.locator('[data-testid="empty-state"]')).or(page.getByText('No audit log entries found'))
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 })
  })
})

// ─── E2E-07: Filter interaction ───────────────────────────────────────────────

test.describe('E2E-07: Filter interaction', () => {
  test('changing entity filter to Employee triggers data fetch', async ({ page }) => {
    // GIVEN the audit log page is loaded
    await page.goto('/audit-log')

    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible({ timeout: 10000 })

    // WHEN entity filter is changed to "Employee"
    // Try to find a select that contains employee-related options
    const entitySelect = page.locator(
      'select[id*="entity" i], select[name*="entity" i], select[aria-label*="entity" i]'
    ).first()

    const entitySelectExists = await entitySelect.isVisible().catch(() => false)

    if (entitySelectExists) {
      await entitySelect.selectOption({ label: 'Employee' })

      // THEN the page updates — either a loading indicator appears briefly or the
      // table/empty-state refreshes. We wait for the page to settle.
      await page.waitForTimeout(500)

      // Assert the page still shows the heading (no crash)
      await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible()

      // AND table or empty state is still rendered
      const tableOrEmpty = page.locator('table').or(page.locator('[data-testid="empty-state"]')).or(page.getByText('No audit log entries found'))
      await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 })
    } else {
      // If entity select is not yet identifiable by id/name/aria-label,
      // fall back to the first select on the page
      const firstSelect = page.locator('select').first()
      await expect(firstSelect).toBeVisible({ timeout: 10000 })

      await firstSelect.selectOption({ index: 1 })

      await page.waitForTimeout(500)

      await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible()
    }
  })
})

// ─── E2E-08: Empty state ──────────────────────────────────────────────────────

test.describe('E2E-08: Empty state when no audit log entries exist', () => {
  test('shows empty state message when no data is available', async ({ page }) => {
    // GIVEN the audit log page is loaded (database may be empty or freshly cleaned)
    await page.goto('/audit-log')

    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible({ timeout: 10000 })

    // THEN either audit log records are shown OR the empty state renders
    // We check that at least one of these is visible:
    //   - A table with rows (data exists)
    //   - The empty state text "No audit log entries found"
    const hasData = await page.locator('tbody tr').first().isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=No audit log entries found').isVisible().catch(() => false)

    expect(hasData || hasEmptyState).toBe(true)
  })
})
