import { createHash, randomUUID } from 'node:crypto'
import { Auditor } from './audit.js'
import { ConfigError, getDeps } from './deps.js'
import type { AuthenticatedUser, Deps } from './deps.js'
import { apiError } from './http.js'

export interface RequestContext {
  user: AuthenticatedUser
  auditor: Auditor
  requestId: string
}

export type AuthedHandler = (deps: Deps, ctx: RequestContext, request: Request) => Promise<Response>

function hashIp(request: Request, salt: string | null): string | null {
  if (!salt) return null
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || request.headers.get('x-real-ip')
  return ip ? createHash('sha256').update(`${salt}:${ip}`).digest('hex') : null
}

/**
 * Wraps a handler with: configuration check, bearer-token authentication, the
 * per-request audit context, and a last-resort error boundary that never leaks
 * internals (and never logs the request body, which can hold a bank password).
 *
 * `deps` is injectable so the wrapper itself is testable without Supabase.
 */
export async function withUser(
  request: Request,
  handler: AuthedHandler,
  deps?: Deps,
): Promise<Response> {
  try {
    const resolved = deps ?? getDeps()

    const header = request.headers.get('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
    if (!token) return apiError(401, 'unauthorized', 'Sign in to continue.')

    const user = await resolved.verifyToken(token)
    if (!user) return apiError(401, 'unauthorized', 'Your session has expired. Sign in again.')

    const requestId = randomUUID()
    const auditor = new Auditor(resolved.db, {
      userId: user.id,
      requestId,
      ipHash: hashIp(request, resolved.config.auditIpSalt),
      userAgent: request.headers.get('user-agent')?.slice(0, 200) ?? null,
    })

    return await handler(resolved, { user, auditor, requestId }, request)
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`[api] not configured: ${error.message}`)
      return apiError(503, 'not_configured', 'Bank connections are not configured on this server.')
    }
    console.error('[api] unexpected error:', error instanceof Error ? error.message : 'unknown error')
    return apiError(500, 'internal_error', 'Something went wrong.')
  }
}
