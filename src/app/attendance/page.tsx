import { AppShell } from '@/components/layout/AppShell'
import { AttendanceUploadClient } from '@/features/attendance-upload/components/AttendanceUploadClient'
import { getAttendanceUploadsAction } from '@/features/attendance-upload/actions/attendance.actions'

export const metadata = {
  title: 'Attendance Upload — TPL Payroll',
}

export default async function AttendancePage() {
  const result = await getAttendanceUploadsAction()
  const uploads = result.ok ? result.data : []

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

      <AttendanceUploadClient initialUploads={uploads} />
    </AppShell>
  )
}
