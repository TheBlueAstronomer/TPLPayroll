import prisma from '@/lib/prisma'
import type { AuditLogListOptions, PaginatedAuditLogList, AuditLogRecord } from '../types/audit-log.types'

export async function getAuditLogs(options: AuditLogListOptions = {}): Promise<PaginatedAuditLogList> {
  const page = options.page ?? 1
  const limit = options.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (options.entityType) where.entityType = options.entityType
  if (options.actionType) where.actionType = options.actionType

  const [totalCount, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return {
    logs: rows as AuditLogRecord[],
    totalCount,
    page,
    limit,
  }
}
