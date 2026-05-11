import { NextResponse } from 'next/server'
import { generatePayrollSummaryPdf } from '@/features/payroll-reports/services/report.service'
import { ReportServiceError } from '@/features/payroll-reports/types/report.types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ payrollRunId: string }> }
) {
  const { payrollRunId } = await params

  try {
    const { buffer, fileName } = await generatePayrollSummaryPdf(payrollRunId)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (e) {
    console.error('PDF Generation Error:', e)
    if (e instanceof ReportServiceError) {
      const status = e.code === 'PAYROLL_RUN_NOT_FOUND' ? 404 : 400
      return NextResponse.json({ error: e.message, code: e.code }, { status })
    }
    return NextResponse.json({ error: 'Report generation failed', message: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined }, { status: 500 })
  }
}
