import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PayrollWeekList } from '@/features/payroll-generation/components/PayrollWeekList'

export const dynamic = 'force-dynamic'


export const metadata = {
  title: 'Payroll Generation — TPL Payroll',
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-lg skeleton-shimmer" />
      ))}
    </div>
  )
}

export default function PayrollPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Payroll Generation</h1>
        <Suspense fallback={<TableSkeleton />}>
          <PayrollWeekList />
        </Suspense>
      </div>
    </AppShell>
  )
}
