import type { AuditEventType } from '../../../src/lib/bankTypes.js'
import { Auditor } from '../audit.js'
import { CromaError } from '../croma.js'
import type { CromaAccount, CromaClient, CromaConnection, CromaTransaction } from '../croma.js'
import type { AuditInsert, AuditRow, ConnectionRow, Db } from '../db.js'
import type { AuthenticatedUser, Deps } from '../deps.js'
import type { RequestContext } from '../route.js'

/** In-memory `Db`, with switches to simulate the database failing. */
export class FakeDb implements Db {
  connections: ConnectionRow[] = []
  audit: AuditInsert[] = []
  failAudit = false
  failInsertConnection = false
  private seq = 0

  async listConnections(userId: string) {
    return this.connections.filter((row) => row.user_id === userId)
  }
  async getConnection(userId: string, id: string) {
    return this.connections.find((row) => row.user_id === userId && row.id === id) ?? null
  }
  async insertConnection(input: {
    userId: string
    cromaConnectionId: string
    displayName: string | null
    status: ConnectionRow['status']
  }) {
    if (this.failInsertConnection) throw new Error('database: insert failed')
    const row: ConnectionRow = {
      id: `00000000-0000-4000-8000-${String(++this.seq).padStart(12, '0')}`,
      user_id: input.userId,
      croma_connection_id: input.cromaConnectionId,
      display_name: input.displayName,
      status: input.status,
      created_at: '2026-10-28T12:00:00.000Z',
      status_checked_at: '2026-10-28T12:00:00.000Z',
    }
    this.connections.push(row)
    return row
  }
  async updateConnectionStatus(id: string, status: ConnectionRow['status']) {
    const row = this.connections.find((candidate) => candidate.id === id)
    if (row) row.status = status
  }
  async deleteConnection(id: string) {
    this.connections = this.connections.filter((row) => row.id !== id)
  }
  async insertAudit(event: AuditInsert) {
    if (this.failAudit) throw new Error('database: audit insert failed')
    this.audit.push(event)
  }
  async countAudit(userId: string, eventType: AuditEventType, sinceIso: string) {
    void sinceIso
    return this.audit.filter((event) => event.userId === userId && event.eventType === eventType).length
  }
  async listAudit(userId: string, limit: number): Promise<AuditRow[]> {
    return this.audit
      .filter((event) => event.userId === userId)
      .slice(-limit)
      .reverse()
      .map((event, index) => ({
        id: `audit-${index}`,
        ts: '2026-10-28T12:00:00.000Z',
        actor: event.actor,
        event_type: event.eventType,
        connection_id: event.connectionId,
        outcome: event.outcome,
        error_code: event.errorCode,
        metadata: event.metadata,
      }))
  }

  types(): AuditEventType[] {
    return this.audit.map((event) => event.eventType)
  }
}

/** Scriptable `CromaClient`. Every call is recorded so tests can assert what reached Croma. */
export class FakeCroma implements CromaClient {
  registered: { username: string; password: string }[] = []
  removed: string[] = []
  upstream: CromaConnection[] = []
  registerError: CromaError | null = null
  listError: CromaError | null = null
  removeError: CromaError | null = null
  accountsError: CromaError | null = null
  transactionsError: CromaError | null = null
  transactionCalls: { connectionId: string; accountNumber: string; from: string; to: string }[] = []
  transactionList: CromaTransaction[] = [
    { date: '2026-10-02', description: 'COMPRA ALMACENES EXITO', amount: -380000, direction: 'debit' },
    { date: '2026-10-25', description: 'PAGO NOMINA EMPRESA', amount: 6000000, direction: 'credit' },
  ]
  accountList: CromaAccount[] = [
    { number: '12345678901', customName: 'Mi ahorro', type: 'savings', currency: 'COP', status: 'ACTIVO', availableBalance: 4_200_000 },
  ]
  private seq = 0

  async register(username: string, password: string) {
    this.registered.push({ username, password })
    if (this.registerError) throw this.registerError
    const connection: CromaConnection = {
      id: `conn_${++this.seq}`,
      status: 'active',
      displayName: 'J*** P*** G***',
      usage: { signInsToday: 1, dailyLimit: null, resetsAt: null },
      availableAgainAt: null,
      createdAt: '2026-10-28T12:00:00.000Z',
      lastUsedAt: '2026-10-28T12:00:00.000Z',
    }
    this.upstream.push(connection)
    return connection
  }
  async list() {
    if (this.listError) throw this.listError
    return this.upstream
  }
  async remove(connectionId: string) {
    if (this.removeError) throw this.removeError
    this.removed.push(connectionId)
    this.upstream = this.upstream.filter((connection) => connection.id !== connectionId)
  }
  async accounts() {
    if (this.accountsError) throw this.accountsError
    return this.accountList
  }
  async transactions(connectionId: string, accountNumber: string, from: string, to: string) {
    this.transactionCalls.push({ connectionId, accountNumber, from, to })
    if (this.transactionsError) throw this.transactionsError
    return this.transactionList
  }
}

export const USER: AuthenticatedUser = { id: 'user-1', email: 'diego@example.com' }
export const OTHER_USER: AuthenticatedUser = { id: 'user-2', email: 'otra@example.com' }

export function makeDeps(overrides: Partial<Deps['config']> = {}) {
  const db = new FakeDb()
  const croma = new FakeCroma()
  const deps: Deps = {
    db,
    croma,
    verifyToken: async (token) => (token === 'good-token' ? USER : null),
    now: () => new Date('2026-10-28T12:00:00.000Z'),
    config: { maxConnectionsPerUser: 1, maxRejectedPerHour: 5, auditIpSalt: null, ...overrides },
  }
  return { deps, db, croma }
}

export function makeCtx(deps: Deps, user: AuthenticatedUser = USER): RequestContext {
  return {
    user,
    requestId: 'req-1',
    auditor: new Auditor(deps.db, { userId: user.id, requestId: 'req-1', ipHash: null, userAgent: 'vitest' }),
  }
}

export const CONSENT_ALL = ['ownership', 'responsibility', 'thirdParty', 'dataProcessing']

export function postRequest(body: unknown, url = 'http://localhost/api/bank/connections'): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const validBody = (overrides: Record<string, unknown> = {}) => ({
  username: 'jperez',
  password: 'S3cret-bank-pass!',
  locale: 'es',
  consent: { version: '2026-10-28.1', accepted: CONSENT_ALL },
  ...overrides,
})
