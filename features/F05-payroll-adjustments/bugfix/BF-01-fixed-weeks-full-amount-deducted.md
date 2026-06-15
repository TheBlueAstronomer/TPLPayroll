# BF-01 — FIXED_WEEKS Recurring Adjustment Deducts Full Amount Instead of Weekly Split

**Feature:** F05 — Payroll Adjustments  
**Severity:** High — Incorrect salary deductions being applied  
**Status:** 🔴 Open

---

## Problem Statement

When a **recurring adjustment** is created with the end condition `FIXED_WEEKS`, the user's
intent is that a **total amount** is divided equally across the specified number of weeks. For
example, entering ₹8,000 with 8 weeks should deduct ₹1,000 per week.

Instead, the system currently deducts the **full entered amount every week** — if you enter
₹8,000, the employee is docked ₹8,000 every single week for 8 weeks (₹64,000 total instead of
₹8,000 total).

Additionally, after one week's application is approved, **no next-week application is
automatically created**, so the recurrence never actually recurs without a skip action.

---

## Root Cause Analysis

### Bug 1 — `amount` field is treated as the per-week amount, not the total

**File:** [`adjustment.service.ts`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/services/adjustment.service.ts)  
**Lines:** 66–96 (`createAdjustment`)

When the adjustment is created, the `amount` from the form is stored directly in
`PayrollAdjustment.amount` and also written verbatim into the first
`PayrollAdjustmentApplication.appliedAmount`:

```ts
// Line 92-95 — appliedAmount == the full entered amount, not amount ÷ weeks
prisma.payrollAdjustmentApplication.create({
  data: {
    ...
    appliedAmount: d.amount,   // ← BUG: should be d.amount / d.totalRecurrenceWeeks
  },
})
```

For `FIXED_WEEKS`, the `amount` field on the form currently has **no defined semantic**:
is it the *total* to distribute, or the *per-week* amount? The form's label reads
**"Amount (₹)"** with no clarification, making both interpretations plausible from the UI.

**Decision needed (see Open Questions below):** we need to lock in the semantic before fixing
the code. The most user-intuitive interpretation for "8 weeks deduction" is that the user enters
the **total amount** and the system divides it by `totalRecurrenceWeeks` to get the weekly slice.

### Bug 2 — Approving an application does not schedule the next week's application (FIXED_WEEKS / END_WEEK)

**File:** [`adjustment.service.ts`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/services/adjustment.service.ts)  
**Lines:** 203–259 (`approveAdjustmentApplication`)

The `approveAdjustmentApplication` function handles the `TOTAL_BALANCE` end condition
correctly — it decrements `remainingBalance` and marks the adjustment `COMPLETED` when the
balance reaches zero. However, it has **no logic for `FIXED_WEEKS` or `END_WEEK`**:

```ts
// approveAdjustmentApplication — only handles TOTAL_BALANCE
const isTotalBalance = adj.recurrenceEndType === 'TOTAL_BALANCE'

if (isTotalBalance && adj.remainingBalance != null) {
  // ... depletes balance
}

// ← No branch for FIXED_WEEKS or END_WEEK
// ← No "create next week's application" call
// ← Adjustment never auto-completes for FIXED_WEEKS
```

Because of this:
- After approving week 1 of an 8-week plan, **no application exists for week 2–8**. The
  adjustment effectively stalls unless the user manually skips each week (skip does create the
  next application, but that is not the correct flow).
- The adjustment status never reaches `COMPLETED` — it stays `ACTIVE` forever.

### Bug 3 — `skipAdjustmentApplication` creates the next application with the full `adj.amount` (not the weekly slice)

**File:** [`adjustment.service.ts`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/services/adjustment.service.ts)  
**Lines:** 295–304 (`skipAdjustmentApplication`)

```ts
prisma.payrollAdjustmentApplication.create({
  data: {
    ...
    appliedAmount: Number(adj.amount), // ← BUG: should be weekly slice for FIXED_WEEKS
  },
})
```

If the user skips a week on a `FIXED_WEEKS` adjustment, the carried-forward application is
again created with the full `adj.amount` rather than the correct weekly instalment.

### Summary Table

| # | Location | Bug | Impact |
|---|----------|-----|--------|
| 1 | `createAdjustment` | First application `appliedAmount` = full amount, not weekly slice | Entire amount deducted in week 1 |
| 2 | `approveAdjustmentApplication` | No next-week application scheduled after approval for FIXED_WEEKS / END_WEEK | Recurrence never happens; adjustment never completes |
| 3 | `skipAdjustmentApplication` | Carried-forward application also uses full `adj.amount` | Skip path also over-deducts |

---

## Design Decisions (Confirmed)

> [!NOTE]
> **Q1 — RESOLVED: Option A**  
> The user enters the **total amount** (e.g., ₹8,000). The system computes `weeklyAmount = total ÷ totalRecurrenceWeeks` and stores that as `amount`. The original total is stored in `totalBalance`.

> [!NOTE]
> **Q2 — RESOLVED: Skipped weeks extend the window**  
> The plan runs for N **applied** (non-skipped) weeks. A skipped week carries forward the application to the next week and does not consume one of the N slots. The adjustment completes only after exactly `totalRecurrenceWeeks` weeks have been **approved**.

---

## Proposed Fix

The plan below assumes **Option A** (user enters total amount; system divides by weeks) for
Q1, and that skipped weeks do **not** count toward the applied-week tally (consistent with the
existing skip behavior).

### Semantic change: `amount` stores the **per-week instalment**

Rather than changing the DB schema, we store the **computed per-week instalment** in the
existing `amount` column and the **original total** in `totalBalance`. This keeps the rest of
the system (payroll calculation, `approvedApplications` query) working without changes —
they already sum `appliedAmount` per employee per week.

