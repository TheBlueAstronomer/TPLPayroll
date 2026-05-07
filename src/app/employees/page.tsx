import { AppShell } from '@/components/layout/AppShell'

export const metadata = {
  title: 'Employees — TPL Payroll',
}

export default function EmployeesPage() {
  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
        Employee Management
      </h1>
      <p className="mt-4 text-sm text-zinc-400">Coming soon — F02 implementation.</p>
    </AppShell>
  )
}
