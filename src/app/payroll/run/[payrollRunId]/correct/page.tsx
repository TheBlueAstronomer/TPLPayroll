import { notFound } from 'next/navigation'
import { initiateCorrection } from '@/features/payroll-correction/services/correction.service'
import { CorrectionFlow } from '@/features/payroll-correction/components/CorrectionFlow'
import { CorrectionServiceError } from '@/features/payroll-correction/types/correction.types'
import { AppShell } from '@/components/layout/AppShell'
import { resumeAttendanceUploadSessionAction } from '@/features/attendance-upload/actions/session.actions'
import type { InitialDialogState } from '@/features/attendance-upload/components/AttendanceUploadClient'

export const dynamic = 'force-dynamic'


interface Props {
  params: Promise<{ payrollRunId: string }>
  searchParams: Promise<{ resumeSession?: string; newEmployeeId?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { payrollRunId } = await params
  return { title: `Correct Payroll — ${payrollRunId} — TPL Payroll` }
}

function formatWeekRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`
}

export default async function PayrollCorrectionPage({ params, searchParams }: Props) {
  const { payrollRunId } = await params
  const { resumeSession, newEmployeeId } = await searchParams

  let data
  try {
    data = await initiateCorrection(payrollRunId)
  } catch (e) {
    if (e instanceof CorrectionServiceError) {
      if (e.code === 'PAYROLL_RUN_NOT_FOUND') notFound()
      if (e.code === 'CANNOT_CORRECT_UNAPPROVED_PAYROLL') {
        return (
          <AppShell>
            <main className="mx-auto max-w-4xl px-4 py-12">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Cannot Correct Payroll
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                This payroll run has not been approved yet and cannot be corrected.
              </p>
            </main>
          </AppShell>
        )
      }
    }
    throw e
  }

  const weekLabel = `Week ${formatWeekRange(data.weekStart, data.weekEnd)}`

  let initialDialogState: InitialDialogState | null = null
  if (resumeSession) {
    const resumeResult = await resumeAttendanceUploadSessionAction(
      resumeSession,
      newEmployeeId ?? ''
    )
    if (resumeResult.ok) {
      const d = resumeResult.data
      initialDialogState = {
        records: d.records,
        summary: d.summary,
        payrollWeekStartDate: d.payrollWeekStartDate,
        payrollWeekEndDate: d.payrollWeekEndDate,
        payrollWeekSource: d.payrollWeekSource,
        tempFilePath: d.tempFilePath,
        fileName: d.fileName,
        fileType: d.fileType,
        dialogState: {
          verificationDecisions: d.verificationDecisions,
          manualMatchDecisions: d.manualMatchDecisions,
          rejectedBlockKeys: d.rejectedBlockKeys,
        },
      }
    }
  }

  return (
    <AppShell>
      <CorrectionFlow data={data} weekLabel={weekLabel} initialDialogState={initialDialogState} />
    </AppShell>
  )
}
