import { useMemo, useState } from 'react'
import { Button, Card, ParamField, inputClass } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useI18n } from '../../../i18n/i18n'
import { IMPORT_FIELDS, diffProposal, isImportField, monthsBetween, proposeMonthly, splitField, toImportItems } from '../../../lib/bankImport'
import type { ImportFieldId, ImportItem } from '../../../lib/bankImport'
import type { BankAccount, BankConnection } from '../../../lib/bankTypes'
import { useAuth } from '../../auth/auth'
import { bankErrorMessage } from '../../bank/errorMessage'
import { useBankApi } from '../../bank/useBankApi'
import { applyImportChanges, currentImportValues } from '../applyBankImport'
import { budgetFieldLabel, budgetSectionLabel } from '../budgetLabels'
import type { BudgetController } from '../useBudget'

type Phase =
  | { name: 'closed' }
  | { name: 'loading' }
  | { name: 'noConnection'; invalid: boolean }
  | { name: 'setup'; connection: BankConnection; accounts: BankAccount[] }
  | { name: 'fetching'; connection: BankConnection; accounts: BankAccount[] }
  | { name: 'review'; connectionId: string; from: string; to: string; items: ImportItem[] }

const DAY_MS = 24 * 60 * 60 * 1000

/** UTC dates, because the server judges "not in the future" in UTC. */
function windowEndingToday(days: number): { from: string; to: string } {
  const now = Date.now()
  return {
    from: new Date(now - (days - 1) * DAY_MS).toISOString().slice(0, 10),
    to: new Date(now).toISOString().slice(0, 10),
  }
}

/**
 * "Importar desde Bancolombia" in Mi Presupuesto: fetches the user's real
 * expenses, proposes a category for each, and — only after the user reviews and
 * confirms — writes the resulting monthly figures into the budget. Nothing is
 * stored: the movements live in this component's state and are gone when it
 * closes. Renders nothing unless there is a real signed-in account to import with.
 */
export function BankImportPanel({ budget }: { budget: BudgetController }) {
  const { user, provider } = useAuth()
  if (provider !== 'supabase' || !user) return null
  return <ImportFlow budget={budget} />
}

