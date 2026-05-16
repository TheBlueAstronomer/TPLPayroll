'use server'

import { getSettings, updateSettings } from '@/features/settings/services/settings.service'
import {
  SettingsServiceError,
  type AppSettings,
  type UpdateSettingsInput,
} from '@/features/settings/types/settings.types'

// ─── Action result wrapper ────────────────────────────────────────────────────

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function err(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

function handleError(e: unknown): ActionResult<never> {
  if (e instanceof SettingsServiceError) return err(e.message, e.code)
  console.error('[SettingsAction]', e)
  return err('An unexpected error occurred')
}

// ─── getSettingsAction ────────────────────────────────────────────────────────

export async function getSettingsAction(): Promise<ActionResult<AppSettings>> {
  try {
    const settings = await getSettings()
    return ok(settings)
  } catch (e) {
    return handleError(e)
  }
}

// ─── updateSettingsAction ─────────────────────────────────────────────────────

export async function updateSettingsAction(
  input: UpdateSettingsInput,
): Promise<ActionResult<AppSettings>> {
  try {
    const settings = await updateSettings(input)
    return ok(settings)
  } catch (e) {
    return handleError(e)
  }
}
