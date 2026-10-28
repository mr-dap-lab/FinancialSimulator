import type {
  AuditEvent,
  BankAccount,
  BankConnection,
  BankErrorCode,
  ConnectionStatus,
} from '../../src/lib/bankTypes.js'
import { CONSENT_ITEM_IDS, CONSENT_VERSION, getConsent, isLocale } from './consent.js'
import { CromaError } from './croma.js'
import type { CromaConnection } from './croma.js'
import type { ConnectionRow } from './db.js'
import type { Deps } from './deps.js'
import { IMPORT_FIELD_IDS } from './importFields.js'
import { apiError, json, readJsonObject } from './http.js'
import type { AuthedHandler, RequestContext } from './route.js'

const HOUR_MS = 60 * 60 * 1000
const AUDIT_PAGE_SIZE = 100

const AUDIT_UNAVAILABLE = () =>
  apiError(503, 'audit_unavailable', 'The audit trail is unavailable, so this action was not performed.')

function toPublicConnection(row: ConnectionRow, croma: CromaConnection | null, stale: boolean): BankConnection {
  return {
    id: row.id,
    displayName: row.display_name,
    status: row.status,
    createdAt: row.created_at,
    lastUsedAt: croma?.lastUsedAt ?? null,
    usage: croma?.usage ?? null,
    availableAgainAt: croma?.availableAgainAt ?? null,
    stale,
  }
}

const maskNumber = (number: string): string => `••••${number.slice(-4)}`

interface MappedFailure {
  status: number
  code: BankErrorCode
  message: string
  retryAfter?: number
}

/** What the user is told for each way registering can fail. Croma's own wording is never forwarded. */
function mapRegisterFailure(error: CromaError): MappedFailure & {
  event: 'connection.rejected' | 'connection.duplicate' | 'connection.limit_reached' | 'connection.failed'
} {
  if (error.code === 'connection_rejected') {
    return { status: 422, code: 'connection_rejected', message: 'The bank did not accept these credentials.', event: 'connection.rejected' }
  }
  if (error.code === 'connection_exists') {
    return { status: 409, code: 'connection_exists', message: 'This account is already connected.', event: 'connection.duplicate' }
  }
  if (error.code === 'connection_limit_reached') {
    return { status: 503, code: 'capacity_reached', message: 'No connection slots are available right now.', event: 'connection.limit_reached' }
  }
  if (error.status === 429) {
    return {
      status: 429,
      code: 'service_busy',
      message: 'The service is busy. Try again later.',
      retryAfter: error.retryAfter,
      event: 'connection.failed',
    }
  }
  // 401/402 are OUR problem (bad key, no credits) — don't expose that to the user.
  return { status: 502, code: 'provider_unavailable', message: 'The connection provider is unavailable.', event: 'connection.failed' }
}

export const getConsentHandler = (url: URL): Response => {
  const locale = url.searchParams.get('locale')
  if (!isLocale(locale)) return apiError(400, 'invalid_request', 'locale must be "es" or "en".')
  return json(200, getConsent(locale))
}

export const listConnections: AuthedHandler = async (deps, ctx) => {
  const rows = await deps.db.listConnections(ctx.user.id)
  if (rows.length === 0) return json(200, { connections: [] })

  let live: CromaConnection[] | null = null
  try {
    live = await deps.croma.list()
  } catch {
    live = null // Croma unreachable: serve what we stored, flagged as stale.
  }

  const connections: BankConnection[] = []
  for (const row of rows) {
    if (live === null) {
      connections.push(toPublicConnection(row, null, true))
      continue
    }

    const upstream = live.find((candidate) => candidate.id === row.croma_connection_id) ?? null
    // Gone upstream (deleted in Croma's console, say) means the credentials no longer exist there.
    const status: ConnectionStatus = upstream ? upstream.status : 'invalid'

    if (status !== row.status) {
      const previous = row.status
      await deps.db.updateConnectionStatus(row.id, status)
      await ctx.auditor.recordSafe({
        eventType: 'connection.status_changed',
        outcome: 'success',
        actor: 'system',
        connectionId: row.id,
        metadata: { from: previous, to: status },
      })
    }
    connections.push(toPublicConnection({ ...row, status }, upstream, false))
  }

  return json(200, { connections })
}

