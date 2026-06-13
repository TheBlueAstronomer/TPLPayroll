import { test, expect } from '@playwright/test'
import {
  cleanupDatabase,
  seedApprovedPayrollForCorrection,
  getRevisionCount,
  getCurrentRevision,
  getPayrollRunStatus,
} from '../utils/db'

// ─── Shared state ─────────────────────────────────────────────────────────────

let payrollRunId: string
let revisionId: string

// ─── Seed ───────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  await cleanupDatabase()
  const seed = await seedApprovedPayrollForCorrection()
  payrollRunId = seed.payrollRunId
  revisionId = seed.revisionId
})

// ─── Payroll Correction E2E Flow ──────────────────────────────────────────────

test.describe.serial('Payroll Correction Flow', () => {

  test('E2E-01: shows "Correct Payroll" button and "Approved (Revision 1)" badge on approved payroll', async ({ page }) => {
    await page.goto(`/payroll/run/${payrollRunId}`)

    // Header shows revision-aware badge
    await expect(page.locator('text=Approved (Revision 1)')).toBeVisible({ timeout: 8000 })

    // Correct Payroll button visible
    await expect(page.locator('button:has-text("Correct Payroll")')).toBeVisible()

    // Employee data is shown
    await expect(page.locator('text=Anita Sharma')).toBeVisible()
    await expect(page.locator('text=Rajesh Iyer')).toBeVisible()
  })

  test('E2E-02: creates revision 2 by skipping an adjustment', async ({ page }) => {
    // Navigate to the payroll details first to trigger initiation action
    await page.goto(`/payroll/run/${payrollRunId}`)
    await page.click('button:has-text("Correct Payroll")')

    // Wait for redirection and UI settlement
    await expect(page.locator('h1:has-text("Payroll Correction")')).toBeVisible({ timeout: 12000 })

    // Enter correction reason
    await page.fill('#correction-reason', 'Advance recovery was applied in error')

    // Select "Adjustments" correction type
    await page.locator('label:has-text("Adjustments")').click()

    // Adjustment section should appear with the deduction
    await expect(page.locator('text=Advance recovery seed')).toBeVisible({ timeout: 5000 })

    // The deduction should show as Pending now
    await expect(page.locator('text=Pending').first()).toBeVisible()

    // Skip the deduction instead of reversing
    await page.click('button:has-text("Skip")')

    // Should show skipped badge
    await expect(page.locator('text=Skipped')).toBeVisible({ timeout: 5000 })

    // Click Recalculate & Preview
    await page.click('button:has-text("Recalculate")')

    // Wait for the recalculation to complete — button should show "Recalculating..."
    const recalculating = page.locator('text=Recalculating...')
    if (await recalculating.isVisible()) {
      await expect(recalculating).not.toBeVisible({ timeout: 20000 })
    }

    await page.waitForTimeout(2000)

    // Verify in the DB that revision 2 was created
    const revCount = await getRevisionCount(payrollRunId)
    expect(revCount).toBe(2)

    const currentRev = await getCurrentRevision(payrollRunId)
    expect(currentRev?.revisionNumber).toBe(2)
    expect(currentRev?.isCurrent).toBe(true)
    expect(currentRev?.correctionReason).toBe('Advance recovery was applied in error')
  })

  test('E2E-03: shows both revisions in the history table after correction', async ({ page }) => {
    // Navigate directly — revision 2 should exist from E2E-02
    await page.goto(`/payroll/run/${payrollRunId}`, { waitUntil: 'networkidle' })

    // Should show badge with current revision
    await expect(page.locator('text=Revision History')).toBeVisible({ timeout: 8000 })

    // Both revisions visible (exact text to avoid strict mode violations)
    await expect(page.getByText('Current', { exact: true })).toBeVisible()
    await expect(page.getByText('Superseded', { exact: true })).toBeVisible()

    // The correction reason is shown
    await expect(page.locator('text=Advance recovery was applied in error')).toBeVisible()
  })

  test('E2E-04: allows correction with no reason provided', async ({ page }) => {
    // Must go via standard initiation path
    await page.goto(`/payroll/run/${payrollRunId}`)
    await page.click('button:has-text("Correct Payroll")')

    await expect(page.locator('h1:has-text("Payroll Correction")')).toBeVisible({ timeout: 12000 })

    // Don't fill reason — leave blank
    // Select employee data change
    await page.click('text=Employee data updated')

    // Click Recalculate
    await page.click('button:has-text("Recalculate")')

    // Wait for navigation
    await page.waitForTimeout(5000)

    // Should now have 3 revisions
    const revCount = await getRevisionCount(payrollRunId)
    expect(revCount).toBe(3)

    const currentRev = await getCurrentRevision(payrollRunId)
    expect(currentRev?.revisionNumber).toBe(3)
    expect(currentRev?.correctionReason).toBeNull()
  })

  test('E2E-05: payroll run status is REVISED after correction', async () => {
    const status = await getPayrollRunStatus(payrollRunId)
    expect(status).toBe('REVISED')
  })

})
