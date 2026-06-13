// Public-facing AttendanceUploadSession service.
// PRD §1 Session persistence for cross-navigation state.
//
// Wraps the underlying upload-session.service with the names the rest of the
// feature uses (create/load/resume).

import {
  createUploadSession,
  loadUploadSession,
  type SessionDecisions,
  type LoadedUploadSession,
} from './upload-session.service'

export type { SessionDecisions, LoadedUploadSession }

export interface CreateAttendanceUploadSessionInput {
  storageKey: string // Supabase Storage key (replaces tempFilePath)
  fileName: string
  fileType: string
  weekStart: string
  weekEnd: string
  weekSource: string
  decisions: SessionDecisions
  pendingBlockKey: string
}

export async function createAttendanceUploadSession(
  input: CreateAttendanceUploadSessionInput
): Promise<{ id: string }> {
  const session = await createUploadSession({
    storageKey: input.storageKey,
    fileName: input.fileName,
    fileType: input.fileType,
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    weekSource: input.weekSource as LoadedUploadSession['weekSource'],
    decisions: input.decisions,
    pendingBlockKey: input.pendingBlockKey,
  })
  return { id: session.id }
}

export async function loadAttendanceUploadSession(
  token: string
): Promise<LoadedUploadSession | null> {
  return loadUploadSession(token)
}

export interface ResumedSessionState {
  id: string
  storageKey: string // Supabase Storage key (replaces tempFilePath)
  fileName: string
  fileType: string
  weekStart: string
  weekEnd: string
  weekSource: string
  pendingBlockKey: string
  decisions: SessionDecisions
}

// Overlays the new employee id onto the pending block key.
// Returns null for missing or expired sessions.
export async function resumeAttendanceUploadSession(
  token: string,
  newEmployeeId: string
): Promise<ResumedSessionState | null> {
  const session = await loadUploadSession(token)
  if (!session) return null

  const decisions: SessionDecisions = {
    verificationDecisions: { ...session.decisions.verificationDecisions },
    manualMatchDecisions: {
      ...session.decisions.manualMatchDecisions,
      [session.pendingBlockKey]: newEmployeeId,
    },
    rejectedBlockKeys: [...session.decisions.rejectedBlockKeys],
  }

  return {
    id: session.id,
    storageKey: session.storageKey,
    fileName: session.fileName,
    fileType: session.fileType,
    weekStart: session.weekStart,
    weekEnd: session.weekEnd,
    weekSource: session.weekSource,
    pendingBlockKey: session.pendingBlockKey,
    decisions,
  }
}
