import { AppShell } from '@/components/layout/AppShell'
import { AdjustmentForm } from '@/features/payroll-adjustments/components/AdjustmentForm'

export const metadata = {
  title: 'New Adjustment — TPL Payroll',
}

export default function NewAdjustmentPage() {
  return (
    <AppShell>
      <AdjustmentForm />
    </AppShell>
  )
}
