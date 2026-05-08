import { AppShell } from '@/components/layout/AppShell'
import { EmployeeListTable } from '@/features/employee-management/components/EmployeeListTable'

export const metadata = {
  title: 'Team Directory — TPL Payroll',
  description: 'Browse, search, and manage all employee records.',
}

export default function EmployeesPage() {
  return (
    <AppShell>
      <EmployeeListTable />
    </AppShell>
  )
}
