import { AppShell } from '@/components/layout/AppShell'
import { EmployeeForm } from '@/features/employee-management/components/EmployeeForm'
import { getAttendanceUploadSessionAction } from '@/features/attendance-upload/actions/session.actions'

export const metadata = {
  title: 'Add Employee — TPL Payroll',
  description: 'Create a new employee record in the master database.',
}

interface Props {
  searchParams: Promise<{ attendanceSession?: string }>
}

export default async function NewEmployeePage({ searchParams }: Props) {
  const { attendanceSession } = await searchParams

  let returnContext: { sessionId: string; sheetEmployeeName: string } | undefined
  if (attendanceSession) {
    const result = await getAttendanceUploadSessionAction(attendanceSession)
    if (result.ok && result.data) {
      returnContext = {
        sessionId: attendanceSession,
        sheetEmployeeName: result.data.pendingSheetEmployeeName,
      }
    }
  }

  return (
    <AppShell>
      <EmployeeForm mode="create" returnContext={returnContext} />
    </AppShell>
  )
}
