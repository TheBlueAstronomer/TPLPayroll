'use server'

import {
  getAvailablePayrollWeeks,
  checkAttendanceReadiness,
  getPendingAdjustmentsForWeek,
  calculatePayroll,
  approvePayroll,
} from '@/features/payroll-generation/services/payroll.service'
import { PayrollServiceError } from '@/features/payroll-generation/types/payroll.types'
import type {
  PayrollWeekItem,
  AttendanceReadinessResult,
  PayrollSummary,
  ApprovePayrollResult,
} from '@/features/payroll-generation/types/payroll.types'
import type { WeeklyReviewItem } from '@/features/payroll-adjustments/types/adjustment.types'

// ─── Action result wrapper ────────────────────────────────────────────────────

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function err(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

function handleError(e: unknown): ActionResult<never> {
  if (e instanceof PayrollServiceError) return err(e.message, e.code)
  console.error('[PayrollAction]', e)
  return err('An unexpected error occurred')
}

// ─── getAvailablePayrollWeeksAction ───────────────────────────────────────────

export async function getAvailablePayrollWeeksAction(): Promise<ActionResult<PayrollWeekItem[]>> {
  try {
    const weeks = await getAvailablePayrollWeeks()
    return ok(weeks)
  } catch (e) {
    return handleError(e)
  }
}

// ─── checkAttendanceReadinessAction ──────────────────────────────────────────

export async function checkAttendanceReadinessAction(
  weekStart: Date,
  weekEnd: Date,
): Promise<ActionResult<AttendanceReadinessResult>> {
  try {
    const result = await checkAttendanceReadiness(weekStart, weekEnd)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getPendingAdjustmentsForWeekAction ───────────────────────────────────────

export async function getPendingAdjustmentsForWeekAction(
  weekStart: Date,
  weekEnd: Date,
): Promise<ActionResult<WeeklyReviewItem[]>> {
  try {
    const items = await getPendingAdjustmentsForWeek(weekStart, weekEnd)
    return ok(items)
  } catch (e) {
    return handleError(e)
  }
}

// ─── calculatePayrollAction ───────────────────────────────────────────────────

export async function calculatePayrollAction(
  weekStart: Date,
  weekEnd: Date,
): Promise<ActionResult<PayrollSummary>> {
  try {
    const summary = await calculatePayroll(weekStart, weekEnd)
    return ok(summary)
  } catch (e) {
    return handleError(e)
  }
}

// ─── approvePayrollAction ─────────────────────────────────────────────────────

export async function approvePayrollAction(
  summary: PayrollSummary,
): Promise<ActionResult<ApprovePayrollResult>> {
  try {
    const result = await approvePayroll(summary)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}
