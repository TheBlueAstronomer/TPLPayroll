'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { validateImportFile, parseImportFile, executeImport } from '@/features/employee-import-export/services/import.service'
import { ImportExportServiceError } from '@/features/employee-import-export/types/import-export.types'
import type { ParseImportResult, ExecuteImportResult } from '@/features/employee-import-export/types/import-export.types'

// ─── ActionResult type (mirrors employee-management pattern) ─────────────────

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

// ─── parseImportFileAction ─────────────────────────────────────────────────────

export async function parseImportFileAction(
  formData: FormData
): Promise<ActionResult<{ parseResult: ParseImportResult; tempPath: string; fileName: string }>> {
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

  // Save buffer to a temp file — the path is passed to executeImportAction for cleanup
  const tmpDir = join(tmpdir(), 'tpl-payroll-imports')
  await mkdir(tmpDir, { recursive: true })
  const tempPath = join(tmpDir, `import-${Date.now()}-${file.name}`)
  await writeFile(tempPath, buffer)

  return { ok: true, data: { parseResult, tempPath, fileName: file.name } }
}

// ─── executeImportAction ───────────────────────────────────────────────────────

export async function executeImportAction(
  tempPath: string,
  fileName: string
): Promise<ActionResult<ExecuteImportResult>> {
  try {
    const { readFile } = await import('fs/promises')
    const buffer = await readFile(tempPath)
    const result = await executeImport(buffer, fileName, tempPath)
    return { ok: true, data: result }
  } catch (err) {
    if (err instanceof ImportExportServiceError) {
      return { ok: false, error: err.message, code: err.code }
    }
    return { ok: false, error: 'Import failed. Please try again.' }
  }
}
