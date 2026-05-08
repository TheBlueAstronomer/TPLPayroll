import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { generateExportWorkbook } from '@/features/employee-import-export/services/export.service'

export async function GET() {
  try {
    const workbook = await generateExportWorkbook()
    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as ArrayBuffer)

    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10)
    const filename = `employee-master-${dateStr}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
