export type AuditLogRecord = {
  id: string
  actionType: 'CREATE' | 'UPDATE'
  entityType: 'EMPLOYEE' | 'WAGE_HISTORY'
  entityId: string
  detailsJson: Record<string, unknown>
  createdAt: Date
}

export type AuditLogListOptions = {
  entityType?: 'EMPLOYEE' | 'WAGE_HISTORY'
  actionType?: 'CREATE' | 'UPDATE'
  page?: number
  limit?: number
}

export type PaginatedAuditLogList = {
  logs: AuditLogRecord[]
  totalCount: number
  page: number
  limit: number
}
