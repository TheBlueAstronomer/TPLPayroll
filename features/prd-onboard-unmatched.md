## Problem Statement

When uploading an attendance sheet, employees whose names or IDs don't match any record in the employee database are shown in the Manual Verification dialog as Unmatched. Currently, the only resolution options are to search for and link an existing database employee, or to skip the row (which keeps the upload blocked). There is no way to onboard an unmatched employee as a new record from within the upload flow — the admin must abandon the upload, navigate to the employee directory, create the employee, and restart the entire upload. There is also no way to explicitly reject an unmatched employee without leaving the upload in a blocked state.

## Solution

Extend the Unmatched section of the Manual Verification dialog with three explicit actions per unmatched row:

1. **Match** (existing) — search the employee database and link to an existing record
2. **Onboard as new employee** — navigate to the full Add Employee page, create the employee, then automatically return to the attendance upload dialog with the new employee pre-linked to that row
3. **Reject** — explicitly exclude this employee from the current payroll week without blocking the upload

## User Stories

1. As a payroll admin, I want three distinct actions (Match, Onboard, Reject) for each unmatched employee row, so that my intent for every unmatched name is unambiguous.
2. As a payroll admin, I want to click "Onboard as new employee" for an unmatched row, so that I can add them to the system without abandoning and restarting the upload.
3. As a payroll admin, I want the Add Employee page — when reached from the attendance upload flow — to show a contextual breadcrumb ("Return to attendance upload"), so that I know I am in a linked flow and can orient myself.
4. As a payroll admin, I want the Add Employee form in the attendance-upload context to pre-fill the employee name from the attendance sheet, so that I don't have to retype it.
5. As a payroll admin, after saving a new employee from within the attendance upload context, I want to be returned automatically to the Manual Verification dialog, so that I don't have to restart the upload from scratch.
6. As a payroll admin, when I return to the Manual Verification dialog after onboarding a new employee, I want that unmatched row to be automatically linked to the newly created employee, so that I don't have to search for them manually.
7. As a payroll admin, I want all decisions I made in the dialog before clicking "Onboard" (other matches, other rejections) to be preserved when I return, so that I don't lose prior work.
8. As a payroll admin, I want to click "Reject" for an unmatched employee to explicitly exclude them from this payroll week without blocking the upload, so that a conscious omission doesn't hold up payroll generation.
9. As a payroll admin, I want a rejected unmatched employee to appear with a "Rejected" status in the attendance preview screen, so that the exclusion is auditable.
10. As a payroll admin, I want the "Confirm Selections" button to remain disabled until every unmatched row has a decision (Match, Onboard-in-progress, or Reject), so that I cannot accidentally confirm with unresolved employees.
11. As a payroll admin, I want rows that are "Onboard in progress" (I navigated to Add Employee but haven't returned yet) to be clearly indicated when I come back to the dialog, so that I know which rows still need resolution.
12. As a payroll admin, if the upload session expires before I return from the Add Employee page, I want a clear error message telling me to re-upload the file, so that I am not confused by a broken state.
13. As a payroll admin, I want rejected unmatched employees to NOT block the upload from reaching "Ready" status, so that I can proceed to payroll generation after reviewing all employees.
14. As a payroll admin, I want the attendance preview "Excluded" stat to include both rejected inactive/resigned employees and rejected unmatched employees, so that the count reflects all intentional exclusions in one place.
15. As a payroll admin, I want the Onboard flow to work correctly even if I onboard multiple unmatched employees sequentially (one at a time), so that every unmatched row can be resolved without restarting.

## Implementation Decisions

### 1. Session persistence for cross-navigation state

The upload dialog state (temp file path, week dates, week source, decisions made so far) must survive navigation to the Add Employee page and back. This is implemented via a new short-lived **AttendanceUploadSession** record in the database.

New schema model:

```
AttendanceUploadSession {
  id              String   // UUID — used as the session token in URL params
  tempFilePath    String
  fileName        String
  fileType        String
  weekStart       String   // YYYY-MM-DD
  weekEnd         String   // YYYY-MM-DD
  weekSource      String   // PayrollWeekSource value
  decisionsJson   String   // JSON: { verificationDecisions, manualMatchDecisions, rejectedBlockKeys }
  pendingBlockKey String   // blockKey of the row currently being onboarded
  expiresAt       DateTime // createdAt + 30 minutes
  createdAt       DateTime
}
```

When the user clicks "Onboard", a new server action (`createAttendanceUploadSessionAction`) serialises the current dialog state into this table and returns the session `id`. The client then navigates to `/employees/new?attendanceSession=<id>`.

On return, a companion action (`resumeAttendanceUploadSessionAction`) loads the session, re-derives the full records list by re-running `parseAttendanceWithDatesAction` against the still-live temp file, overlays the stored decisions, and links the new employee to the `pendingBlockKey` row. Expired or missing sessions surface a prompt to re-upload.

Expired sessions are pruned inline on the `createAttendanceUploadSessionAction` call path (fire-and-forget DELETE WHERE expiresAt < now()).

### 2. EmployeeForm — return-to-attendance context

`EmployeeForm` gains an optional `returnContext` prop:

```ts
interface AttendanceReturnContext {
  sessionId: string
  sheetEmployeeName: string  // pre-fills the name field (user can edit)
}
```

When `returnContext` is present:
- The "Back to directory" link is replaced by "Return to attendance upload"
- The employee name field is pre-filled with `sheetEmployeeName`
- After a successful `createEmployeeAction`, instead of pushing `/employees/<id>`, the form redirects to `/attendance?resumeSession=<sessionId>&newEmployeeId=<id>`

The `/employees/new` server page reads `attendanceSession` from the URL, calls `getAttendanceUploadSessionAction` to retrieve the sheet employee name, and passes the `returnContext` prop to `EmployeeForm`.

### 3. Reject action for UNMATCHED employees

Rename the existing "Skip" button to "Reject". Change the internal decision type from `{ type: 'skipped' }` to `{ type: 'rejected' }`.

A new `MatchStatus` value `'REJECTED_UNMATCHED'` is added to distinguish these rows from INACTIVE/RESIGNED rejections in the preview and stats.

In `finalizeAttendanceUploadAction`, UNMATCHED records whose `blockKey` appears in the set of rejected block keys are assigned `matchStatus = 'REJECTED_UNMATCHED'` and `isBlocking = false`. They are NOT written to `AttendanceRecord` (there is no `employeeId` to link them to). The subsequent `computeImportSummary` recomputation then produces a non-blocked upload if all UNMATCHED rows have been either matched or rejected.

A new `rejectedBlockKeys` field is added to `FinalizeUploadInput` (parallel to the existing `manualMatchDecisions`).

### 4. Attendance page — session resume

The `/attendance` page checks for `resumeSession` + `newEmployeeId` query params on load. When present, it calls `resumeAttendanceUploadSessionAction`, which returns a reconstituted dialog state. This is threaded to `AttendanceUploadClient` as an `initialDialogState` prop, causing the dialog to open immediately with all prior decisions restored and the new employee pre-linked to the pending row.

### 5. Module breakdown

| Module | Change |
|--------|--------|
| `AttendanceUploadSession` service (new) | Create, load, expire sessions. Pure DB read/write. |
| `EmployeeForm` | Add optional `returnContext` prop; conditional post-save navigation. |
| `EmployeeVerificationDialog` | Three-button row layout (Match / Onboard / Reject); "Onboard in progress" indicator state. |
| `AttendanceUploadClient` | Handle Onboard click (session create + navigate); accept `initialDialogState` prop for session resume. |
| `finalizeAttendanceUploadAction` | Accept and apply `rejectedBlockKeys`. |
| `attendance.types` | Add `'REJECTED_UNMATCHED'` to `MatchStatus`. |
| `import-summary.service` | Treat `REJECTED_UNMATCHED` as non-blocking and non-matched (excluded). |
| `AttendancePreviewClient` + preview page | Show "Rejected" status for `REJECTED_UNMATCHED`; include in Excluded count. |

## Testing Decisions

Good tests verify observable outcomes — DB state, rendered UI state, and action return values — not internal helper call sequences.

**Modules to test:**

- **`AttendanceUploadSession` service** — unit tests with real test DB (pattern: `upload.service.test.ts`): create returns a valid token; load before expiry returns the session; load after expiry returns null; loading a non-existent token returns null.
- **`finalizeAttendanceUploadAction` with rejected UNMATCHED records** — integration test: given records with `UNMATCHED` status and corresponding `rejectedBlockKeys`, assert `AttendanceUpload.status = 'READY'` and no `AttendanceRecord` is created for those employees.
- **`resumeAttendanceUploadSessionAction`** — integration test: given a saved session and a new employee ID, assert the returned dialog state contains the correct `manualMatchDecisions` entry for the pending block key and that all prior decisions are preserved.
- **`EmployeeVerificationDialog`** — component tests: clicking "Reject" marks the row as decided; "Confirm" enables only when all rows are decided; "Onboard" triggers the session-save callback; an in-progress row shows the pending indicator and disables Confirm.

Prior art: `employee-matcher.test.ts`, `upload.service.test.ts`, `import-summary.test.ts`.

## Out of Scope

- Completing the onboarded employee's full profile (police verification, Aadhaar, health card, bank details) from within the attendance flow — these can be filled in later via the employee directory.
- Bulk onboarding of multiple unmatched employees in a single Add Employee session — each row is onboarded one at a time sequentially.
- Session persistence beyond 30 minutes (expired sessions require a re-upload).
- Adding an "Onboard" option to INACTIVE or RESIGNED verification rows — those employees already exist in the database.
- Mobile-specific layout changes to the three-button row design.

## Further Notes

- The pre-filled employee name from the sheet should be editable on the Add Employee form — sheet names may be nicknames, abbreviations, or contain typos.
- If the temp file is missing when `resumeAttendanceUploadSessionAction` runs (e.g., server restart cleared `/tmp`), the error must prompt the user to re-upload rather than silently failing or producing partial data.
- The three-button layout per row (Match combobox + Onboard button + Reject button) replaces the current two-element layout (combobox + Skip). Row height may need adjustment to accommodate the third action comfortably.
