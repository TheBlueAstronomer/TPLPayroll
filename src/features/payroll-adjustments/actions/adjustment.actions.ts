'use server'

import {
  createAdjustment,
  getAdjustmentList,
  getAdjustmentDetail,
  approveAdjustmentApplication,
  skipAdjustmentApplication,
  getAdjustmentsForWeekReview,
} from '@/features/payroll-adjustments/services/adjustment.service'
import {
  AdjustmentServiceError,
  type CreateAdjustmentInput,
  type AdjustmentListOptions,
  type PaginatedAdjustmentList,
  type AdjustmentDetailRecord,
  type WeeklyReviewItem,
  type AdjustmentApplicationRecord,
} from '@/features/payroll-adjustments/types/adjustment.types'

// ─── Action result wrapper ────────────────────────────────────────────────────

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function err(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

function handleError(e: unknown): ActionResult<never> {
  if (e instanceof AdjustmentServiceError) return err(e.message, e.code)
  console.error('[AdjustmentAction]', e)
  return err('An unexpected error occurred')
}

// ─── createAdjustmentAction ───────────────────────────────────────────────────

export async function createAdjustmentAction(
  input: CreateAdjustmentInput,
): Promise<ActionResult<{ id: string; amount: number; recurrenceType: string }>> {
  try {
    const result = await createAdjustment(input)
    return ok({ id: result.id, amount: result.amount, recurrenceType: result.recurrenceType })
  } catch (e) {
    return handleError(e)
  }
}

// ─── getAdjustmentListAction ──────────────────────────────────────────────────

export async function getAdjustmentListAction(
  options: AdjustmentListOptions,
): Promise<ActionResult<PaginatedAdjustmentList>> {
  try {
    const list = await getAdjustmentList(options)
    return ok(list)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getAdjustmentDetailAction ────────────────────────────────────────────────

export async function getAdjustmentDetailAction(
  id: string,
): Promise<ActionResult<AdjustmentDetailRecord>> {
  try {
    const detail = await getAdjustmentDetail(id)
    return ok(detail)
  } catch (e) {
    return handleError(e)
  }
}

// ─── approveAdjustmentApplicationAction ──────────────────────────────────────

export async function approveAdjustmentApplicationAction(
  applicationId: string,
): Promise<ActionResult<AdjustmentApplicationRecord>> {
  try {
    const result = await approveAdjustmentApplication(applicationId)
    return ok(result as unknown as AdjustmentApplicationRecord)
  } catch (e) {
    return handleError(e)
  }
}

// ─── skipAdjustmentApplicationAction ─────────────────────────────────────────

export async function skipAdjustmentApplicationAction(
  applicationId: string,
): Promise<ActionResult<AdjustmentApplicationRecord>> {
  try {
    const result = await skipAdjustmentApplication(applicationId)
    return ok(result as unknown as AdjustmentApplicationRecord)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getAdjustmentsForWeekReviewAction ────────────────────────────────────────

export async function getAdjustmentsForWeekReviewAction(
  weekStartDate: Date,
): Promise<ActionResult<WeeklyReviewItem[]>> {
  try {
    const items = await getAdjustmentsForWeekReview(weekStartDate)
    return ok(items)
  } catch (e) {
    return handleError(e)
  }
}
