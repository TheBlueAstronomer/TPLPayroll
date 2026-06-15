import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import type { AttendanceUploadSession } from '@prisma/client'
import type {
  PayrollWeekSource,
  VerificationDecision,
} from '@/features/attendance-upload/types/attendance.types'

export const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes

export interface SessionDecisions {
  verificationDecisions: Record<string, VerificationDecision>
  manualMatchDecisions: Record<string, string>
  rejectedBlockKeys: string[]
}

export interface CreateUploadSessionParams {
  storageKey: string // Supabase Storage key (replaces tempFilePath)
  fileName: string
  fileType: string
  weekStart: string // YYYY-MM-DD
  weekEnd: string // YYYY-MM-DD
  weekSource: PayrollWeekSource
  decisions: SessionDecisions
  pendingBlockKey: string
  now?: Date
}

export async function createUploadSession(
  params: CreateUploadSessionParams
): Promise<AttendanceUploadSession> {
  const now = params.now ?? new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)

  // Fire-and-forget inline prune of expired sessions
  void pruneExpiredSessions(now).catch((err) => {
    console.error('Failed to prune expired upload sessions:', err)
  })

  return prisma.attendanceUploadSession.create({
    data: {
      id: randomUUID(),
      storageKey: params.storageKey,
      fileName: params.fileName,
      fileType: params.fileType,
      weekStart: params.weekStart,
      weekEnd: params.weekEnd,
      weekSource: params.weekSource,
      decisionsJson: JSON.stringify(params.decisions),
      pendingBlockKey: params.pendingBlockKey,
      expiresAt,
      createdAt: now,
    },
  })
}

export interface LoadedUploadSession {
  id: string
  storageKey: string
  fileName: string
  fileType: string
  weekStart: string
  weekEnd: string
  weekSource: PayrollWeekSource
  decisions: SessionDecisions
  pendingBlockKey: string
  expiresAt: Date
  createdAt: Date
}

export async function loadUploadSession(
  id: string,
  now: Date = new Date()
): Promise<LoadedUploadSession | null> {
  const row = await prisma.attendanceUploadSession.findUnique({
    where: { id },
  })
  if (!row) return null
  if (row.expiresAt.getTime() <= now.getTime()) return null

  let decisions: SessionDecisions
  try {
    decisions = JSON.parse(row.decisionsJson) as SessionDecisions
  } catch {
    decisions = {
      verificationDecisions: {},
      manualMatchDecisions: {},
      rejectedBlockKeys: [],
    }
  }

  return {
    id: row.id,
    storageKey: row.storageKey,
    fileName: row.fileName,
    fileType: row.fileType,
    weekStart: row.weekStart,
    weekEnd: row.weekEnd,
    weekSource: row.weekSource as PayrollWeekSource,
    decisions,
    pendingBlockKey: row.pendingBlockKey,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }
}

export async function expireUploadSession(id: string): Promise<void> {
  await prisma.attendanceUploadSession
    .delete({ where: { id } })
    .catch(() => {}) // ignore if already gone
}

export async function pruneExpiredSessions(now: Date = new Date()): Promise<number> {
  const result = await prisma.attendanceUploadSession.deleteMany({
    where: { expiresAt: { lt: now } },
  })
  return result.count
}
