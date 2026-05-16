# F08 — Payroll Correction

> **Status: ✅ DONE**

## Goal

Allow the Payroll Owner to make corrections to an already-approved payroll run by creating a new revision — preserving the previous calculation data for audit while making the latest revision the current payable version.

## Scope

- Open an approved payroll run and make permitted corrections.
- Create a new PayrollRevision instead of overwriting the previous one.
- Allowed corrections: adjustments (deductions/additions), employee wage rate, employee matching, employee master data, attendance (via corrected upload).
- Correction reason is optional.
- Re-calculate payroll with corrected data.
- Preview and approve the revised payroll summary.
- Regenerate PDF summary and payroll slip ZIP from the revised data.
- Previous revisions remain accessible for audit/history.

## PRD References

- Section 9.9: Correct Approved Payroll (workflow)

---

## E2E Behavior Tests

### E2E-01: Create a payroll revision for adjustment correction

```
GIVEN payroll for March 6-12 is approved (revision 1) with totalNetPayable = ₹44,481
WHEN the user opens the approved payroll and adds a deduction of ₹1,000 for "EMP-001"
AND approves the revised payroll
THEN a new PayrollRevision (revision 2) is created with isCurrent = true
AND revision 1's isCurrent is set to false
AND the PayrollRun's currentRevisionNumber is updated to 2
AND the revised totalNetPayable reflects the deduction
```

### E2E-02: Previous revision data is preserved

```
GIVEN payroll revision 2 is approved
WHEN the user views payroll history for March 6-12
THEN both revision 1 and revision 2 are visible
AND revision 2 is marked as "Current"
AND revision 1 is marked as "Superseded"
```

### E2E-03: Correction via attendance re-upload

```
GIVEN payroll for March 6-12 is approved
WHEN the user uploads a corrected attendance file for March 6-12
AND initiates a payroll correction
THEN the payroll is recalculated with the new attendance data
AND a new revision is created
```

### E2E-04: Correction reason is optional

```
GIVEN the user creates a payroll correction
WHEN the correction reason is left blank
THEN the correction is accepted without error
AND the revision's correctionReason is null
```

### E2E-05: Reports regenerated from revised data

```
GIVEN payroll revision 2 is the current revision
WHEN the user generates PDF summary or payroll slips
THEN the generated documents reflect revision 2's data
```
