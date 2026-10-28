import type {
  AuditEvent,
  BankAccount,
  BankConnection,
  BankErrorCode,
  BankLocale,
  ConsentDocument,
  BankTransaction,
  CreateConnectionRequest,
  RecordImportRequest,
} from '../../lib/bankTypes'

/** A failed call to `api/bank/*`. `code` is what the UI translates; `message` is for developers. */
export class BankApiError extends Error {
  readonly status: number
  readonly code: BankErrorCode
  readonly retryAfter: number | undefined

  constructor(status: number, code: BankErrorCode, message: string, retryAfter?: number) {
    super(message)
    this.name = 'BankApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

async function request<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new BankApiError(0, 'provider_unavailable', 'Network error')
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const error = (body as { error?: { code?: BankErrorCode; message?: string; retryAfter?: number } } | null)?.error
    if (error?.code) throw new BankApiError(response.status, error.code, error.message ?? '', error.retryAfter)
    // No JSON error body: the endpoint is simply not there (static preview, no API deployed).
    throw new BankApiError(
      response.status,
      response.status === 404 || response.status === 405 ? 'not_configured' : 'internal_error',
      `HTTP ${response.status}`,
    )
  }

  return body as T
}

export const bankApi = {
  consent: (locale: BankLocale) =>
    request<ConsentDocument>(`/api/bank/consent?locale=${locale}`, null),

  listConnections: (token: string) =>
    request<{ connections: BankConnection[] }>('/api/bank/connections', token).then((r) => r.connections),

  createConnection: (token: string, body: CreateConnectionRequest) =>
    request<{ connection: BankConnection }>('/api/bank/connections', token, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.connection),

  deleteConnection: (token: string, id: string) =>
    request<{ ok: true }>(`/api/bank/connections?id=${encodeURIComponent(id)}`, token, { method: 'DELETE' }),

  accounts: (token: string, connectionId: string) =>
    request<{ accounts: BankAccount[] }>(
      `/api/bank/accounts?connectionId=${encodeURIComponent(connectionId)}`,
      token,
    ).then((r) => r.accounts),

  transactions: (token: string, query: { connectionId: string; account: string; from: string; to: string }) =>
    request<{ transactions: BankTransaction[] }>(
      `/api/bank/transactions?${new URLSearchParams(query)}`,
      token,
    ).then((r) => r.transactions),

  recordImport: (token: string, body: RecordImportRequest) =>
    request<{ ok: true }>('/api/bank/imports', token, { method: 'POST', body: JSON.stringify(body) }),

  audit: (token: string) =>
    request<{ events: AuditEvent[] }>('/api/bank/audit', token).then((r) => r.events),
}
