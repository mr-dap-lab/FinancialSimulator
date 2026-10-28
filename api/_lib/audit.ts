import type { AuditEventType } from '../../src/lib/bankTypes.js'
import type { Db } from './db.js'

export interface AuditContext {
  userId: string
  requestId: string
  ipHash: string | null
  userAgent: string | null
}

export interface AuditInput {
  eventType: AuditEventType
  outcome: 'success' | 'failure'
  connectionId?: string | null
  errorCode?: string | null
  actor?: 'user' | 'system'
  consent?: { version: string; hash: string }
  /**
   * Secret-free detail only: masked names, counts, status transitions. Never a
   * username, password, full account number, or movement contents.
   */
  metadata?: Record<string, unknown>
}

/**
 * Writes the audit trail for one request. Two modes, chosen by what a missing
 * record would mean:
 *
 * - `record` throws on failure. Used BEFORE an action that must not happen
 *   untracked (sending a bank password to Croma): if the trail cannot be
 *   written, the action does not run.
 * - `recordSafe` logs and carries on. Used AFTER the action, where the outcome
 *   has already happened and failing the user's request would not undo it.
 */
export class Auditor {
  private readonly db: Db
  private readonly context: AuditContext

  constructor(db: Db, context: AuditContext) {
    this.db = db
    this.context = context
  }

  async record(input: AuditInput): Promise<void> {
    await this.db.insertAudit({
      userId: this.context.userId,
      actor: input.actor ?? 'user',
      eventType: input.eventType,
      connectionId: input.connectionId ?? null,
      outcome: input.outcome,
      errorCode: input.errorCode ?? null,
      consentVersion: input.consent?.version ?? null,
      consentHash: input.consent?.hash ?? null,
      requestId: this.context.requestId,
      ipHash: this.context.ipHash,
      userAgent: this.context.userAgent,
      metadata: input.metadata ?? {},
    })
  }

  async recordSafe(input: AuditInput): Promise<void> {
    try {
      await this.record(input)
    } catch (error) {
      console.error(
        `[audit] could not record ${input.eventType} (request ${this.context.requestId}):`,
        error instanceof Error ? error.message : 'unknown error',
      )
    }
  }
}
