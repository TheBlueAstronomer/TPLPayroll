import { notFound, redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { AdjustmentEditForm } from '@/features/payroll-adjustments/components/AdjustmentEditForm'
import { getAdjustmentDetail } from '@/features/payroll-adjustments/services/adjustment.service'
import { AdjustmentServiceError } from '@/features/payroll-adjustments/types/adjustment.types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const adj = await getAdjustmentDetail(id)
    return {
      title: `Edit Adjustment — ${adj.employeeName} — TPL Payroll`,
    }
  } catch {
    return { title: 'Edit Adjustment — TPL Payroll' }
  }
}

export default async function AdjustmentEditPage({ params }: Props) {
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

  // If the adjustment has already been approved or cancelled, editing makes no
  // sense — bounce back to the detail page where the read-only view is shown.
  const hasApprovedApp = adjustment.applications.some((a) => a.approvalStatus === 'APPROVED')
  if (adjustment.status !== 'ACTIVE' || hasApprovedApp) {
    redirect(`/adjustments/${id}`)
  }

  return (
    <AppShell>
      <AdjustmentEditForm adjustment={adjustment} />
    </AppShell>
  )
}
