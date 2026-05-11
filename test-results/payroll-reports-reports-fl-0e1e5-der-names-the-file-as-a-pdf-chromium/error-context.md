# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payroll-reports\reports-flow.spec.ts >> E2E-01: PDF payroll summary API >> Content-Disposition header names the file as a .pdf
- Location: e2e\payroll-reports\reports-flow.spec.ts:36:7

# Error details

```
TypeError: expect(received).toMatch(expected)

Matcher error: received value must be a string

Received has value: undefined
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import {
  3   |   cleanupDatabase,
  4   |   seedApprovedPayrollData,
  5   | } from '../utils/db'
  6   | 
  7   | let payrollRunId: string
  8   | 
  9   | test.beforeAll(async () => {
  10  |   try {
  11  |     await cleanupDatabase()
  12  |     const seed = await seedApprovedPayrollData()
  13  |     payrollRunId = seed.payrollRunId
  14  |     console.log('Using payrollRunId:', payrollRunId);
  15  |   } catch (err: any) {
  16  |     const fs = require('fs');
  17  |     fs.writeFileSync('e2e-error.log', `MESSAGE: ${err.message}\n\nSTACK: ${err.stack}`);
  18  |     throw err;
  19  |   }
  20  | })
  21  | 
  22  | // ─── E2E-01: Generate PDF payroll summary ─────────────────────────────────────
  23  | 
  24  | test.describe('E2E-01: PDF payroll summary API', () => {
  25  |   test('GET /api/payroll/reports/:id/summary returns a valid PDF', async ({ request }) => {
  26  |     const response = await request.get(`/api/payroll/reports/${payrollRunId}/summary`)
  27  | 
  28  |     expect(response.status()).toBe(200)
  29  |     expect(response.headers()['content-type']).toContain('application/pdf')
  30  | 
  31  |     const body = await response.body()
  32  |     // Every valid PDF starts with the %PDF header
  33  |     expect(body.toString('ascii', 0, 4)).toBe('%PDF')
  34  |   })
  35  | 
  36  |   test('Content-Disposition header names the file as a .pdf', async ({ request }) => {
  37  |     const response = await request.get(`/api/payroll/reports/${payrollRunId}/summary`)
  38  |     const disposition = response.headers()['content-disposition']
> 39  |     expect(disposition).toMatch(/filename="payroll_summary_.*\.pdf"/)
      |                         ^ TypeError: expect(received).toMatch(expected)
  40  |   })
  41  | 
  42  |   test('returns 404 for a non-existent payrollRunId', async ({ request }) => {
  43  |     const response = await request.get('/api/payroll/reports/non-existent-run-id/summary')
  44  |     expect(response.status()).toBe(404)
  45  |     const body = await response.json()
  46  |     expect(body.code).toBe('PAYROLL_RUN_NOT_FOUND')
  47  |   })
  48  | })
  49  | 
  50  | // ─── E2E-02: Generate payroll slips ZIP ───────────────────────────────────────
  51  | 
  52  | test.describe('E2E-02: Payroll slips ZIP API', () => {
  53  |   test('GET /api/payroll/reports/:id/slips returns a valid ZIP', async ({ request }) => {
  54  |     const response = await request.get(`/api/payroll/reports/${payrollRunId}/slips`)
  55  | 
  56  |     expect(response.status()).toBe(200)
  57  |     expect(response.headers()['content-type']).toContain('application/zip')
  58  | 
  59  |     const body = await response.body()
  60  |     // ZIP magic bytes: PK (0x50 0x4B 0x03 0x04)
  61  |     expect(body[0]).toBe(0x50) // 'P'
  62  |     expect(body[1]).toBe(0x4B) // 'K'
  63  |   })
  64  | 
  65  |   test('returns 404 for a non-existent payrollRunId', async ({ request }) => {
  66  |     const response = await request.get('/api/payroll/reports/non-existent-run-id/slips')
  67  |     expect(response.status()).toBe(404)
  68  |   })
  69  | })
  70  | 
  71  | // ─── E2E-04: ZIP file naming follows pattern ──────────────────────────────────
  72  | 
  73  | test.describe('E2E-04: ZIP filename pattern', () => {
  74  |   test('Content-Disposition matches payroll_slips_<startDate>_<endDate>.zip', async ({ request }) => {
  75  |     const response = await request.get(`/api/payroll/reports/${payrollRunId}/slips`)
  76  |     const disposition = response.headers()['content-disposition']
  77  | 
  78  |     // e.g. filename="payroll_slips_03Apr_09Apr.zip"
  79  |     expect(disposition).toMatch(/filename="payroll_slips_\d{2}[A-Za-z]{3}_\d{2}[A-Za-z]{3}\.zip"/)
  80  |   })
  81  | 
  82  |   test('filename matches the seeded week (Apr 3–9 2025)', async ({ request }) => {
  83  |     const response = await request.get(`/api/payroll/reports/${payrollRunId}/slips`)
  84  |     const disposition = response.headers()['content-disposition']
  85  |     expect(disposition).toContain('payroll_slips_03Apr_09Apr.zip')
  86  |   })
  87  | })
  88  | 
  89  | // ─── E2E-05: InvoiceSnapshot data is stored ───────────────────────────────────
  90  | 
  91  | test.describe('E2E-05: InvoiceSnapshot records', () => {
  92  |   test('calling the slips endpoint creates one InvoiceSnapshot per employee', async ({ request }) => {
  93  |     // Trigger ZIP generation (creates snapshots as a side-effect)
  94  |     const response = await request.get(`/api/payroll/reports/${payrollRunId}/slips`)
  95  |     expect(response.status()).toBe(200)
  96  | 
  97  |     // 2 employees seeded → 2 snapshots
  98  |     const count = await getInvoiceSnapshotCount(payrollRunId)
  99  |     expect(count).toBe(2)
  100 |   })
  101 | 
  102 |   test('snapshots are idempotent — re-generating does not duplicate records', async ({ request }) => {
  103 |     await request.get(`/api/payroll/reports/${payrollRunId}/slips`)
  104 |     await request.get(`/api/payroll/reports/${payrollRunId}/slips`)
  105 | 
  106 |     const count = await getInvoiceSnapshotCount(payrollRunId)
  107 |     expect(count).toBe(2)
  108 |   })
  109 | })
  110 | 
  111 | // ─── E2E-06: Temporary files are cleaned up ───────────────────────────────────
  112 | 
  113 | test.describe('E2E-06: Cleanup endpoint', () => {
  114 |   test('POST /cleanup sets temporaryFileDeletedAt on all snapshots', async ({ request }) => {
  115 |     // Ensure snapshots exist first
  116 |     await request.get(`/api/payroll/reports/${payrollRunId}/slips`)
  117 | 
  118 |     const cleanupResponse = await request.post(
  119 |       `/api/payroll/reports/${payrollRunId}/cleanup`,
  120 |     )
  121 |     expect(cleanupResponse.status()).toBe(200)
  122 |     const body = await cleanupResponse.json()
  123 |     expect(body.ok).toBe(true)
  124 | 
  125 |     // All snapshots should now have a cleanup timestamp
  126 |     const cleaned = await getCleanedSnapshotCount(payrollRunId)
  127 |     expect(cleaned).toBe(2)
  128 |   })
  129 | })
  130 | 
  131 | // ─── UI: Payroll run detail page shows ReportSection ─────────────────────────
  132 | 
  133 | test.describe('UI: Payroll run detail page', () => {
  134 |   test('navigating to /payroll/run/:id shows the Reports section', async ({ page }) => {
  135 |     await page.goto(`/payroll/run/${payrollRunId}`)
  136 | 
  137 |     await expect(page.locator('text=Approved')).toBeVisible({ timeout: 8000 })
  138 |     await expect(page.locator('text=Reports')).toBeVisible()
  139 |     await expect(page.getByRole('button', { name: /Download PDF Summary/i })).toBeVisible()
```