import { AppShell } from '@/components/layout/AppShell'
import { AttendanceUploadClient } from '@/features/attendance-upload/components/AttendanceUploadClient'
import type { InitialDialogState } from '@/features/attendance-upload/components/AttendanceUploadClient'
import { getAttendanceUploadsAction } from '@/features/attendance-upload/actions/attendance.actions'
import { resumeAttendanceUploadSessionAction } from '@/features/attendance-upload/actions/session.actions'

export const dynamic = 'force-dynamic'


export const metadata = {
  title: 'Attendance Upload — TPL Payroll',
}

interface Props {
  searchParams: Promise<{ resumeSession?: string; newEmployeeId?: string }>
}

export default async function AttendancePage({ searchParams }: Props) {
  const { resumeSession, newEmployeeId } = await searchParams

  const result = await getAttendanceUploadsAction()
  const uploads = result.ok ? result.data : []

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Attendance Upload
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload weekly attendance files to prepare for payroll generation.
        </p>
      </div>

      <AttendanceUploadClient
        initialUploads={uploads}
        initialDialogState={initialDialogState}
      />
    </AppShell>
  )
}
