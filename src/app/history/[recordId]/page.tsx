import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PayrollRecordDetailView } from '@/features/payroll-history/components/PayrollRecordDetailView'
import { getPayrollRecordDetail } from '@/features/payroll-history/services/payroll-history.service'

interface PageProps {
  params: Promise<{ recordId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { recordId } = await params
  try {
    const record = await getPayrollRecordDetail(recordId)
    return {
      title: `${record.employeeName} — Payroll History`,
      description: `Historical payroll record for ${record.employeeName}`,
    }
  } catch {
    return { title: 'Payroll History Detail' }
  }
}

export default async function PayrollHistoryDetailPage({ params }: PageProps) {
  const { recordId } = await params
  let record

  try {
    record = await getPayrollRecordDetail(recordId)
  } catch (e) {
    notFound()
  }

  return (
    <AppShell>
      <PayrollRecordDetailView record={record} />
    </AppShell>
  )
}
