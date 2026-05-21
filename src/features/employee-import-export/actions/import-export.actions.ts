'use server'

import { validateImportFile, parseImportFile, executeImport } from '@/features/employee-import-export/services/import.service'
import { ImportExportServiceError } from '@/features/employee-import-export/types/import-export.types'
import type { ParseImportResult, ExecuteImportResult, ValidImportRow } from '@/features/employee-import-export/types/import-export.types'

// ─── ActionResult type (mirrors employee-management pattern) ─────────────────

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

// ─── parseImportFileAction ─────────────────────────────────────────────────────

export async function parseImportFileAction(
  formData: FormData
): Promise<ActionResult<{ parseResult: ParseImportResult; fileBase64: string; fileName: string }>> {
  const file = formData.get('file') as File | null
  if (!file) return { ok: false, error: 'No file provided', code: 'MISSING_FILE' }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const validation = validateImportFile(buffer, file.name)
  if (!validation.ok) {
    const messages: Record<string, string> = {
      UNSUPPORTED_FILE_TYPE: 'Unsupported file type. Please upload an .xlsx file.',
      SHEET_NOT_FOUND: "Sheet 'Employee Master List' not found in the uploaded file.",
    }
    return { ok: false, error: messages[validation.error] ?? validation.error, code: validation.error }
  }

  const parseResult = await parseImportFile(buffer)
  const fileBase64 = buffer.toString('base64')

  return { ok: true, data: { parseResult, fileBase64, fileName: file.name } }
}

// ─── executeImportAction ───────────────────────────────────────────────────────

export async function executeImportAction(
  fileBase64: string,
  fileName: string,
  fixedRows: ValidImportRow[] = []
): Promise<ActionResult<ExecuteImportResult>> {
  try {
    const buffer = Buffer.from(fileBase64, 'base64')
    const result = await executeImport(buffer, fileName, '', fixedRows)
    return { ok: true, data: result }
  } catch (err) {
    const e = err as Error & { code?: string; meta?: unknown }
    console.error('[ImportError] name:', e?.name)
    console.error('[ImportError] message:', e?.message)
    console.error('[ImportError] code:', e?.code)
    console.error('[ImportError] stack:', e?.stack)
    if (e?.meta) console.error('[ImportError] meta:', JSON.stringify(e.meta))
    if (err instanceof ImportExportServiceError) {
      return { ok: false, error: err.message, code: err.code }
    }
    return { ok: false, error: 'Import failed. Please try again.' }
  }
}

