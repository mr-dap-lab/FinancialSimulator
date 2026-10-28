import type { BankAccountType, ConnectionStatus } from '../../src/lib/bankTypes.js'

/**
 * Thin client for Croma's Bancolombia endpoints (https://docs.usecroma.com/guides/colombia/bancolombia).
 *
 * Everything the rest of the API knows about Croma goes through the
 * `CromaClient` interface, so handlers are tested against an in-memory fake
 * and the real HTTP client is only exercised against the live service.
 */

export interface CromaConnection {
  id: string
  status: ConnectionStatus
  displayName: string | null
  usage: { signInsToday: number; dailyLimit: number | null; resetsAt: string | null } | null
  availableAgainAt: string | null
  createdAt: string | null
  lastUsedAt: string | null
}

export interface CromaAccount {
  number: string
  customName: string | null
  type: BankAccountType
  currency: string
  status: string | null
  availableBalance: number | null
}

export interface CromaTransaction {
  date: string
  description: string
  /** Positive is money in, negative is money out. */
  amount: number
  direction: 'credit' | 'debit'
}

export interface CromaClient {
  /** Registers a connection. Croma verifies the credentials with the bank before keeping anything. */
  register(username: string, password: string): Promise<CromaConnection>
  list(): Promise<CromaConnection[]>
  remove(connectionId: string): Promise<void>
  accounts(connectionId: string): Promise<CromaAccount[]>
  /** Movements of one account over an inclusive `yyyy-mm-dd` window. */
  transactions(connectionId: string, accountNumber: string, from: string, to: string): Promise<CromaTransaction[]>
}

/** A non-2xx answer from Croma, or no answer at all (`status` 0). */
export class CromaError extends Error {
  readonly status: number
  readonly code: string
  readonly retryAfter: number | undefined

  constructor(status: number, code: string, message: string, retryAfter?: number) {
    super(message)
    this.name = 'CromaError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null)
const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null)

const STATUSES: readonly ConnectionStatus[] = ['active', 'exhausted', 'invalid']
const ACCOUNT_TYPES: readonly BankAccountType[] = ['savings', 'checking', 'credit_card', 'other']

/**
 * Croma's docs do not enumerate every status value; an unrecognised one is
 * treated as `active` rather than raising a false "reconnect your account"
 * alarm for something we simply do not understand yet.
 */
function normalizeConnection(raw: unknown): CromaConnection {
  const value = isObject(raw) ? raw : {}
  const status = asString(value.status)
  const usage = isObject(value.usage) ? value.usage : null
  return {
    id: asString(value.id) ?? '',
    status: STATUSES.includes(status as ConnectionStatus) ? (status as ConnectionStatus) : 'active',
    displayName: asString(value.display_name),
    usage: usage
      ? {
          signInsToday: asNumber(usage.sign_ins_today) ?? 0,
          dailyLimit: asNumber(usage.daily_limit),
          resetsAt: asString(usage.resets_at),
        }
      : null,
    availableAgainAt: asString(value.available_again_at),
    createdAt: asString(value.created_at),
    lastUsedAt: asString(value.last_used_at),
  }
}

function normalizeAccount(raw: unknown): CromaAccount {
  const value = isObject(raw) ? raw : {}
  const type = asString(value.type)
  return {
    number: asString(value.number) ?? '',
    customName: asString(value.custom_name),
    type: ACCOUNT_TYPES.includes(type as BankAccountType) ? (type as BankAccountType) : 'other',
    currency: asString(value.currency) ?? 'COP',
    status: asString(value.status),
    availableBalance: asNumber(value.available_balance),
  }
}

function normalizeTransaction(raw: unknown): CromaTransaction {
  const value = isObject(raw) ? raw : {}
  const amount = asNumber(value.amount) ?? 0
  const direction = asString(value.direction)
  return {
    date: asString(value.date) ?? '',
    description: asString(value.description) ?? '',
    amount,
    // Croma derives `direction` from the amount's sign; do the same if it is missing.
    direction: direction === 'credit' || direction === 'debit' ? direction : amount < 0 ? 'debit' : 'credit',
  }
}

export const DEFAULT_CROMA_BASE_URL = 'https://api.croma.run'

/** Registration signs in to the bank; account reads are live lookups and can be slow. */
const REGISTER_TIMEOUT_MS = 45_000
const LOOKUP_TIMEOUT_MS = 55_000
const ADMIN_TIMEOUT_MS = 20_000

export function createHttpCroma(
  apiKey: string,
  baseUrl: string = DEFAULT_CROMA_BASE_URL,
  fetchImpl: typeof fetch = fetch,
): CromaClient {
  async function call(method: string, path: string, body: unknown, timeoutMs: number): Promise<Json> {
    let response: Response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${apiKey}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch {
      // Network failure or timeout. Never include the underlying error text —
      // it can contain the request URL, and the body held a password.
      throw new CromaError(0, 'croma_unreachable', 'Croma did not answer')
    }

    const text = await response.text()
    let parsed: unknown = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = null
    }

    if (!response.ok) {
      const error = isObject(parsed) && isObject(parsed.error) ? parsed.error : {}
      const retryAfter = Number(response.headers.get('retry-after'))
      throw new CromaError(
        response.status,
        asString(error.code) ?? 'upstream_error',
        asString(error.message) ?? `Croma answered ${response.status}`,
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      )
    }

    return isObject(parsed) ? parsed : {}
  }

