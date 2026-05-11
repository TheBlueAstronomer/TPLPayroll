import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PayrollGenerateFlow } from '@/features/payroll-generation/components/PayrollGenerateFlow'

interface Props {
  params: Promise<{ weekId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { weekId } = await params
  return { title: `Generate Payroll — ${weekId} — TPL Payroll` }
}

export default async function PayrollGeneratePage({ params }: Props) {
  const { weekId } = await params

  // weekId is YYYY-MM-DD (week start ISO date)
  const weekStartDate = new Date(weekId + 'T00:00:00.000Z')
  if (isNaN(weekStartDate.getTime())) notFound()

  // Week ends 6 days after start (Thu–Wed window)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6)

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Generate Payroll</h1>
          <p className="mt-1 text-sm text-zinc-500">Week starting {weekId}</p>
        </div>
        <PayrollGenerateFlow weekStart={weekStartDate} weekEnd={weekEndDate} />
      </div>
    </AppShell>
  )
}
