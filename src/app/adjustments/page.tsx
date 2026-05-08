import { AppShell } from '@/components/layout/AppShell'
import { AdjustmentListTable } from '@/features/payroll-adjustments/components/AdjustmentListTable'

export const metadata = {
  title: 'Payroll Adjustments — TPL Payroll',
  description: 'Manage deductions and additions for employees.',
}

export default function AdjustmentsPage() {
  return (
    <AppShell>
      <AdjustmentListTable />
    </AppShell>
  )
}