  return {
    async register(username, password) {
      const json = await call(
        'POST',
        '/co/bancolombia/connections/v1',
        { username, password, authorized: true },
        REGISTER_TIMEOUT_MS,
      )
      return normalizeConnection(json.data)
    },

    async list() {
      const json = await call('GET', '/co/bancolombia/connections/v1', undefined, ADMIN_TIMEOUT_MS)
      // The list shape is not spelled out in Croma's docs; accept an array or `{ connections: [...] }`.
      const data = json.data
      const items = Array.isArray(data) ? data : isObject(data) && Array.isArray(data.connections) ? data.connections : []
      return items.map(normalizeConnection)
    },

    async remove(connectionId) {
      await call(
        'DELETE',
        `/co/bancolombia/connections/v1/${encodeURIComponent(connectionId)}`,
        undefined,
        ADMIN_TIMEOUT_MS,
      )
    },

    async accounts(connectionId) {
      const json = await call(
        'POST',
        '/co/bancolombia/accounts/v1',
        { connection_id: connectionId },
        LOOKUP_TIMEOUT_MS,
      )
      const data = isObject(json.data) ? json.data : {}
      return (Array.isArray(data.accounts) ? data.accounts : []).map(normalizeAccount)
    },

    async transactions(connectionId, accountNumber, from, to) {
      const json = await call(
        'POST',
        '/co/bancolombia/transactions/v1',
        { connection_id: connectionId, account_number: accountNumber, date_from: from, date_to: to },
        LOOKUP_TIMEOUT_MS,
      )
      const data = isObject(json.data) ? json.data : {}
      return (Array.isArray(data.transactions) ? data.transactions : []).map(normalizeTransaction)
    },
  }
}

/**
 * In-memory stand-in for local UX testing without spending credits or typing a
 * real bank password. Never used in production (see `deps.ts`).
 *
 * Trigger the error paths with the username:
 *   rechazado → 422 connection_rejected   duplicada → 409 connection_exists
 *   sincupo   → 422 connection_limit_reached   ocupado → 429 connections_exhausted
 */
export function createMockCroma(): CromaClient {
  const connections = new Map<string, CromaConnection>()
  let seq = 0

  return {
    async register(username) {
      const name = username.trim().toLowerCase()
      if (name.startsWith('rechazado')) {
        throw new CromaError(422, 'connection_rejected', 'The bank did not accept these credentials')
      }
      if (name.startsWith('duplicada')) {
        throw new CromaError(409, 'connection_exists', 'This account is already connected')
      }
      if (name.startsWith('sincupo')) {
        throw new CromaError(422, 'connection_limit_reached', 'The organization already has 5 connections')
      }
      if (name.startsWith('ocupado')) {
        throw new CromaError(429, 'connections_exhausted', 'Daily allowance used', 120)
      }
      await new Promise((resolve) => setTimeout(resolve, 900))
      const now = new Date().toISOString()
      const connection: CromaConnection = {
        id: `conn_mock_${++seq}`,
        status: 'active',
        displayName: `${username.trim().charAt(0).toUpperCase()}*** M*** D***`,
        usage: { signInsToday: 1, dailyLimit: null, resetsAt: null },
        availableAgainAt: null,
        createdAt: now,
        lastUsedAt: now,
      }
      connections.set(connection.id, connection)
      return connection
    },
    async list() {
      return [...connections.values()]
    },
    async remove(connectionId) {
      if (!connections.delete(connectionId)) {
        throw new CromaError(404, 'connection_not_found', 'No such connection')
      }
    },
    async accounts(connectionId) {
      if (!connections.has(connectionId)) {
        throw new CromaError(409, 'connection_required', 'No such connection')
      }
      return [
        {
          number: '12345678901',
          customName: 'Mi ahorro',
          type: 'savings',
          currency: 'COP',
          status: 'ACTIVO',
          availableBalance: 4_200_000,
        },
        {
          number: '98765432100',
          customName: null,
          type: 'checking',
          currency: 'COP',
          status: 'ACTIVO',
          availableBalance: 850_000,
        },
      ]
    },
    async transactions(connectionId, _accountNumber, from, to) {
      if (!connections.has(connectionId)) {
        throw new CromaError(409, 'connection_required', 'No such connection')
      }
      // A plausible month of spending, repeated for every month the window touches.
      const templates: [number, string, number][] = [
        [2, 'COMPRA ALMACENES EXITO', -380_000],
        [4, 'PAGO ARRIENDO', -1_800_000],
        [5, 'PAGO CODENSA ENERGIA', -140_000],
        [6, 'NETFLIX.COM', -45_000],
        [9, 'COMPRA DROGUERIA CRUZ VERDE', -62_000],
        [12, 'TERPEL ESTACION', -150_000],
        [14, 'RAPPI DOMICILIOS', -48_000],
        [16, 'CLARO MOVIL', -89_000],
        [18, 'TRANSFERENCIA A JUAN', -200_000],
        [20, 'COMPRA CARULLA', -210_000],
        [25, 'PAGO NOMINA EMPRESA', 6_000_000],
      ]
      const result: { date: string; description: string; amount: number; direction: 'credit' | 'debit' }[] = []
      const start = new Date(`${from}T00:00:00Z`)
      const end = new Date(`${to}T00:00:00Z`)
      for (let month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)); month <= end; month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) {
        for (const [day, description, amount] of templates) {
          const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day))
          if (date >= start && date <= end) {
            result.push({ date: date.toISOString().slice(0, 10), description, amount, direction: amount < 0 ? 'debit' : 'credit' })
          }
        }
      }
      return result
    },
  }
}