function ImportFlow({ budget }: { budget: BudgetController }) {
  const { t } = useI18n()
  const api = useBankApi()
  const { formatCurrency } = useLocale()
  const [phase, setPhase] = useState<Phase>({ name: 'closed' })
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const open = async () => {
    setError(null)
    setNotice(null)
    setPhase({ name: 'loading' })
    try {
      const connections = await api.listConnections()
      const connection = connections[0]
      if (!connection) return setPhase({ name: 'noConnection', invalid: false })
      if (connection.status === 'invalid') return setPhase({ name: 'noConnection', invalid: true })
      const accounts = await api.accounts(connection.id)
      setPhase({ name: 'setup', connection, accounts })
    } catch (caught) {
      setError(bankErrorMessage(caught, t))
      setPhase({ name: 'closed' })
    }
  }

  const close = () => {
    setPhase({ name: 'closed' })
    setError(null)
  }

  const cancelReview = () => {
    if (phase.name === 'review') {
      // Best effort: the trail records that movements were looked at and nothing was applied.
      void api
        .recordImport({ connectionId: phase.connectionId, action: 'discarded', from: phase.from, to: phase.to, changes: [] })
        .catch(() => {})
    }
    close()
  }

  const fetchMovements = async (connection: BankConnection, account: string, days: number) => {
    if (phase.name !== 'setup') return
    const { accounts } = phase
    setError(null)
    setPhase({ name: 'fetching', connection, accounts })
    const { from, to } = windowEndingToday(days)
    try {
      const transactions = await api.transactions({ connectionId: connection.id, account, from, to })
      setPhase({ name: 'review', connectionId: connection.id, from, to, items: toImportItems(transactions) })
    } catch (caught) {
      setError(bankErrorMessage(caught, t))
      setPhase({ name: 'setup', connection, accounts })
    }
  }

  const apply = async (review: Extract<Phase, { name: 'review' }>, changes: ReturnType<typeof diffProposal>) => {
    setBusy(true)
    setError(null)
    try {
      // Record first, apply second: if the trail can't be written, the budget is not touched.
      await api.recordImport({ connectionId: review.connectionId, action: 'applied', from: review.from, to: review.to, changes })
      applyImportChanges(budget, changes)
      setNotice(t.bankImport.applied(changes.length))
      setPhase({ name: 'closed' })
    } catch (caught) {
      setError(bankErrorMessage(caught, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card
      title={t.bankImport.title}
      description={t.bankImport.description}
      actions={
        phase.name === 'closed' ? (
          <Button variant="tonal" onClick={open}>
            {t.bankImport.open}
          </Button>
        ) : undefined
      }
    >
      <div data-clarity-mask="true" className="space-y-4">
        <p className="text-xs text-on-surface-variant">{t.bankImport.note}</p>

        <p role="status" className="text-sm text-on-surface">
          {notice}
        </p>

        {error && (
          <p role="alert" className="rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}
          </p>
        )}

        {phase.name === 'loading' && <p role="status" className="text-sm text-on-surface-variant">{t.bankImport.loading}</p>}

        {phase.name === 'noConnection' && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-on-surface">
              {phase.invalid ? t.bankImport.invalidConnection : t.bankImport.noConnection}
            </p>
            <a href="#/conexiones" className="text-sm font-medium text-primary underline">
              {t.bankImport.goToConnection}
            </a>
            <Button variant="outlined" onClick={close}>
              {t.bankImport.cancel}
            </Button>
          </div>
        )}

        {(phase.name === 'setup' || phase.name === 'fetching') && (
          <SetupForm
            accounts={phase.accounts}
            busy={phase.name === 'fetching'}
            onSubmit={(account, days) => fetchMovements(phase.connection, account, days)}
            onCancel={close}
          />
        )}

        {phase.name === 'review' && (
          <Review
            review={phase}
            budget={budget}
            busy={busy}
            formatCurrency={formatCurrency}
            onApply={(changes) => apply(phase, changes)}
            onCancel={cancelReview}
          />
        )}
      </div>
    </Card>
  )
}

function SetupForm({
  accounts,
  busy,
  onSubmit,
  onCancel,
}: {
  accounts: BankAccount[]
  busy: boolean
  onSubmit: (account: string, days: number) => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  const [account, setAccount] = useState(accounts[0]?.numberMasked ?? '')
  const [days, setDays] = useState(90)

  return (
    <div className="space-y-4">
      <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
        <ParamField label={t.bankImport.account}>
          {(id) => (
            <select id={id} className={inputClass} value={account} onChange={(event) => setAccount(event.target.value)}>
              {accounts.map((entry) => (
                <option key={entry.numberMasked} value={entry.numberMasked} className="bg-surface-container text-on-surface">
                  {entry.name ?? t.bank.accountTypes[entry.type]} {entry.numberMasked}
                </option>
              ))}
            </select>
          )}
        </ParamField>
        <ParamField label={t.bankImport.period}>
          {(id) => (
            <select id={id} className={inputClass} value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={30} className="bg-surface-container text-on-surface">{t.bankImport.last30}</option>
              <option value={90} className="bg-surface-container text-on-surface">{t.bankImport.last90}</option>
            </select>
          )}
        </ParamField>
      </div>
      {busy && <p role="status" className="text-sm text-on-surface-variant">{t.bankImport.fetching}</p>}
      <div className="flex gap-3">
        <Button variant="filled" disabled={busy || !account} onClick={() => onSubmit(account, days)}>
          {t.bankImport.fetch}
        </Button>
        <Button variant="outlined" disabled={busy} onClick={onCancel}>
          {t.bankImport.cancel}
        </Button>
      </div>
    </div>
  )
}

function Review({
  review,
  budget,
  busy,
  formatCurrency,
  onApply,
  onCancel,
}: {
  review: Extract<Phase, { name: 'review' }>
  budget: BudgetController
  busy: boolean
  formatCurrency: (value: number) => string
  onApply: (changes: ReturnType<typeof diffProposal>) => void
  onCancel: () => void
}) {
  const { t, dateLocale } = useI18n()
  const [assigned, setAssigned] = useState<Record<number, ImportFieldId | null>>({})

  const sectionLabel = budgetSectionLabel(t)
  const fieldLabel = budgetFieldLabel(t)
  const labelOf = (id: ImportFieldId) => `${sectionLabel[splitField(id).section]} — ${fieldLabel[splitField(id).field]}`

  const items = useMemo(
    () => review.items.map((item) => (item.id in assigned ? { ...item, field: assigned[item.id] } : item)),
    [review.items, assigned],
  )
  const months = monthsBetween(review.from, review.to)
  const changes = useMemo(
    () => diffProposal(proposeMonthly(items, months), currentImportValues(budget.params)),
    [items, months, budget.params],
  )

  const sections = [...new Set(IMPORT_FIELDS.map((id) => splitField(id).section))]
  const date = (iso: string) => new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium' }).format(new Date(`${iso}T00:00:00`))

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-on-surface">{t.bankImport.reviewTitle}</h3>
        <p className="text-xs text-on-surface-variant">{t.bankImport.reviewHint(months.toFixed(1))}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{t.bankImport.noExpenses}</p>
      ) : (
        <div className="max-h-96 overflow-auto rounded-md border border-outline-variant/60">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="sticky top-0 bg-surface-high">
              <tr className="text-left text-xs font-medium text-on-surface-variant">
                <th className="px-3 py-2">{t.bankImport.colDate}</th>
                <th className="px-3 py-2">{t.bankImport.colDescription}</th>
                <th className="px-3 py-2 text-right">{t.bankImport.colAmount}</th>
                <th className="px-3 py-2">{t.bankImport.colCategory}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-outline-variant/60">
                  <td className="px-3 py-1.5 whitespace-nowrap text-on-surface-variant">{date(item.date)}</td>
                  <td className="px-3 py-1.5 text-on-surface">{item.description}</td>
                  <td className="px-3 py-1.5 text-right whitespace-nowrap tabular-nums text-on-surface">{formatCurrency(item.amount)}</td>
                  <td className="px-3 py-1.5">
                    <select
                      aria-label={t.bankImport.categoryOf(item.description)}
                      className={`${inputClass} h-9`}
                      value={item.field ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        setAssigned((previous) => ({ ...previous, [item.id]: isImportField(value) ? value : null }))
                      }}
                    >
                      <option value="" className="bg-surface-container text-on-surface">{t.bankImport.skip}</option>
                      {sections.map((section) => (
                        <optgroup key={section} label={sectionLabel[section]}>
                          {IMPORT_FIELDS.filter((id) => splitField(id).section === section).map((id) => (
                            <option key={id} value={id} className="bg-surface-container text-on-surface">
                              {fieldLabel[splitField(id).field]}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-on-surface">{t.bankImport.changesTitle}</h3>
        {changes.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{t.bankImport.noChanges}</p>
        ) : (
          <ul className="mt-1 divide-y divide-outline-variant/60 text-sm">
            {changes.map((change) => (
              <li key={change.field} className="flex flex-wrap items-baseline justify-between gap-2 py-1.5">
                <span className="text-on-surface">{labelOf(change.field as ImportFieldId)}</span>
                <span className="tabular-nums text-on-surface-variant">
                  {formatCurrency(change.before)} → <span className="text-on-surface">{formatCurrency(change.after)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="filled" disabled={busy || changes.length === 0} onClick={() => onApply(changes)}>
          {busy ? t.bankImport.applying : t.bankImport.apply}
        </Button>
        <Button variant="outlined" disabled={busy} onClick={onCancel}>
          {t.bankImport.cancel}
        </Button>
      </div>
    </div>
  )
}