export const createConnection: AuthedHandler = async (deps, ctx, request) => {
  // NOTE: this body holds a bank password. It is read once, passed straight to
  // Croma, and must never be logged, stored, or echoed back.
  const body = await readJsonObject(request)
  if (!body) return apiError(400, 'invalid_request', 'The request body must be a JSON object.')

  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!username || !password || username.length > 100 || password.length > 200) {
    return apiError(400, 'invalid_request', 'username and password are required.')
  }
  if (!isLocale(body.locale)) return apiError(400, 'invalid_request', 'locale must be "es" or "en".')
  const locale = body.locale

  const consent = body.consent
  const consentObject =
    consent !== null && typeof consent === 'object' && !Array.isArray(consent)
      ? (consent as Record<string, unknown>)
      : null
  if (!consentObject || typeof consentObject.version !== 'string' || !Array.isArray(consentObject.accepted)) {
    return apiError(400, 'consent_required', 'You must accept every consent item to connect an account.')
  }
  if (consentObject.version !== CONSENT_VERSION) {
    return apiError(409, 'consent_outdated', 'The consent text changed. Review and accept it again.')
  }
  const accepted = new Set(consentObject.accepted.filter((id): id is string => typeof id === 'string'))
  if (!CONSENT_ITEM_IDS.every((id) => accepted.has(id))) {
    return apiError(400, 'consent_required', 'You must accept every consent item to connect an account.')
  }

  const existing = await deps.db.listConnections(ctx.user.id)
  if (existing.length >= deps.config.maxConnectionsPerUser) {
    return apiError(409, 'connection_limit_user', 'You already have a connected account.')
  }

  // Every attempt is a real sign-in to the user's bank. Repeated failures from
  // one user would let this app be used to guess a password and could lock the
  // user's real account, so they are rate-limited.
  const since = new Date(deps.now().getTime() - HOUR_MS).toISOString()
  const recentRejections = await deps.db.countAudit(ctx.user.id, 'connection.rejected', since)
  if (recentRejections >= deps.config.maxRejectedPerHour) {
    await ctx.auditor.recordSafe({ eventType: 'connection.blocked', outcome: 'failure', errorCode: 'too_many_attempts' })
    return apiError(429, 'too_many_attempts', 'Too many failed attempts. Try again in an hour.', 3600)
  }

  const document = getConsent(locale)
  try {
    // Strict audit BEFORE the credentials leave this server: no trail, no attempt.
    await ctx.auditor.record({
      eventType: 'consent.accepted',
      outcome: 'success',
      consent: { version: document.version, hash: document.hash },
      metadata: { locale, items: [...CONSENT_ITEM_IDS] },
    })
    await ctx.auditor.record({
      eventType: 'connection.attempted',
      outcome: 'success',
      consent: { version: document.version, hash: document.hash },
      metadata: { locale },
    })
  } catch (error) {
    console.error('[audit] pre-attempt record failed:', error instanceof Error ? error.message : 'unknown error')
    return AUDIT_UNAVAILABLE()
  }

  let created: CromaConnection
  try {
    created = await deps.croma.register(username, password)
  } catch (error) {
    const failure = mapRegisterFailure(
      error instanceof CromaError ? error : new CromaError(0, 'croma_unreachable', 'Croma did not answer'),
    )
    if (failure.status === 502) {
      console.error('[croma] register failed:', error instanceof CromaError ? `${error.status} ${error.code}` : 'unknown')
    }
    await ctx.auditor.recordSafe({
      eventType: failure.event,
      outcome: 'failure',
      errorCode: failure.code,
    })
    return apiError(failure.status, failure.code, failure.message, failure.retryAfter)
  }

  let row: ConnectionRow
  try {
    row = await deps.db.insertConnection({
      userId: ctx.user.id,
      cromaConnectionId: created.id,
      displayName: created.displayName,
      status: created.status,
    })
  } catch (error) {
    console.error('[db] could not save connection:', error instanceof Error ? error.message : 'unknown error')
    // Don't leave a live credential at Croma that no user record points to.
    try {
      await deps.croma.remove(created.id)
    } catch {
      console.error('[croma] orphaned connection could not be removed:', created.id)
    }
    await ctx.auditor.recordSafe({ eventType: 'connection.failed', outcome: 'failure', errorCode: 'save_failed' })
    return apiError(500, 'internal_error', 'Something went wrong.')
  }

  await ctx.auditor.recordSafe({
    eventType: 'connection.created',
    outcome: 'success',
    connectionId: row.id,
    metadata: { displayName: row.display_name },
  })

  return json(201, { connection: toPublicConnection(row, created, false) })
}

