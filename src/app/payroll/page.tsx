import { AppShell } from '@/components/layout/AppShell'

export const metadata = {
  title: 'Payroll — TPL Payroll',
}

export default function PayrollPage() {
  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
        Payroll Generation
      </h1>
      <p className="mt-4 text-sm text-zinc-400">Coming soon — F06 implementation.</p>
    </AppShell>
  )
}
