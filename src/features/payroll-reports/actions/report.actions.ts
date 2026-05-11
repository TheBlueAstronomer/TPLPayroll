'use server'

import {
  markInvoiceSnapshotsCleaned,
} from '../services/report.service'
import { ReportServiceError } from '../types/report.types'

// ─── Action result wrapper ────────────────────────────────────────────────────

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function err(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

function handleError(e: unknown): ActionResult<never> {
  if (e instanceof ReportServiceError) return err(e.message, e.code)
  console.error('[ReportAction]', e)
  return err('An unexpected error occurred')
}

// NOTE: PDF/ZIP generation is done via API routes, not server actions
// Server actions are used for data operations only

export async function markReportFilesCleanedAction(payrollRunId: string): Promise<ActionResult<void>> {
  try {
    await markInvoiceSnapshotsCleaned(payrollRunId)
    return ok(undefined)
  } catch (e) {
    return handleError(e)
  }
}
