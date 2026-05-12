'use server'

import {
  initiateCorrection,
  reverseAdjustmentApplication,
  approveSkippedAdjustment,
  recalculateAndCreateRevision,
  approveRevision,
  getRevisionHistory,
  getRevisionEmployees,
  prepareAdjustmentsForCorrection,
} from '@/features/payroll-correction/services/correction.service'
import { CorrectionServiceError } from '@/features/payroll-correction/types/correction.types'
import type {
  InitiateCorrectionResult,
  CreateRevisionInput,
  CreateRevisionResult,
  RevisionHistoryItem,
  ApproveRevisionResult,
  RevisedEmployeeRow,
} from '@/features/payroll-correction/types/correction.types'
import { redirect } from 'next/navigation'

// ─── Action result wrapper ────────────────────────────────────────────────────

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function err(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

function handleError(e: unknown): ActionResult<never> {
  if (e instanceof CorrectionServiceError) return err(e.message, e.code)
  console.error('[CorrectionAction]', e)
  return err('An unexpected error occurred')
}

// ─── beginPayrollCorrectionAction ─────────────────────────────────────────────

export async function beginPayrollCorrectionAction(payrollRunId: string): Promise<void> {
  // Performs the reset mutation
  await prepareAdjustmentsForCorrection(payrollRunId)
  
  // Trigger redirect to the interactive correction flow
  redirect(`/payroll/run/${payrollRunId}/correct`)
}

// ─── initiateCorrectionAction ─────────────────────────────────────────────────

export async function initiateCorrectionAction(
  payrollRunId: string,
): Promise<ActionResult<InitiateCorrectionResult>> {
  try {
    const result = await initiateCorrection(payrollRunId)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

// ─── reverseAdjustmentAction ──────────────────────────────────────────────────

export async function reverseAdjustmentAction(
  applicationId: string,
): Promise<ActionResult<{ applicationId: string; isReversed: true }>> {
  try {
    const result = await reverseAdjustmentApplication(applicationId)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

// ─── approveSkippedAdjustmentAction ───────────────────────────────────────────

export async function approveSkippedAdjustmentAction(
  applicationId: string,
): Promise<ActionResult<{ applicationId: string; approvalStatus: 'APPROVED' }>> {
  try {
    const result = await approveSkippedAdjustment(applicationId)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

// ─── recalculateAndCreateRevisionAction ───────────────────────────────────────

export async function recalculateAndCreateRevisionAction(
  input: CreateRevisionInput,
): Promise<ActionResult<CreateRevisionResult>> {
  try {
    const result = await recalculateAndCreateRevision(input)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

// ─── approveRevisionAction ────────────────────────────────────────────────────

export async function approveRevisionAction(
  revisionId: string,
): Promise<ActionResult<ApproveRevisionResult>> {
  try {
    const result = await approveRevision(revisionId)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getRevisionHistoryAction ─────────────────────────────────────────────────

export async function getRevisionHistoryAction(
  payrollRunId: string,
): Promise<ActionResult<RevisionHistoryItem[]>> {
  try {
    const result = await getRevisionHistory(payrollRunId)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getRevisionEmployeesAction ───────────────────────────────────────────────

export async function getRevisionEmployeesAction(
  revisionId: string,
  previousRevisionId?: string,
): Promise<ActionResult<RevisedEmployeeRow[]>> {
  try {
    const result = await getRevisionEmployees(revisionId, previousRevisionId)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}
