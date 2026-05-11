node e2e/utils/setup-db.js
npx tsx e2e/test-db-util.ts
if ($?) {
  npx playwright test e2e/payroll-reports/reports-flow.spec.ts --workers=1
}
