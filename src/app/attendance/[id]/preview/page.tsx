import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { AttendancePreviewClient } from '@/features/attendance-upload/components/AttendancePreviewClient'
import { getAttendanceUploadPreviewAction } from '@/features/attendance-upload/actions/attendance.actions'
import prisma from '@/lib/prisma'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Attendance Preview ${id} — TPL Payroll` }
}

export default async function AttendancePreviewPage({ params }: Props) {
  const { id } = await params
  const result = await getAttendanceUploadPreviewAction(id)

  if (!result.ok) notFound()

  const { data } = result
  const { upload, records } = data

  const total = records.length
  const matched = records.filter(r => (r as any).matchStatus === 'MATCHED').length
  const unmatched = records.filter(r => (r as any).matchStatus === 'UNMATCHED').length
  const errors = records.filter(r => (r as any).matchStatus === 'INACTIVE' || (r as any).matchStatus === 'RESIGNED_BEFORE_WEEK').length

  // Determine blocking status from the upload record
  const uploadRecord = await prisma.attendanceUpload.findUnique({
    where: { id },
    select: { status: true },
  })

  const actuallyBlocked = uploadRecord?.status !== 'READY'

  return (
    <AppShell>
      <AttendancePreviewClient
        data={data}
        isBlocked={actuallyBlocked}
        total={total}
        matched={matched}
        unmatched={unmatched}
        errors={errors}
        records={records as any}
      />
    </AppShell>
  )
}
