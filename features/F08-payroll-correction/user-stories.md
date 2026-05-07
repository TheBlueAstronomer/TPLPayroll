# F08 — Payroll Correction: User Stories

---

## US-08.1: Initiate payroll correction

**As a** Payroll Owner
**I want to** open an approved payroll and initiate a correction
**So that** I can fix errors found after initial approval.

### Acceptance Criteria

- AC1: A "Correct Payroll" button is available on approved payroll runs.
- AC2: Clicking it opens a correction flow that loads the current revision's data.
- AC3: An optional correction reason text field is presented.
- AC4: The user can modify adjustments, attendance (via re-upload), or note that employee data has changed.

### Unit Tests

```
TEST: initiateCorrection loads current revision data
  GIVEN payroll run with revision 1 (isCurrent = true)
  WHEN initiateCorrection(payrollRunId) is called
  THEN it returns revision 1's data for editing

TEST: initiateCorrection is blocked for non-approved runs
  GIVEN payroll run with status = "DRAFT"
  WHEN initiateCorrection() is called
  THEN it throws "CANNOT_CORRECT_UNAPPROVED_PAYROLL"
```

---

## US-08.2: Modify adjustments in correction

**As a** Payroll Owner
**I want to** add, remove, or change adjustments during a payroll correction
**So that** the corrected payroll reflects the right deductions and additions.

### Acceptance Criteria

- AC1: The correction flow shows existing approved adjustments for the week.
- AC2: User can reverse previously approved adjustments.
- AC3: User can approve previously skipped adjustments.
- AC4: User can add new one-time adjustments for this week.
- AC5: Reversed adjustments are marked with `isReversed = true` in the PayrollAdjustmentApplication.

### Unit Tests

```
TEST: reverseAdjustmentApplication marks as reversed
  GIVEN an approved application for EMP-001
  WHEN reverseAdjustmentApplication() is called
  THEN isReversed = true
  AND the deduction/addition is excluded from recalculation

TEST: approveSkippedAdjustment in correction
  GIVEN a skipped application for EMP-002
  WHEN approveAdjustmentApplication() is called in correction context
  THEN approvalStatus = "APPROVED" and it is included in recalculation
```

---

## US-08.3: Recalculate and create new revision

**As a** Payroll Owner
**I want to** the app to recalculate payroll with corrected data and create a new revision
**So that** the corrected payroll is accurately computed and the previous calculation is preserved.

### Acceptance Criteria

- AC1: Payroll is recalculated using corrected attendance, current employee wages, and revised adjustments.
- AC2: A new PayrollRevision is created with revisionNumber = previous + 1.
- AC3: The new revision has isCurrent = true.
- AC4: The previous revision's isCurrent is set to false and status = "SUPERSEDED".
- AC5: New PayrollRunEmployee records are created for the new revision.
- AC6: The PayrollRun's currentRevisionNumber is updated.
- AC7: The correctionReason (if provided) is stored on the new revision.

### Unit Tests

```
TEST: createRevision increments revision number
  GIVEN current revision number = 1
  WHEN createRevision() is called
  THEN the new revision has revisionNumber = 2

TEST: createRevision supersedes previous revision
  GIVEN revision 1 has isCurrent = true
  WHEN createRevision() is called
  THEN revision 1.isCurrent = false and revision 1.status = "SUPERSEDED"
  AND revision 2.isCurrent = true

TEST: createRevision stores correction reason
  GIVEN correctionReason = "Wrong overtime hours for EMP-003"
  WHEN createRevision() is called
  THEN the revision's correctionReason = "Wrong overtime hours for EMP-003"

TEST: createRevision allows null correction reason
  GIVEN correctionReason = null
  WHEN createRevision() is called
  THEN the revision is created with correctionReason = null
```

---

## US-08.4: Preview and approve revised payroll

**As a** Payroll Owner
**I want to** review the revised payroll summary before approving it
**So that** I can confirm the correction is accurate.

### Acceptance Criteria

- AC1: The revised summary is displayed in the same format as the original (F06 Step 3).
- AC2: Differences from the previous revision can be visually identified (optional highlight).
- AC3: Approval sets the new revision status = "APPROVED" and approvedAt.
- AC4: After approval, PDF and payroll slip generation buttons are available.

### Unit Tests

```
TEST: approveRevision sets status and timestamp
  GIVEN a revision in review
  WHEN approveRevision() is called
  THEN status = "APPROVED" and approvedAt is set
```

---

## US-08.5: View revision history

**As a** Payroll Owner
**I want to** see all revisions for a payroll run
**So that** I can audit what changed and when.

### Acceptance Criteria

- AC1: A "Revision History" section lists all revisions for the payroll run.
- AC2: Each revision shows: revision number, status (Current/Superseded), correction reason, totals, timestamps.
- AC3: Clicking a revision shows its full PayrollRunEmployee breakdown.

### Unit Tests

```
TEST: getRevisionHistory returns all revisions
  GIVEN payroll run with 3 revisions
  WHEN getRevisionHistory(payrollRunId) is called
  THEN it returns 3 revisions sorted by revisionNumber descending
```
