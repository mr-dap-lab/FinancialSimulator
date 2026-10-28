import { useState } from 'react'
import { Button, Card } from '../../../components/ui'
import { useI18n } from '../../../i18n/i18n'
import type { BankAccount, BankConnection, ConnectionStatus } from '../../../lib/bankTypes'
import { bankErrorMessage } from '../errorMessage'
import type { BankApi } from '../useBankApi'

const STATUS_STYLE: Record<ConnectionStatus, string> = {
  active: 'bg-secondary-container text-on-secondary-container',
  exhausted: 'bg-surface-high text-on-surface',
  invalid: 'bg-error-container text-on-error-container',
}

function formatBalance(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${amount} ${currency}` // An unrecognised currency code must not break the card.
  }
}

/** One connected account: its state, its accounts on demand, and disconnecting. */
export function ConnectionCard({
  connection,
  api,
  onDisconnected,
  onActivity,
}: {
  connection: BankConnection
  api: BankApi
  onDisconnected: () => void
  /** Called after anything that adds to the audit trail, so the log refreshes. */
  onActivity: () => void
}) {
  const { t, dateLocale } = useI18n()
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const date = (iso: string) =>
    new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

  const statusLabel: Record<ConnectionStatus, string> = {
    active: t.bank.statusActive,
    exhausted: t.bank.statusExhausted,
    invalid: t.bank.statusInvalid,
  }

  // Reading accounts signs in to the user's bank, so it only happens on request.
  const toggleAccounts = async () => {
    if (accounts) {
      setAccounts(null)
      return
    }
    setAccountsLoading(true)
    setError(null)
    try {
      setAccounts(await api.accounts(connection.id))
    } catch (caught) {
      setError(bankErrorMessage(caught, t))
    } finally {
      setAccountsLoading(false)
      onActivity()
    }
  }

  const disconnect = async () => {
    setDisconnecting(true)
    setError(null)
    try {
      await api.deleteConnection(connection.id)
      onDisconnected()
    } catch (caught) {
      setError(bankErrorMessage(caught, t))
      setConfirming(false)
    } finally {
      setDisconnecting(false)
      onActivity()
    }
  }

  return (
    <Card
      title={t.bank.cardTitle}
      description={connection.displayName ?? undefined}
      actions={
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[connection.status]}`}>
          {statusLabel[connection.status]}
        </span>
      }
    >
      <div data-clarity-mask="true">
        <p className="text-sm text-on-surface-variant">{t.bank.connectedOn(date(connection.createdAt))}</p>
        {connection.lastUsedAt && (
          <p className="text-sm text-on-surface-variant">{t.bank.lastUsed(date(connection.lastUsedAt))}</p>
        )}
        {connection.usage && (
          <p className="text-sm text-on-surface-variant">{t.bank.signInsToday(connection.usage.signInsToday)}</p>
        )}
      </div>

      {connection.status === 'invalid' && (
        <p role="alert" className="mt-3 rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container">
          {t.bank.invalidHelp}
        </p>
      )}
      {connection.status === 'exhausted' && connection.availableAgainAt && (
        <p className="mt-3 text-sm text-on-surface-variant">{t.bank.exhaustedUntil(date(connection.availableAgainAt))}</p>
      )}
      {connection.stale && <p className="mt-3 text-xs text-on-surface-variant">{t.bank.stale}</p>}

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </p>
      )}

      {accountsLoading && (
        <p role="status" className="mt-4 text-sm text-on-surface-variant">
          {t.bank.accountsLoading}
        </p>
      )}

      {accounts && (
        <section aria-label={t.bank.accountsTitle} className="mt-4" data-clarity-mask="true">
          <h3 className="text-sm font-medium text-on-surface">{t.bank.accountsTitle}</h3>
          {accounts.length === 0 ? (
            <p className="mt-1 text-sm text-on-surface-variant">{t.bank.accountsEmpty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-outline-variant/60">
              {accounts.map((account) => (
                <li key={account.numberMasked} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                  <span className="text-on-surface">
                    {account.name ? `${account.name} · ` : ''}
                    <span className={account.name ? 'text-on-surface-variant' : undefined}>
                      {t.bank.accountTypes[account.type]} {account.numberMasked}
                    </span>
                  </span>
                  {account.availableBalance !== null && (
                    <span className="tabular-nums text-on-surface">
                      <span className="mr-1 text-xs text-on-surface-variant">{t.bank.accountAvailable}</span>
                      {formatBalance(account.availableBalance, account.currency, dateLocale)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-on-surface-variant">{t.bank.accountsNote}</p>
        </section>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {connection.status !== 'invalid' && (
          <Button variant="tonal" onClick={toggleAccounts} disabled={accountsLoading || disconnecting}>
            {accounts ? t.bank.hideAccounts : t.bank.showAccounts}
          </Button>
        )}

        {confirming ? (
          <div role="group" aria-label={t.bank.disconnect} className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-on-surface">{t.bank.disconnectConfirm}</p>
            <Button variant="danger" onClick={disconnect} disabled={disconnecting}>
              {disconnecting ? t.bank.disconnecting : t.bank.disconnectYes}
            </Button>
            <Button variant="outlined" onClick={() => setConfirming(false)} disabled={disconnecting}>
              {t.bank.cancel}
            </Button>
          </div>
        ) : (
          <Button variant="outlined" onClick={() => setConfirming(true)} disabled={accountsLoading}>
            {t.bank.disconnect}
          </Button>
        )}
      </div>
    </Card>
  )
}
