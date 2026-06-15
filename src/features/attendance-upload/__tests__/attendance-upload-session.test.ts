import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import prisma from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// TDD: Integration tests for the AttendanceUploadSession service.
//
// These tests are written RED-first (the service does not yet exist). They lock
// in the contract that PRD §1 (Session persistence for cross-navigation state)
// requires. The implementing agent should make them pass without changing the
// expectations.
//
// Pattern reference: upload.service.test.ts, employee-matcher.test.ts.
//
// Module under test (to be created):
//   src/features/attendance-upload/services/attendance-upload-session.service.ts
//
//   export async function createAttendanceUploadSession(input): Promise<{ id: string }>
//   export async function loadAttendanceUploadSession(token: string)
//   export async function resumeAttendanceUploadSession(token, newEmployeeId)
// ─────────────────────────────────────────────────────────────────────────────

// Dynamic import so the test file still loads even before the service exists.
async function loadService() {
  return await import(
    '@/features/attendance-upload/services/attendance-upload-session.service'
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AttendanceUploadSessionRow = {
  id: string
  storageKey: string
  fileName: string
  fileType: string
  weekStart: string
  weekEnd: string
  weekSource: string
  decisionsJson: string
  pendingBlockKey: string
  expiresAt: Date
  createdAt: Date
}

interface CreateSessionInput {
  storageKey: string
  fileName: string
  fileType: string
  weekStart: string
  weekEnd: string
  weekSource: string
  decisions: {
    verificationDecisions: Record<string, 'APPROVED' | 'REJECTED'>
    manualMatchDecisions: Record<string, string>
    rejectedBlockKeys: string[]
  }
  pendingBlockKey: string
}

function makeCreateInput(
  overrides: Partial<CreateSessionInput> = {}
): CreateSessionInput {
  return {
    storageKey: 'attendance/upload-abc-uuid.xlsx',
    fileName: 'attendance.xlsx',
    fileType: 'xlsx',
    weekStart: '2025-03-06',
    weekEnd: '2025-03-12',
    weekSource: 'MANUAL',
    decisions: {
      verificationDecisions: {},
      manualMatchDecisions: {},
      rejectedBlockKeys: [],
    },
    pendingBlockKey: 'Sheet1||0',
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AttendanceUploadSession service', () => {
  // We use an in-memory store + spies on prisma.attendanceUploadSession.* so the
  // service can be tested without a live DB (mirrors upload.service.test.ts).
  let store: Map<string, AttendanceUploadSessionRow>
  let nowMs: number

  beforeEach(() => {
    store = new Map()
    nowMs = new Date('2026-05-11T12:00:00Z').getTime()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(nowMs))

    const sessionDelegate = {
      create: vi.fn(async ({ data }: { data: AttendanceUploadSessionRow }) => {
        store.set(data.id, data)
        return data
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return store.get(where.id) ?? null
      }),
      deleteMany: vi.fn(
        async ({ where }: { where: { expiresAt: { lt: Date } } }) => {
          let count = 0
          for (const [id, row] of store) {
            if (row.expiresAt < where.expiresAt.lt) {
              store.delete(id)
              count++
            }
          }
          return { count }
        }
      ),
    }

    // @ts-expect-error: model may not exist on the generated client yet
    prisma.attendanceUploadSession = sessionDelegate
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── Test 1 — create returns a valid token ─────────────────────────────────
  it('createAttendanceUploadSession returns a non-empty token (UUID-shaped id)', async () => {
    const { createAttendanceUploadSession } = await loadService()
    const input = makeCreateInput()

    const result = await createAttendanceUploadSession(input)

    expect(result).toHaveProperty('id')
    expect(typeof result.id).toBe('string')
    expect(result.id.length).toBeGreaterThan(0)
    // The stored row must have been written
    expect(store.size).toBe(1)
    const stored = Array.from(store.values())[0]
    expect(stored.storageKey).toBe(input.storageKey)
    expect(stored.pendingBlockKey).toBe(input.pendingBlockKey)
    // Decisions must be serialised to JSON string
    expect(() => JSON.parse(stored.decisionsJson)).not.toThrow()
    // expiresAt must be ~30 minutes in the future (PRD §1: createdAt + 30 min)
    const ttlMs = stored.expiresAt.getTime() - nowMs
    expect(ttlMs).toBeGreaterThan(29 * 60 * 1000)
    expect(ttlMs).toBeLessThanOrEqual(30 * 60 * 1000 + 1000)
  })

  // ── Test 2 — load before expiry succeeds ─────────────────────────────────
  it('loadAttendanceUploadSession returns the session before it expires', async () => {
    const { createAttendanceUploadSession, loadAttendanceUploadSession } =
      await loadService()
    const { id } = await createAttendanceUploadSession(makeCreateInput())

    // Advance just inside the 30-minute window
    vi.setSystemTime(new Date(nowMs + 25 * 60 * 1000))

    const loaded = await loadAttendanceUploadSession(id)

    expect(loaded).not.toBeNull()
    expect(loaded!.id).toBe(id)
    expect(loaded!.storageKey).toBe('attendance/upload-abc-uuid.xlsx')
    expect(loaded!.pendingBlockKey).toBe('Sheet1||0')
    // Decisions must be parsed back into an object
    expect(loaded!.decisions).toEqual({
      verificationDecisions: {},
      manualMatchDecisions: {},
      rejectedBlockKeys: [],
    })
  })

  // ── Test 3 — load after expiry returns null ──────────────────────────────
  it('loadAttendanceUploadSession returns null after the session has expired', async () => {
    const { createAttendanceUploadSession, loadAttendanceUploadSession } =
      await loadService()
    const { id } = await createAttendanceUploadSession(makeCreateInput())

    // Jump past 30 minutes
    vi.setSystemTime(new Date(nowMs + 31 * 60 * 1000))

    const loaded = await loadAttendanceUploadSession(id)

    expect(loaded).toBeNull()
  })

  // ── Test 4 — load non-existent token returns null ────────────────────────
  it('loadAttendanceUploadSession returns null for an unknown token', async () => {
    const { loadAttendanceUploadSession } = await loadService()

    const loaded = await loadAttendanceUploadSession(
      'does-not-exist-token-uuid'
    )

    expect(loaded).toBeNull()
  })

  // ── Test 5 — resumeSession overlays decisions correctly ──────────────────
  it('resumeAttendanceUploadSession preserves prior verification + manual-match + rejection decisions', async () => {
    const {
      createAttendanceUploadSession,
      resumeAttendanceUploadSession,
    } = await loadService()

    const input = makeCreateInput({
      pendingBlockKey: 'Sheet1||2',
      decisions: {
        verificationDecisions: { 'emp-inactive-1': 'APPROVED' },
        manualMatchDecisions: { 'Sheet1||5': 'emp-real-1' },
        rejectedBlockKeys: ['Sheet1||7'],
      },
    })
    const { id } = await createAttendanceUploadSession(input)

    const resumed = await resumeAttendanceUploadSession(id, 'new-employee-9')

    expect(resumed).not.toBeNull()
    // Prior decisions remain intact
    expect(resumed!.decisions.verificationDecisions).toEqual({
      'emp-inactive-1': 'APPROVED',
    })
    expect(resumed!.decisions.manualMatchDecisions['Sheet1||5']).toBe(
      'emp-real-1'
    )
    expect(resumed!.decisions.rejectedBlockKeys).toContain('Sheet1||7')
  })

  // ── Test 6 — resumeSession links new employee to the pending block key ───
  it('resumeAttendanceUploadSession links the newly-created employee to the pendingBlockKey row', async () => {
    const { createAttendanceUploadSession, resumeAttendanceUploadSession } =
      await loadService()

    const { id } = await createAttendanceUploadSession(
      makeCreateInput({
        pendingBlockKey: 'Sheet1||3',
        decisions: {
          verificationDecisions: {},
          manualMatchDecisions: { 'Sheet1||1': 'emp-existing' },
          rejectedBlockKeys: [],
        },
      })
    )

    const resumed = await resumeAttendanceUploadSession(id, 'new-employee-42')

    expect(resumed).not.toBeNull()
    // The pendingBlockKey row must now be linked to the new employee id
    expect(resumed!.decisions.manualMatchDecisions['Sheet1||3']).toBe(
      'new-employee-42'
    )
    // The previously-existing manual match must remain
    expect(resumed!.decisions.manualMatchDecisions['Sheet1||1']).toBe(
      'emp-existing'
    )
  })

  // ── Bonus — resumeSession returns null for expired/missing tokens ────────
  it('resumeAttendanceUploadSession returns null when the session is missing or expired', async () => {
    const { createAttendanceUploadSession, resumeAttendanceUploadSession } =
      await loadService()

    const { id } = await createAttendanceUploadSession(makeCreateInput())
    vi.setSystemTime(new Date(nowMs + 60 * 60 * 1000)) // 1 hour later → expired

    expect(await resumeAttendanceUploadSession(id, 'new-emp')).toBeNull()
    expect(await resumeAttendanceUploadSession('unknown', 'new-emp')).toBeNull()
  })
})
