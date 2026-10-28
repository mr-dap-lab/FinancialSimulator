import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuditEventType, ConnectionStatus } from '../../src/lib/bankTypes.js'

export interface ConnectionRow {
  id: string
  user_id: string
  croma_connection_id: string
  display_name: string | null
  status: ConnectionStatus
  created_at: string
  status_checked_at: string
}

export interface AuditInsert {
  userId: string
  actor: 'user' | 'system'
  eventType: AuditEventType
  connectionId: string | null
  outcome: 'success' | 'failure'
  errorCode: string | null
  consentVersion: string | null
  consentHash: string | null
  requestId: string
  ipHash: string | null
  userAgent: string | null
  metadata: Record<string, unknown>
}

export interface AuditRow {
  id: string
  ts: string
  actor: 'user' | 'system'
  event_type: AuditEventType
  connection_id: string | null
  outcome: 'success' | 'failure'
  error_code: string | null
  metadata: Record<string, unknown>
}

/**
 * Everything the API needs from Postgres. Handlers depend on this interface,
 * not on Supabase, so they are unit-tested with an in-memory implementation.
 */
export interface Db {
  listConnections(userId: string): Promise<ConnectionRow[]>
  getConnection(userId: string, id: string): Promise<ConnectionRow | null>
  insertConnection(row: {
    userId: string
    cromaConnectionId: string
    displayName: string | null
    status: ConnectionStatus
  }): Promise<ConnectionRow>
  updateConnectionStatus(id: string, status: ConnectionStatus): Promise<void>
  deleteConnection(id: string): Promise<void>
  insertAudit(event: AuditInsert): Promise<void>
  countAudit(userId: string, eventType: AuditEventType, sinceIso: string): Promise<number>
  listAudit(userId: string, limit: number): Promise<AuditRow[]>
}

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`database: ${result.error.message}`)
  return result.data
}

/** Service-role client: bypasses RLS, so every query below filters by `user_id` itself. */
export function createSupabaseDb(client: SupabaseClient): Db {
  return {
    async listConnections(userId) {
      const result = await client
        .from('bank_connections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      return check(result) as ConnectionRow[]
    },

    async getConnection(userId, id) {
      const result = await client
        .from('bank_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle()
      return check(result) as ConnectionRow | null
    },

    async insertConnection({ userId, cromaConnectionId, displayName, status }) {
      const result = await client
        .from('bank_connections')
        .insert({
          user_id: userId,
          croma_connection_id: cromaConnectionId,
          display_name: displayName,
          status,
        })
        .select('*')
        .single()
      return check(result) as ConnectionRow
    },

    async updateConnectionStatus(id, status) {
      const result = await client
        .from('bank_connections')
        .update({ status, status_checked_at: new Date().toISOString() })
        .eq('id', id)
      check(result)
    },

    async deleteConnection(id) {
      check(await client.from('bank_connections').delete().eq('id', id))
    },

    async insertAudit(event) {
      check(
        await client.from('audit_events').insert({
          user_id: event.userId,
          actor: event.actor,
          event_type: event.eventType,
          connection_id: event.connectionId,
          outcome: event.outcome,
          error_code: event.errorCode,
          consent_version: event.consentVersion,
          consent_hash: event.consentHash,
          request_id: event.requestId,
          ip_hash: event.ipHash,
          user_agent: event.userAgent,
          metadata: event.metadata,
        }),
      )
    },

    async countAudit(userId, eventType, sinceIso) {
      const result = await client
        .from('audit_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', eventType)
        .gte('ts', sinceIso)
      if (result.error) throw new Error(`database: ${result.error.message}`)
      return result.count ?? 0
    },

    async listAudit(userId, limit) {
      const result = await client
        .from('audit_events')
        .select('id, ts, actor, event_type, connection_id, outcome, error_code, metadata')
        .eq('user_id', userId)
        .order('ts', { ascending: false })
        .limit(limit)
      return check(result) as AuditRow[]
    },
  }
}
