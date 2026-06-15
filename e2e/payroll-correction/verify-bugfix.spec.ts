import { test, expect } from '@playwright/test'
import prisma, { cleanupDatabase } from '../utils/db'
import path from 'path'

test.describe('E2E: Attendance Re-upload in Payroll Correction Verification', () => {

  test('should import employee master, upload attendance, generate payroll, and re-upload in correction without hangs', async ({ page }) => {
    test.setTimeout(120000)
    // 1. Reset database
    console.log('Cleaning up database...')
    await cleanupDatabase()

    // 2. Import Employee Master List
    console.log('Navigating to Employees page...')
    await page.goto('/employees')
    await expect(page.locator('h1:has-text("Team Directory")')).toBeVisible({ timeout: 10000 })

    console.log('Opening Employee Import dialog...')
    await page.click('button:has-text("Import")')
    await page.click('button:has-text("Import from Excel")')
    await expect(page.locator('text=Import Employee Master')).toBeVisible()

    const masterListPath = path.join(process.cwd(), 'test_data/Employee Master List.xlsx')
    console.log('Uploading Employee Master List:', masterListPath)
    await page.setInputFiles('input[type="file"]', masterListPath)
    await page.click('button:has-text("Upload")')

    console.log('Confirming Employee Import in preview page...')
    await expect(page.locator('h1:has-text("Import Preview")')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Confirm Import")')
    await expect(page.locator('h2:has-text("Import Complete")')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("View Employees")')

    // Wait for employee list to settle
    await expect(page.locator('h1:has-text("Team Directory")')).toBeVisible({ timeout: 10000 })
    console.log('Employees successfully imported!')

    // Backdate employee wage history effectiveFrom to allow payroll generation
    console.log('Backdating wage history effectiveFrom dates...')
    await prisma.employeeWageHistory.updateMany({
      data: {
        effectiveFrom: new Date('2020-01-01T00:00:00Z')
      }
    })

    // 3. Upload Attendance
    console.log('Navigating to Attendance page...')
    await page.goto('/attendance')
    await expect(page.locator('text=Recent Uploads')).toBeVisible({ timeout: 10000 })

    const attendancePath = path.join(process.cwd(), 'test_data/26Mar_01Apr - AttendReport.xls')
    console.log('Uploading attendance report:', attendancePath)
    await page.setInputFiles('input[type="file"]', attendancePath)
    await page.click('button:has-text("Upload & Preview")')

    // Wait for the verification dialog and resolve it by rejecting all unmatched employees
    const verifyDialog = page.locator('text=Manual Verification Required')
    console.log('Waiting for manual verification dialog...')
    await verifyDialog.waitFor({ state: 'visible', timeout: 20000 })
    console.log('Employee verification dialog detected, rejecting all unmatched employees...')
    const unmatchedRows = page.locator('div.border:has(button:has-text("Reject"))')
    const count = await unmatchedRows.count()
    console.log(`Found ${count} unmatched rows. Matching the first one to EMP001...`)
    
    // Match the first one (index 0) to John Doe Update (EMP001)
    await unmatchedRows.nth(0).locator('input').click()
    await page.locator('button:has-text("John Doe Update")').first().click()
    await page.waitForTimeout(100)
    
    // Reject all the rest (indexes 1 to count - 1)
    console.log(`Rejecting the remaining ${count - 1} rows...`)
    for (let i = 1; i < count; i++) {
      await unmatchedRows.nth(i).locator('button:has-text("Reject")').click()
      await page.waitForTimeout(50)
    }
    console.log('Clicking Confirm Selections...')
    await page.click('button:has-text("Confirm Selections")')

    console.log('Waiting for preview page...')
    await expect(page).toHaveURL(/\/attendance\/.*\/preview/, { timeout: 20000 })
    await expect(page.locator('h1:has-text("Attendance Preview")')).toBeVisible()
    console.log('Attendance preview visible!')

    // Retrieve detected week range
    const weekLabel = await page.locator('p.text-zinc-500').first().innerText()
    console.log('Detected week range label:', weekLabel)

    // Extract start date from weekLabel, or navigate to payroll generate page directly
    // Since 26Mar to 01Apr translates to payrollWeekStartDate: 2025-03-26 or similar
    // Let's go to /payroll list first to find the exact week start date link
    console.log('Navigating to Payroll page...')
    await page.goto('/payroll')
    await expect(page.locator('h1:has-text("Payroll Generation")')).toBeVisible({ timeout: 10000 })

    // Find the generate link corresponding to the week range
    const generateLink = page.locator('a:has-text("Generate")').first()
    await expect(generateLink).toBeVisible()
    const generateUrl = await generateLink.getAttribute('href')
    console.log('Navigating to payroll generation URL:', generateUrl)
    await page.goto(generateUrl!)

    // 4. Generate Payroll Wizard
    console.log('Step 1: Verify Attendance')
    await expect(page.locator('h2:has-text("Verify Attendance")')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Continue")')

    console.log('Step 2: Review Adjustments')
    await expect(page.locator('h2:has-text("Review Adjustments")')).toBeVisible({ timeout: 10000 })
    // If there are pending adjustments, approve them
    const approveBtn = page.locator('button[aria-label="Approve"]').first()
    if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Approving adjustment applications...')
      await approveBtn.click()
    }
    const continueBtn = page.locator('button:has-text("Continue to Summary")')
    await expect(continueBtn).toBeEnabled({ timeout: 10000 })
    await continueBtn.click()

    console.log('Step 3: Payroll Summary')
    await expect(page.locator('h2:has-text("Payroll Summary")')).toBeVisible({ timeout: 15000 })
    await page.click('button:has-text("Approve Payroll")')
    await page.click('button:has-text("Confirm Approval")')

    console.log('Step 4: Success, going back to payroll run page')
    await expect(page.locator('h2:has-text("Payroll Approved")')).toBeVisible({ timeout: 15000 })
    await page.click('a:has-text("Back to Payroll")')
    await expect(page).toHaveURL('/payroll', { timeout: 10000 })

    // Find the approved week in the table and go to its details
    const viewDetailsLink = page.locator('a:has-text("View")').first()
    await expect(viewDetailsLink).toBeVisible()
    const runUrl = await viewDetailsLink.getAttribute('href')
    console.log('Navigating to payroll run details URL:', runUrl)
    await page.goto(runUrl!)
    await expect(page.locator('text=Reports')).toBeVisible({ timeout: 10000 })

    // 5. Initiate Payroll Correction
    console.log('Initiating payroll correction...')
    await page.click('button:has-text("Correct Payroll")')
    await expect(page.locator('h1:has-text("Payroll Correction")')).toBeVisible({ timeout: 15000 })

    // 6. Re-upload Attendance in Correction
    console.log('Selecting Attendance correction type...')
    await page.click('text=Upload a corrected attendance file')

    console.log('Re-uploading the same attendance file in correction dropzone...')
    await page.setInputFiles('#attendance-dropzone-trigger', attendancePath)

    // Wait for the re-uploaded file to be staged in dropzone
    await expect(page.locator('.font-mono:has-text("26Mar_01Apr - AttendReport.xls")')).toBeVisible({ timeout: 5000 })

    console.log('Clicking Upload & Preview in correction dropzone...')
    await page.click('button:has-text("Upload & Preview")')

    // ASSERTION: Verify that the parsing spinner finishes and is NOT stuck on parsing attendance file indefinitely!
    console.log('Checking that it does not hang on parsing...')
    const parsingIndicator = page.locator('text=Parsing attendance file')
    await expect(parsingIndicator).not.toBeVisible({ timeout: 15000 })

    // It should either open the verification dialog or complete successfully setting the file ID
    console.log('Parsing resolved successfully! Checking for verification dialog or success state...')
    
    // Wait for the verification dialog and resolve it by rejecting all unmatched employees
    console.log('Waiting for manual verification dialog after re-upload...')
    await verifyDialog.waitFor({ state: 'visible', timeout: 20000 })
    console.log('Employee verification dialog visible after re-upload, rejecting all unmatched employees...')
    const unmatchedRowsCorr = page.locator('div.border:has(button:has-text("Reject"))')
    const countCorr = await unmatchedRowsCorr.count()
    console.log(`Found ${countCorr} unmatched rows after re-upload. Matching the first one to EMP001...`)
    
    // Match the first one (index 0) to John Doe Update (EMP001)
    await unmatchedRowsCorr.nth(0).locator('input').click()
    await page.locator('button:has-text("John Doe Update")').first().click()
    await page.waitForTimeout(100)
    
    // Reject all the rest (indexes 1 to count - 1)
    console.log(`Rejecting the remaining ${countCorr - 1} rows...`)
    for (let i = 1; i < countCorr; i++) {
      await unmatchedRowsCorr.nth(i).locator('button:has-text("Reject")').click()
      await page.waitForTimeout(50)
    }
    console.log('Clicking Confirm Selections...')
    await page.click('button:has-text("Confirm Selections")')

    console.log('Bugfix successfully verified! Attendance re-upload works without hanging.')
  })
})
