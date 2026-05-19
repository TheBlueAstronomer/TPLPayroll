import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { EmployeeForm } from '@/features/employee-management/components/EmployeeForm'
import { getEmployeeById, getEmployeeWageHistory } from '@/features/employee-management/services/employee.service'
import { EmployeeServiceError } from '@/features/employee-management/types/employee.types'

export const dynamic = 'force-dynamic'


interface EditEmployeePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditEmployeePageProps) {
  const { id } = await params
  try {
    const employee = await getEmployeeById(id)
    return {
      title: `Edit ${employee.employeeName} — TPL Payroll`,
    }
  } catch {
    return { title: 'Edit Employee — TPL Payroll' }
  }
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { id } = await params

  let employee
  let wageHistory

  try {
    ;[employee, wageHistory] = await Promise.all([
      getEmployeeById(id),
      getEmployeeWageHistory(id),
    ])
  } catch (e) {
    if (e instanceof EmployeeServiceError && e.code === 'EMPLOYEE_NOT_FOUND') {
      notFound()
    }
    throw e
  }

  const currentWage = wageHistory[0]

  return (
    <AppShell>
      <EmployeeForm
        mode="edit"
        employee={employee}
        currentSalary={currentWage?.weeklySalary}
        currentHourlyRate={currentWage?.hourlyRate}
      />
    </AppShell>
  )
}
