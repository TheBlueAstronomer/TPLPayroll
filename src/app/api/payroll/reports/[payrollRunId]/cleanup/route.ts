import { NextResponse } from 'next/server'
import { markInvoiceSnapshotsCleaned } from '@/features/payroll-reports/services/report.service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ payrollRunId: string }> },
) {
  const { payrollRunId } = await params

  try {
    await markInvoiceSnapshotsCleaned(payrollRunId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
