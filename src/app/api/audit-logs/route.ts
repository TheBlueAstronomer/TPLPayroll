import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs } from '@/features/audit-logging/services/audit-log.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') as 'EMPLOYEE' | 'WAGE_HISTORY' | null
    const actionType = searchParams.get('actionType') as 'CREATE' | 'UPDATE' | null
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20

    const result = await getAuditLogs({
      ...(entityType && { entityType }),
      ...(actionType && { actionType }),
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
