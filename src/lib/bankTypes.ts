/**
 * Wire types for the bank-connection API (`api/bank/*`), shared by the
 * serverless functions and the React client. Type-only: this file has no
 * runtime code, so the API can `import type` from it without pulling anything
 * from `src/` into the function bundle.
 *
 * Deliberately has no field that could carry a bank credential, a full account
 * number or a movement's contents — see docs/BANK_CONNECTION_DESIGN.md §3 and §5.
 */

export type ConnectionStatus = 'active' | 'exhausted' | 'invalid'

export type BankLocale = 'es' | 'en'

export interface BankConnection {
  /** OUR id (uuid). Croma's own connection id never leaves the server. */
  id: string
  /** Masked by the bank/Croma, e.g. "J*** P*** G***". */
  displayName: string | null
  status: ConnectionStatus
  createdAt: string
  lastUsedAt: string | null
  /** Daily sign-in allowance, as reported by Croma. Null when unknown. */
  usage: { signInsToday: number; dailyLimit: number | null; resetsAt: string | null } | null
  /** Set when status is `exhausted`: when the allowance comes back. */
  availableAgainAt: string | null
  /** True when Croma could not be reached and `status` is the last one we stored. */
  stale: boolean
}

export type BankAccountType = 'savings' | 'checking' | 'credit_card' | 'other'

export interface BankAccount {
  /** "••••1234" — only the last four digits are ever sent to the browser. */
  numberMasked: string
  type: BankAccountType
  /** The customer's own nickname for the account, when they set one. */
  name: string | null
  currency: string
  availableBalance: number | null
  status: string | null
}

/** One movement of an account. Never persisted or logged — it is shown once and discarded. */
export interface BankTransaction {
  date: string
  description: string
  /** Positive is money in, negative is money out. */
  amount: number
  direction: 'credit' | 'debit'
}

/** One budget field changed by an import: monthly amounts, before and after. */
export interface ImportChange {
  field: string
  before: number
  after: number
}

export interface RecordImportRequest {
  connectionId: string
  action: 'applied' | 'discarded'
  from: string
  to: string
  changes: ImportChange[]
}

export interface ConsentItem {
  id: string
  text: string
}

export interface ConsentDocument {
  version: string
  locale: BankLocale
  items: ConsentItem[]
  /** SHA-256 of the exact text above; recorded in the audit log on acceptance. */
  hash: string
}

export interface CreateConnectionRequest {
  username: string
  password: string
  locale: BankLocale
  consent: { version: string; accepted: string[] }
}

export type AuditEventType =
  | 'consent.accepted'
  | 'connection.attempted'
  | 'connection.created'
  | 'connection.rejected'
  | 'connection.duplicate'
  | 'connection.limit_reached'
  | 'connection.blocked'
  | 'connection.failed'
  | 'connection.status_changed'
  | 'connection.deleted'
  | 'accounts.read'
  | 'transactions.read'
  | 'import.applied'
  | 'import.discarded'

export interface AuditEvent {
  id: string
  ts: string
  actor: 'user' | 'system'
  eventType: AuditEventType
  connectionId: string | null
  outcome: 'success' | 'failure'
  errorCode: string | null
  /** Free-form but secret-free: masked names, counts, status transitions. */
  metadata: Record<string, unknown>
}

export type BankErrorCode =
  | 'unauthorized'
  | 'invalid_request'
  | 'consent_required'
  | 'consent_outdated'
  | 'connection_limit_user'
  | 'too_many_attempts'
  | 'connection_rejected'
  | 'connection_exists'
  | 'capacity_reached'
  | 'service_busy'
  | 'provider_unavailable'
  | 'audit_unavailable'
  | 'not_configured'
  | 'not_found'
  | 'internal_error'

export interface ApiErrorBody {
  error: { code: BankErrorCode; message: string; retryAfter?: number }
}
