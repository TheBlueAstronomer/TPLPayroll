import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { EmployeeProfile } from '@/features/employee-management/components/EmployeeProfile'
import { getEmployeeById, getEmployeeWageHistory } from '@/features/employee-management/services/employee.service'
import { EmployeeServiceError } from '@/features/employee-management/types/employee.types'

export const dynamic = 'force-dynamic'


interface EmployeeProfilePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EmployeeProfilePageProps) {
  const { id } = await params
  try {
    const employee = await getEmployeeById(id)
    return {
      title: `${employee.employeeName} — TPL Payroll`,
      description: `Employee profile for ${employee.employeeName} (${employee.employeeId})`,
    }
  } catch {
    return { title: 'Employee — TPL Payroll' }
  }
}

export default async function EmployeeProfilePage({ params }: EmployeeProfilePageProps) {
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

  return (
    <AppShell>
      <EmployeeProfile employee={employee} wageHistory={wageHistory} />
    </AppShell>
  )
}
