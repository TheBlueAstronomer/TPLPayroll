import { test, expect } from '@playwright/test';
import path from 'path';
import prisma, { cleanupDatabase, seedTestData } from '../utils/db'

test.describe('Attendance Upload Flow', () => {
  test.beforeAll(async () => {
    await cleanupDatabase()
    await seedTestData()
  })

  test('should upload a valid attendance file and show preview', async ({ page }) => {
    // Go to attendance page
    await page.goto('/attendance');

    // Wait for the page to load (check for "Recent Uploads")
    await expect(page.locator('text=Recent Uploads')).toBeVisible();

    // Upload the file
    const filePath = path.join(process.cwd(), 'e2e/fixtures/attendance-test.xlsx');
    await page.setInputFiles('input[type="file"]', filePath);

    // Verify file name is shown in dropzone
    await expect(page.locator('.bg-zinc-50:has-text("attendance-test.xlsx")')).toBeVisible();

    // Click Upload & Preview
    await page.click('button:has-text("Upload & Preview")');

    // Wait for the verification dialog
    const verifyDialog = page.locator('text=Manual Verification Required');
    await verifyDialog.waitFor({ state: 'visible', timeout: 20000 });

    // Reject all unmatched employees to proceed
    const unmatchedRowsVerification = page.locator('div.border:has(button:has-text("Reject"))');
    const count = await unmatchedRowsVerification.count();
    for (let i = 0; i < count; i++) {
      await unmatchedRowsVerification.nth(i).locator('button:has-text("Reject")').click();
      await page.waitForTimeout(50);
    }
    await page.click('button:has-text("Confirm Selections")');

    // Wait for navigation to preview page (it takes a few seconds for parsing)
    await expect(page).toHaveURL(/\/attendance\/.*\/preview/, { timeout: 15000 });

    // Check preview title
    await expect(page.locator('h1:has-text("Attendance Preview")')).toBeVisible();
    
    // Check week dates (detected from sheet content)
    await expect(page.locator('text=6 Mar 2025 – 12 Mar 2025')).toBeVisible();

    // Check employee matching status in the table
    const allRows = await page.locator('tbody tr').allTextContents();
    console.log('Table rows found:', allRows);

    // Matched Employee (EMP001) should be matched
    const matchedRow = page.locator('tr:has-text("Matched Employee")');
    await expect(matchedRow).toContainText('Matched', { timeout: 10000 });
    
    // Inactive Employee (EMP002) should show as inactive
    const inactiveRow = page.locator('tr:has-text("Inactive Employee")');
    await expect(inactiveRow).toContainText('Inactive', { timeout: 10000 });
    
    // Resigned Employee (EMP003) should show as resigned before week
    const resignedRow = page.locator('tr:has-text("Resigned Employee")');
    await expect(resignedRow).toContainText('Resigned');
    
    // Unknown Person was rejected in the manual verification step, but because rejected unmatched records are NOT saved in the database, the Preview page just re-parses the file and shows them as Unmatched.
    const unmatchedRow = page.locator('tr:has-text("Unknown Person")');
    await expect(unmatchedRow).toContainText('Unmatched');

    // Since the unmatched employee was rejected, they are no longer blocking payroll
    await expect(page.locator('text=Ready for Payroll')).toBeVisible();
  });

  test('should allow replacing an upload for the same week', async ({ page }) => {
    await page.goto('/attendance');

    // There should be one recent upload now from the previous test
    // Note: The main list uses year-less dates: "6 Mar – 12 Mar"
    await expect(page.locator('tr:has-text("6 Mar – 12 Mar")')).toBeVisible();

    // Click Replace
    const replaceButton = page.locator('tr:has-text("6 Mar – 12 Mar") button:has-text("Replace")');
    await replaceButton.click();

    // The dropzone should be triggered. Upload the same file again.
    const filePath = path.join(process.cwd(), 'e2e/fixtures/attendance-test.xlsx');
    await page.setInputFiles('input[type="file"]', filePath);

    // Upload & Preview
    await page.click('button:has-text("Upload & Preview")');

    // Wait for the verification dialog
    const verifyDialog = page.locator('text=Manual Verification Required');
    await verifyDialog.waitFor({ state: 'visible', timeout: 20000 });

    // Reject all unmatched employees to proceed
    const unmatchedRowsVerification = page.locator('div.border:has(button:has-text("Reject"))');
    const count = await unmatchedRowsVerification.count();
    for (let i = 0; i < count; i++) {
      await unmatchedRowsVerification.nth(i).locator('button:has-text("Reject")').click();
      await page.waitForTimeout(50);
    }
    await page.click('button:has-text("Confirm Selections")');

    // Wait for navigation
    await expect(page).toHaveURL(/\/attendance\/.*\/preview/, { timeout: 15000 });
  });
});
