import { AppShell } from '@/components/layout/AppShell'

export const metadata = {
  title: 'Attendance — TPL Payroll',
}

export default function AttendancePage() {
  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
        Attendance Upload
      </h1>
      <p className="mt-4 text-sm text-zinc-400">Coming soon — F04 implementation.</p>
    </AppShell>
  )
}
