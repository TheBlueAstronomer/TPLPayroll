# cleanupDatabase Node

> 25 nodes

## Key Concepts

- **db.ts** (23 connections) — `e2e/utils/db.ts`
- **cleanupDatabase()** (10 connections) — `e2e/utils/db.ts`
- **correction-flow.spec.ts** (6 connections) — `e2e/payroll-correction/correction-flow.spec.ts`
- **reports-flow.spec.ts** (5 connections) — `e2e/payroll-reports/reports-flow.spec.ts`
- **seedApprovedPayrollData()** (5 connections) — `e2e/utils/db.ts`
- **test-db-util.ts** (4 connections) — `e2e/test-db-util.ts`
- **employee-management.spec.ts** (3 connections) — `e2e/employee-management/employee-management.spec.ts`
- **adjustments-flow.spec.ts** (3 connections) — `e2e/payroll-adjustments/adjustments-flow.spec.ts`
- **payroll-flow.spec.ts** (3 connections) — `e2e/payroll-generation/payroll-flow.spec.ts`
- **payroll-history.spec.ts** (3 connections) — `e2e/payroll-history/payroll-history.spec.ts`
- **main()** (3 connections) — `e2e/test-db-util.ts`
- **verify-bugfix.spec.ts** (2 connections) — `e2e/payroll-correction/verify-bugfix.spec.ts`
- **seedAdjustmentTestData()** (2 connections) — `e2e/utils/db.ts`
- **seedPayrollTestData()** (2 connections) — `e2e/utils/db.ts`
- **getInvoiceSnapshotCount()** (2 connections) — `e2e/utils/db.ts`
- **getCleanedSnapshotCount()** (2 connections) — `e2e/utils/db.ts`
- **seedApprovedPayrollForCorrection()** (2 connections) — `e2e/utils/db.ts`
- **getRevisionCount()** (2 connections) — `e2e/utils/db.ts`
- **getCurrentRevision()** (2 connections) — `e2e/utils/db.ts`
- **getPayrollRunStatus()** (2 connections) — `e2e/utils/db.ts`
- **test-simple-prisma.spec.ts** (1 connections) — `e2e/test-simple-prisma.spec.ts`
- **pool** (1 connections) — `e2e/utils/db.ts`
- **adapter** (1 connections) — `e2e/utils/db.ts`
- **prisma** (1 connections) — `e2e/utils/db.ts`
- **seedTestData()** (1 connections) — `e2e/utils/db.ts`

## Relationships

- [[Attendance Upload State]] (1 shared connections)

## Source Files

- `e2e/employee-management/employee-management.spec.ts`
- `e2e/payroll-adjustments/adjustments-flow.spec.ts`
- `e2e/payroll-correction/correction-flow.spec.ts`
- `e2e/payroll-correction/verify-bugfix.spec.ts`
- `e2e/payroll-generation/payroll-flow.spec.ts`
- `e2e/payroll-history/payroll-history.spec.ts`
- `e2e/payroll-reports/reports-flow.spec.ts`
- `e2e/test-db-util.ts`
- `e2e/test-simple-prisma.spec.ts`
- `e2e/utils/db.ts`

## Audit Trail

- EXTRACTED: 91 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*