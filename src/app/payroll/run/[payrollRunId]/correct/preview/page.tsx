import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getRevisionEmployees, getRevisionHistory } from '@/features/payroll-correction/services/correction.service'
import { RevisedPreview } from '@/features/payroll-correction/components/RevisedPreview'

interface Props {
  params: Promise<{ payrollRunId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { payrollRunId } = await params
  return { title: `Revised Payroll Preview — ${payrollRunId} — TPL Payroll` }
}

function formatWeekRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`
}

export default async function RevisedPreviewPage({ params }: Props) {
  const { payrollRunId } = await params

  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      revisions: {
        orderBy: { revisionNumber: 'desc' },
        take: 2,
      },
    },
  })

  if (!run) notFound()

  const currentRevision = run.revisions.find((r) => r.isCurrent)
  const previousRevision = run.revisions.find((r) => !r.isCurrent)

  if (!currentRevision) notFound()

  const weekLabel = formatWeekRange(run.payrollWeekStartDate, run.payrollWeekEndDate)

  // Fetch employee data with diffs
  const employees = await getRevisionEmployees(
    currentRevision.id,
    previousRevision?.id,
  )

  // Current totals
  const totals = {
    totalRegularHours: employees.reduce((s, e) => s + e.regularHours, 0),
    totalOvertimeHours: employees.reduce((s, e) => s + e.overtimeHours, 0),
    totalRegularPay: Number(currentRevision.totalRegularPay),
    totalOvertimePay: Number(currentRevision.totalOvertimePay),
    totalAdditions: Number(currentRevision.totalAdditions),
    totalDeductions: Number(currentRevision.totalDeductions),
    totalNetPayable: Number(currentRevision.totalNetPayable),
  }

  // Previous totals for diff display
  const previousTotals = previousRevision
    ? {
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalRegularPay: Number(previousRevision.totalRegularPay),
        totalOvertimePay: Number(previousRevision.totalOvertimePay),
        totalAdditions: Number(previousRevision.totalAdditions),
        totalDeductions: Number(previousRevision.totalDeductions),
        totalNetPayable: Number(previousRevision.totalNetPayable),
      }
    : null

  return (
    <RevisedPreview
      payrollRunId={payrollRunId}
      revisionId={currentRevision.id}
      revisionNumber={currentRevision.revisionNumber}
      weekLabel={weekLabel}
      employees={employees}
      totals={totals}
      previousTotals={previousTotals}
    />
  )
}
