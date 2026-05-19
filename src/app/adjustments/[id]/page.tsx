import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { AdjustmentDetail } from '@/features/payroll-adjustments/components/AdjustmentDetail'
import {
  getAdjustmentDetail,
} from '@/features/payroll-adjustments/services/adjustment.service'
import { AdjustmentServiceError } from '@/features/payroll-adjustments/types/adjustment.types'

export const dynamic = 'force-dynamic'


interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const adj = await getAdjustmentDetail(id)
    return {
      title: `Adjustment — ${adj.employeeName} — TPL Payroll`,
    }
  } catch {
    return { title: 'Adjustment — TPL Payroll' }
  }
}

export default async function AdjustmentDetailPage({ params }: Props) {
  const { id } = await params

  let adjustment
  try {
    adjustment = await getAdjustmentDetail(id)
  } catch (e) {
    if (e instanceof AdjustmentServiceError && e.code === 'ADJUSTMENT_NOT_FOUND') {
      notFound()
    }
    throw e
  }

  return (
    <AppShell>
      <AdjustmentDetail adjustment={adjustment} />
    </AppShell>
  )
}
