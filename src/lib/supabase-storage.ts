/**
 * supabase-storage.ts
 *
 * Server-side only. Thin wrapper around the Supabase Storage REST API
 * using the service role key — no SDK dependency.
 *
 * ⚠️  Never import this in client components or expose SUPABASE_SERVICE_ROLE_KEY
 *     to the browser.
 */

const STORAGE_URL = `${process.env.SUPABASE_URL}/storage/v1`
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function authHeader() {
  return {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: SERVICE_KEY,
  }
}

// ─── createPresignedUploadUrl ─────────────────────────────────────────────────
// Returns a signed URL the browser can PUT the file to directly.
// The browser upload never touches Vercel — it goes straight to Supabase Storage.

export interface PresignedUploadUrl {
  signedUrl: string
  storageKey: string // path within the bucket, e.g. "attendance/uuid_filename.xlsx"
  token: string
}

export async function createPresignedUploadUrl(
  bucket: string,
  storageKey: string,
  expiresIn = 300 // seconds — 5 minutes is plenty for a direct browser PUT
): Promise<PresignedUploadUrl> {
  const res = await fetch(
    `${STORAGE_URL}/object/upload/sign/${bucket}/${storageKey}`,
    {
      method: 'POST',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create presigned upload URL: ${res.status} ${body}`)
  }

  const data = (await res.json()) as { signedURL: string; token: string }

  // Supabase returns a relative path — construct the full URL
  const signedUrl = data.signedURL.startsWith('http')
    ? data.signedURL
    : `${process.env.SUPABASE_URL}${data.signedURL}`

  return { signedUrl, storageKey, token: data.token }
}

// ─── downloadFileAsBuffer ─────────────────────────────────────────────────────
// Server-side download of a file from Storage.

export async function downloadFileAsBuffer(
  bucket: string,
  storageKey: string
): Promise<Buffer> {
  const res = await fetch(`${STORAGE_URL}/object/${bucket}/${storageKey}`, {
    headers: authHeader(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(
      `Failed to download file from Storage [${bucket}/${storageKey}]: ${res.status} ${body}`
    )
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── deleteFile ───────────────────────────────────────────────────────────────
// Best-effort delete — logs but does not throw on failure.

export async function deleteFile(
  bucket: string,
  storageKey: string
): Promise<void> {
  const res = await fetch(`${STORAGE_URL}/object/${bucket}/${storageKey}`, {
    method: 'DELETE',
    headers: authHeader(),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(
      `[supabase-storage] Failed to delete [${bucket}/${storageKey}]: ${res.status} ${body}`
    )
  }
}

// ─── fileExists ───────────────────────────────────────────────────────────────
// HEAD request — check whether a key exists without downloading the file.

export async function fileExists(
  bucket: string,
  storageKey: string
): Promise<boolean> {
  const res = await fetch(`${STORAGE_URL}/object/info/${bucket}/${storageKey}`, {
    method: 'GET',
    headers: authHeader(),
  })
  return res.ok
}

// ─── STORAGE_BUCKET ──────────────────────────────────────────────────────────
// Single source of truth for the bucket name.
export const ATTENDANCE_BUCKET = 'attendance-files'