export const deleteConnection: AuthedHandler = async (deps, ctx, request) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return apiError(400, 'invalid_request', 'id is required.')

  const row = await deps.db.getConnection(ctx.user.id, id)
  if (!row) return apiError(404, 'not_found', 'Connection not found.')

  try {
    await deps.croma.remove(row.croma_connection_id)
  } catch (error) {
    // Already gone upstream is the outcome we want. Anything else means the
    // credentials may still exist at Croma, so we keep our record and say so.
    if (!(error instanceof CromaError && error.status === 404)) {
      await ctx.auditor.recordSafe({
        eventType: 'connection.deleted',
        outcome: 'failure',
        connectionId: row.id,
        errorCode: 'provider_unavailable',
      })
      return apiError(502, 'provider_unavailable', 'The connection could not be removed. Try again.')
    }
  }

  await deps.db.deleteConnection(row.id)
  await ctx.auditor.recordSafe({
    eventType: 'connection.deleted',
    outcome: 'success',
    connectionId: row.id,
    metadata: { displayName: row.display_name },
  })
  return json(200, { ok: true })
}

export const listAccounts: AuthedHandler = async (deps, ctx, request) => {
  const id = new URL(request.url).searchParams.get('connectionId')
  if (!id) return apiError(400, 'invalid_request', 'connectionId is required.')

  // Ownership check: the id comes from the browser, so it must belong to THIS user.
  const row = await deps.db.getConnection(ctx.user.id, id)
  if (!row) return apiError(404, 'not_found', 'Connection not found.')

  try {
    const accounts = await deps.croma.accounts(row.croma_connection_id)
    const payload: BankAccount[] = accounts.map((account) => ({
      numberMasked: maskNumber(account.number),
      type: account.type,
      name: account.customName,
      currency: account.currency,
      availableBalance: account.availableBalance,
      status: account.status,
    }))
    await ctx.auditor.recordSafe({
      eventType: 'accounts.read',
      outcome: 'success',
      connectionId: row.id,
      metadata: { count: payload.length },
    })
    return json(200, { accounts: payload })
  } catch (error) {
    return failLookup(deps, ctx, row, 'accounts.read', error)
  }
}

type LookupEvent = 'accounts.read' | 'transactions.read'

/** Shared by every bank read: maps a Croma failure to what the user is told, and keeps the trail and status honest. */
async function failLookup(
  deps: Deps,
  ctx: RequestContext,
  row: ConnectionRow,
  event: LookupEvent,
  error: unknown,
): Promise<Response> {
  const upstream = error instanceof CromaError ? error : new CromaError(0, 'croma_unreachable', 'Croma did not answer')

  if (upstream.code === 'connection_rejected') {
    // The bank stopped accepting the saved credentials (password changed, say).
    if (row.status !== 'invalid') {
      const previous = row.status
      await deps.db.updateConnectionStatus(row.id, 'invalid')
      await ctx.auditor.recordSafe({
        eventType: 'connection.status_changed',
        outcome: 'success',
        actor: 'system',
        connectionId: row.id,
        metadata: { from: previous, to: 'invalid' },
      })
    }
    await ctx.auditor.recordSafe({ eventType: event, outcome: 'failure', connectionId: row.id, errorCode: 'connection_rejected' })
    return apiError(422, 'connection_rejected', 'The bank no longer accepts the saved credentials.')
  }

  if (upstream.status === 429) {
    await ctx.auditor.recordSafe({ eventType: event, outcome: 'failure', connectionId: row.id, errorCode: 'service_busy' })
    return apiError(429, 'service_busy', 'The service is busy. Try again later.', upstream.retryAfter)
  }

  console.error('[croma] lookup failed:', `${upstream.status} ${upstream.code}`)
  await ctx.auditor.recordSafe({ eventType: event, outcome: 'failure', connectionId: row.id, errorCode: 'provider_unavailable' })
  return apiError(502, 'provider_unavailable', 'The connection provider is unavailable.')
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * HOUR_MS

/** A real calendar date in `yyyy-mm-dd`, or null. */
function parseDate(value: string | null): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value ? null : value
}

const MAX_WINDOW_DAYS = 92
const MAX_TRANSACTIONS = 1500
const MAX_DESCRIPTION = 120