---

## Proposed Changes

---

### `src/features/payroll-adjustments/services/adjustment.service.ts`

#### [MODIFY] [`adjustment.service.ts`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/services/adjustment.service.ts)

**`createAdjustment` — compute weekly instalment and store total in `totalBalance`**

For `FIXED_WEEKS`, compute:
```
weeklyAmount = Math.round((amount / totalRecurrenceWeeks) * 100) / 100
```
- Store `weeklyAmount` in `PayrollAdjustment.amount` (the per-week instalment)
- Store the original entered `amount` in `PayrollAdjustment.totalBalance`
- Store `totalRecurrenceWeeks` as-is
- Set `remainingBalance = totalBalance` (mirrors `TOTAL_BALANCE` pattern)
- Create the first `PayrollAdjustmentApplication` with `appliedAmount = weeklyAmount`

**`approveAdjustmentApplication` — schedule next week and track weeks applied**

After marking the current application `APPROVED`:

1. **For `FIXED_WEEKS`:**
   - Decrement `remainingBalance` by `appliedAmount` (same as TOTAL_BALANCE)
   - Compute `weeksApplied` = number of `APPROVED` applications for this adjustment + 1 (current)
   - If `weeksApplied < totalRecurrenceWeeks` → create next-week `PENDING` application with `appliedAmount = adj.amount` (the stored weekly instalment)
   - If `weeksApplied >= totalRecurrenceWeeks` → set adjustment `status = 'COMPLETED'`

2. **For `END_WEEK`:**
   - After approval, check if `payrollWeekStartDate` of the current application `>=` `endPayrollWeekStartDate`
   - If yes → set adjustment `status = 'COMPLETED'`
   - If no → create next-week `PENDING` application with `appliedAmount = adj.amount`

3. **For `TOTAL_BALANCE`:** _(existing logic, no change)_

**`skipAdjustmentApplication` — use stored weekly instalment (no change needed once Bug 1 is fixed)**

Once `adj.amount` stores the per-week slice, the existing skip logic (`appliedAmount: Number(adj.amount)`) will naturally use the correct amount. No code change required in the skip function itself.

---

### `src/features/payroll-adjustments/components/AdjustmentForm.tsx`

#### [MODIFY] [`AdjustmentForm.tsx`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/components/AdjustmentForm.tsx)

- Update the **"Amount (₹)"** label for the `FIXED_WEEKS` path to read:  
  **"Total Amount (₹) — will be split equally each week"**  
  (or a helper-text sub-label beneath the field)
- No structural form changes needed; the field still submits a single number.

#### [MODIFY] [`AdjustmentEditForm.tsx`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/components/AdjustmentEditForm.tsx)

- Same label update as above.

---

### `src/features/payroll-adjustments/components/AdjustmentDetail.tsx`

#### [MODIFY] [`AdjustmentDetail.tsx`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/components/AdjustmentDetail.tsx)

- Show both the **per-week amount** (`amount`) and the **total** (`totalBalance`) for `FIXED_WEEKS` adjustments in the detail view so the user can see the split clearly.

---

### `src/features/payroll-adjustments/__tests__/adjustment-service.test.ts`

#### [MODIFY] [`adjustment-service.test.ts`](file:///e:/Projects/TPLPayroll/src/features/payroll-adjustments/__tests__/adjustment-service.test.ts)

Add / update test cases:

| Test | Assertion |
|------|-----------|
| `createAdjustment — FIXED_WEEKS stores weeklyAmount in amount` | `result.amount === 1000` (₹8,000 ÷ 8 weeks) |
| `createAdjustment — FIXED_WEEKS stores original total in totalBalance` | `result.totalBalance === 8000` |
| `createAdjustment — FIXED_WEEKS sets first application appliedAmount to weekly slice` | `capturedAppCreate.data.appliedAmount === 1000` |
| `approveAdjustmentApplication — FIXED_WEEKS creates next-week application after approval` | new PENDING app created for week+7 |
| `approveAdjustmentApplication — FIXED_WEEKS marks adjustment COMPLETED after last week` | `adj.status === 'COMPLETED'` |
| `approveAdjustmentApplication — END_WEEK creates next-week application before end week` | new PENDING app created |
| `approveAdjustmentApplication — END_WEEK marks COMPLETED when last week approved` | `adj.status === 'COMPLETED'` |

---

## Data Model Impact

No schema migrations required. The fix reuses existing columns:

| Column | FIXED_WEEKS (after fix) |
|--------|------------------------|
| `amount` | Per-week instalment (e.g., ₹1,000) |
| `totalBalance` | Original entered total (e.g., ₹8,000) |
| `remainingBalance` | Decrements by ₹1,000 each week; reaches 0 at completion |
| `totalRecurrenceWeeks` | 8 (unchanged) |

---

## Verification Plan

### Automated Tests (unit)

```bash
npx vitest run src/features/payroll-adjustments/__tests__/adjustment-service.test.ts
```

All existing tests must still pass; new tests listed above must pass.

### Manual Smoke Test

1. Create a recurring **deduction** with:
   - Employee: any active employee
   - Amount: ₹4,000
   - Recurrence: Recurring → Fixed number of weeks → 4 weeks
   - Start week: current week
2. Verify in the Adjustment Detail that:
   - `amount` shown = ₹1,000 (weekly slice)
   - `totalBalance` = ₹4,000
3. Run payroll for week 1:
   - Approve the adjustment application
   - Confirm the employee's deduction shows ₹1,000, not ₹4,000
4. After approval, verify a new **PENDING** application is auto-created for week 2
5. Repeat for weeks 2–4
6. After week 4 approval, verify the adjustment status becomes **COMPLETED** and no week-5 application is created
