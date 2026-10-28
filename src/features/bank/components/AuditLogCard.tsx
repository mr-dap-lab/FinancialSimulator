import { useEffect, useState } from 'react'
import { Button, Card } from '../../../components/ui'
import { useI18n } from '../../../i18n/i18n'
import type { AuditEvent } from '../../../lib/bankTypes'
import type { BankApi } from '../useBankApi'

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; events: AuditEvent[] }

/**
 * The user's own trail: consent, connection lifecycle and bank reads. Read-only
 * and secret-free by construction — see `api/_lib/audit.ts` for what is (and
 * is never) recorded.
 */
export function AuditLogCard({ api, refreshKey }: { api: BankApi; refreshKey: number }) {
  const { t, dateLocale } = useI18n()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    api
      .audit()
      .then((events) => active && setState({ status: 'ready', events }))
      .catch(() => active && setState({ status: 'error' }))
    return () => {
      active = false
    }
  }, [api, refreshKey, attempt])

  const when = (iso: string) =>
    new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(iso))

  /** A short, human detail: the status transition, a count, or the failure reason. */
  const detail = (event: AuditEvent): string => {
    const parts: string[] = []
    const { from, to, count, changeCount } = event.metadata as {
      from?: string
      to?: string
      count?: number
      changeCount?: number
    }
    // `from`/`to` are a status transition for a status change, a date window for movements/imports.
    if (from && to) parts.push(`${from} → ${to}`)
    if (typeof count === 'number') {
      parts.push(event.eventType === 'transactions.read' ? t.bank.auditMovementsCount(count) : t.bank.auditAccountsCount(count))
    }
    if (typeof changeCount === 'number') parts.push(t.bank.auditChangesCount(changeCount))
    if (event.errorCode) {
      const known = (t.bank.errors as Record<string, unknown>)[event.errorCode]
      parts.push(typeof known === 'string' ? known : event.errorCode)
    }
    if (event.actor === 'system') parts.push(t.bank.auditAutomatic)
    return parts.join(' · ')
  }

  return (
    <Card title={t.bank.auditTitle} description={t.bank.auditDescription}>
      {state.status === 'loading' && (
        <p role="status" className="text-sm text-on-surface-variant">
          {t.bank.loading}
        </p>
      )}

      {state.status === 'error' && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-on-surface-variant">
            {t.bank.loadError}
          </p>
          <Button
            variant="text"
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((value) => value + 1)
            }}
          >
            {t.bank.retry}
          </Button>
        </div>
      )}

      {state.status === 'ready' && state.events.length === 0 && (
        <p className="text-sm text-on-surface-variant">{t.bank.auditEmpty}</p>
      )}

      {state.status === 'ready' && state.events.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-on-surface-variant">
                <th className="border-b border-outline-variant px-3 py-2 whitespace-nowrap">{t.bank.auditWhen}</th>
                <th className="border-b border-outline-variant px-3 py-2 whitespace-nowrap">{t.bank.auditEvent}</th>
                <th className="border-b border-outline-variant px-3 py-2 whitespace-nowrap">{t.bank.auditResult}</th>
                <th className="border-b border-outline-variant px-3 py-2 whitespace-nowrap">{t.bank.auditDetail}</th>
              </tr>
            </thead>
            <tbody>
              {state.events.map((event) => (
                <tr key={event.id} className="border-b border-outline-variant/60 align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-on-surface-variant tabular-nums">{when(event.ts)}</td>
                  <td className="px-3 py-2 text-on-surface">{t.bank.auditEvents[event.eventType]}</td>
                  <td className={`px-3 py-2 ${event.outcome === 'failure' ? 'text-error' : 'text-on-surface-variant'}`}>
                    {event.outcome === 'failure' ? t.bank.auditFailure : t.bank.auditSuccess}
                  </td>
                  <td className="px-3 py-2 text-on-surface-variant">{detail(event)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