export const listTransactions: AuthedHandler = async (deps, ctx, request) => {
  const params = new URL(request.url).searchParams
  const id = params.get('connectionId')
  const account = params.get('account')
  const from = parseDate(params.get('from'))
  const to = parseDate(params.get('to'))
  if (!id || !account || !from || !to) {
    return apiError(400, 'invalid_request', 'connectionId, account, from and to (yyyy-mm-dd) are required.')
  }

  const today = deps.now().toISOString().slice(0, 10)
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS + 1
  if (to < from || to > today || days > MAX_WINDOW_DAYS) {
    return apiError(400, 'invalid_request', `The window must end today or earlier and span at most ${MAX_WINDOW_DAYS} days.`)
  }

  const row = await deps.db.getConnection(ctx.user.id, id)
  if (!row) return apiError(404, 'not_found', 'Connection not found.')

  try {
    // The browser only ever holds masked numbers, so the full one is resolved
    // here. Croma serves a repeated lookup from its own store (no new bank sign-in).
    const accounts = await deps.croma.accounts(row.croma_connection_id)
    const matches = accounts.filter((candidate) => maskNumber(candidate.number) === account)
    if (matches.length === 0) return apiError(404, 'not_found', 'Account not found.')
    if (matches.length > 1) return apiError(400, 'invalid_request', 'More than one account matches that number.')

    const raw = await deps.croma.transactions(row.croma_connection_id, matches[0].number, from, to)
    if (raw.length > MAX_TRANSACTIONS) {
      return apiError(400, 'invalid_request', 'Too many movements in that window. Choose a shorter one.')
    }

    await ctx.auditor.recordSafe({
      eventType: 'transactions.read',
      outcome: 'success',
      connectionId: row.id,
      // Counts and the window only — never what was bought.
      metadata: { count: raw.length, from, to, account },
    })
    return json(200, {
      transactions: raw.map((transaction) => ({
        date: transaction.date,
        description: transaction.description.slice(0, MAX_DESCRIPTION),
        amount: transaction.amount,
        direction: transaction.direction,
      })),
    })
  } catch (error) {
    return failLookup(deps, ctx, row, 'transactions.read', error)
  }
}

const MAX_IMPORT_CHANGES = 60
const MAX_AMOUNT = 1e12

export const recordImport: AuthedHandler = async (deps, ctx, request) => {
  const body = await readJsonObject(request)
  if (!body) return apiError(400, 'invalid_request', 'The request body must be a JSON object.')

  const connectionId = typeof body.connectionId === 'string' ? body.connectionId : ''
  const action = body.action
  const from = parseDate(typeof body.from === 'string' ? body.from : null)
  const to = parseDate(typeof body.to === 'string' ? body.to : null)
  if (!connectionId || (action !== 'applied' && action !== 'discarded') || !from || !to) {
    return apiError(400, 'invalid_request', 'connectionId, action, from and to are required.')
  }

  const rawChanges = Array.isArray(body.changes) ? body.changes : []
  if (rawChanges.length > MAX_IMPORT_CHANGES) return apiError(400, 'invalid_request', 'Too many changes.')

  const changes: { field: string; before: number; after: number }[] = []
  for (const entry of rawChanges) {
    const change = entry !== null && typeof entry === 'object' ? (entry as Record<string, unknown>) : null
    if (
      change === null ||
      typeof change.field !== 'string' ||
      !IMPORT_FIELD_IDS.includes(change.field) ||
      !isAmount(change.before) ||
      !isAmount(change.after)
    ) {
      return apiError(400, 'invalid_request', 'Invalid change.')
    }
    changes.push({ field: change.field, before: change.before, after: change.after })
  }
  if (action === 'applied' && changes.length === 0) {
    return apiError(400, 'invalid_request', 'An applied import must list at least one change.')
  }

  const row = await deps.db.getConnection(ctx.user.id, connectionId)
  if (!row) return apiError(404, 'not_found', 'Connection not found.')

  try {
    // Strict: the browser applies the change only after this succeeds, so a
    // budget change never happens without its record.
    await ctx.auditor.record({
      eventType: action === 'applied' ? 'import.applied' : 'import.discarded',
      outcome: 'success',
      connectionId: row.id,
      metadata: action === 'applied' ? { from, to, changeCount: changes.length, changes } : { from, to },
    })
  } catch (error) {
    console.error('[audit] import record failed:', error instanceof Error ? error.message : 'unknown error')
    return AUDIT_UNAVAILABLE()
  }
  return json(200, { ok: true })
}

const isAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_AMOUNT

export const listAudit: AuthedHandler = async (deps, ctx) => {
  const rows = await deps.db.listAudit(ctx.user.id, AUDIT_PAGE_SIZE)
  const events: AuditEvent[] = rows.map((row) => ({
    id: row.id,
    ts: row.ts,
    actor: row.actor,
    eventType: row.event_type,
    connectionId: row.connection_id,
    outcome: row.outcome,
    errorCode: row.error_code,
    metadata: row.metadata,
  }))
  return json(200, { events })
}
