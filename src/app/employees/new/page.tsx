import { AppShell } from '@/components/layout/AppShell'
import { EmployeeForm } from '@/features/employee-management/components/EmployeeForm'

export const metadata = {
  title: 'Add Employee — TPL Payroll',
  description: 'Create a new employee record in the master database.',
}

export default function NewEmployeePage() {
  return (
    <AppShell>
      <EmployeeForm mode="create" />
    </AppShell>
  )
}
