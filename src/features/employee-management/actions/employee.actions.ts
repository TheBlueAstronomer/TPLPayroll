'use server'

import {
  createEmployee,
  getEmployeeList,
  getEmployeeById,
  getEmployeeWageHistory,
  updateEmployee,
} from '@/features/employee-management/services/employee.service'
import {
  EmployeeServiceError,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type EmployeeListOptions,
  type PaginatedEmployeeList,
  type EmployeeRecord,
  type WageHistoryEntry,
} from '@/features/employee-management/types/employee.types'

// ─── Action result wrapper ────────────────────────────────────────────────────

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function err(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

function handleError(e: unknown): ActionResult<never> {
  if (e instanceof EmployeeServiceError) {
    return err(e.message, e.code)
  }
  console.error('[EmployeeAction]', e)
  return err('An unexpected error occurred')
}

// ─── createEmployeeAction ─────────────────────────────────────────────────────

export async function createEmployeeAction(
  input: CreateEmployeeInput
): Promise<ActionResult<EmployeeRecord>> {
  try {
    const employee = await createEmployee(input)
    return ok(employee)
  } catch (e) {
    return handleError(e)
  }
}

// ─── updateEmployeeAction ─────────────────────────────────────────────────────

export async function updateEmployeeAction(
  id: string,
  input: UpdateEmployeeInput
): Promise<ActionResult<EmployeeRecord>> {
  try {
    const employee = await updateEmployee(id, input)
    return ok(employee)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getEmployeeListAction ────────────────────────────────────────────────────

export async function getEmployeeListAction(
  options: EmployeeListOptions
): Promise<ActionResult<PaginatedEmployeeList>> {
  try {
    const list = await getEmployeeList(options)
    return ok(list)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getEmployeeByIdAction ────────────────────────────────────────────────────

export async function getEmployeeByIdAction(
  id: string
): Promise<ActionResult<EmployeeRecord>> {
  try {
    const employee = await getEmployeeById(id)
    return ok(employee)
  } catch (e) {
    return handleError(e)
  }
}

// ─── getEmployeeWageHistoryAction ─────────────────────────────────────────────

export async function getEmployeeWageHistoryAction(
  employeeId: string
): Promise<ActionResult<WageHistoryEntry[]>> {
  try {
    const history = await getEmployeeWageHistory(employeeId)
    return ok(history)
  } catch (e) {
    return handleError(e)
  }
}
