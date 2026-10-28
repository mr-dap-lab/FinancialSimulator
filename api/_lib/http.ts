import type { ApiErrorBody, BankErrorCode } from '../../src/lib/bankTypes.js'

const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  // Everything here is per-user and some of it is bank data.
  'cache-control': 'no-store',
}

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...headers } })
}

export function apiError(
  status: number,
  code: BankErrorCode,
  message: string,
  retryAfter?: number,
): Response {
  const body: ApiErrorBody = { error: { code, message, ...(retryAfter ? { retryAfter } : {}) } }
  return json(status, body, retryAfter ? { 'retry-after': String(retryAfter) } : {})
}

/** Parses a JSON body, or `null` when it is missing, malformed or not an object. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json()
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
