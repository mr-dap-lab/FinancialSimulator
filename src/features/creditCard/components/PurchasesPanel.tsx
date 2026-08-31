import {
  Button,
  Card,
  Checkbox,
  CurrencyInput,
  IconButton,
  NumberInput,
  TextInput,
} from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { MAX_DEFERRED_PURCHASES, MAX_RECURRING_EXPENSES } from '../../../lib/limits'
import { makeDeferredPurchase, makeRecurringExpense } from '../../../lib/creditCard'
import type { DeferredPurchase, RecurringExpense } from '../../../lib/creditCard'
import { WarningList } from '../../shared/WarningList'
import type { CreditCardController } from '../useCreditCard'

/** Colour of the utilisation meter, by how much of the limit is in use. */
function meterTone(utilization: number): { bar: string; text: string } {
  if (utilization > 0.9) return { bar: 'bg-error', text: 'text-error' }
  if (utilization > 0.7) return { bar: 'bg-tertiary', text: 'text-tertiary' }
  return { bar: 'bg-primary', text: 'text-primary' }
}

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  </svg>
)

export function PurchasesPanel({ card }: { card: CreditCardController }) {
  const { params, update, rows, totals, warnings } = card
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()

  const current = rows[0]?.totalBalance ?? 0
  const utilization = params.creditLimit > 0 ? current / params.creditLimit : 0
  const tone = meterTone(utilization)
  const purchasesAtLimit = params.deferredPurchases.length >= MAX_DEFERRED_PURCHASES
  const recurringAtLimit = params.recurringExpenses.length >= MAX_RECURRING_EXPENSES

  const replacePurchase = (id: string, patch: Partial<DeferredPurchase>) =>
    update({
      deferredPurchases: params.deferredPurchases.map((purchase) =>
        purchase.id === id ? { ...purchase, ...patch } : purchase,
      ),
    })

  const replaceExpense = (id: string, patch: Partial<RecurringExpense>) =>
    update({
      recurringExpenses: params.recurringExpenses.map((expense) =>
        expense.id === id ? { ...expense, ...patch } : expense,
      ),
    })

  const messages = warnings.map((warning) => {
    if (warning.code === 'purchasesBeyondHorizon')
      return t.card.purchasesBeyondHorizon(warning.months)
    if (warning.code === 'invertedRange') return t.card.invertedRange
    return t.card.overLimitWarning(warning.month)
  })

  return (
    <Card title={t.card.purchases} description={t.card.purchasesHint}>
      {/* Utilisation meter */}
      <div className="mb-6 rounded-md bg-surface-container p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-on-surface">{t.card.utilization}</span>
          <span className={`text-sm font-medium tabular-nums ${tone.text}`}>
            {t.card.utilizationOf(
              formatCurrency(current),
              formatCurrency(params.creditLimit),
              formatPercent(utilization),
            )}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className={`h-full rounded-full transition-all ${tone.bar}`}
            style={{ width: `${Math.min(100, utilization * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          {t.card.peakUtilization(formatPercent(totals.peakUtilization))}
          {totals.overLimitMonth !== null && (
            <span className="ml-1 font-medium text-error">
              {t.card.overLimitAt(totals.overLimitMonth)}
            </span>
          )}
        </p>
      </div>

      {/* Instalment purchases */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-on-surface">{t.card.deferredPurchases}</h3>
          <Button
            variant="tonal"
            className="ml-auto"
            disabled={purchasesAtLimit}
            title={
              purchasesAtLimit ? t.card.purchaseLimitReached(MAX_DEFERRED_PURCHASES) : undefined
            }
            onClick={() => {
              if (purchasesAtLimit) return
              update({
                deferredPurchases: [
                  ...params.deferredPurchases,
                  makeDeferredPurchase(t.card.newPurchase, 1_000_000, 1, 12, false),
                ],
              })
            }}
          >
            + {t.card.addPurchase}
          </Button>
        </div>

        {params.deferredPurchases.length === 0 ? (
          <p className="rounded-xs border border-dashed border-outline px-3 py-6 text-center text-xs text-on-surface-variant">
            {t.card.noPurchases}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-on-surface-variant">
                  <th className="pb-2 pr-3">{t.card.description}</th>
                  <th className="pb-2 pr-3">{t.card.amount}</th>
                  <th className="pb-2 pr-3">{t.card.purchaseMonth}</th>
                  <th className="pb-2 pr-3">{t.card.installments}</th>
                  <th className="pb-2 pr-3">{t.card.interestFree}</th>
                  <th className="w-12 pb-2" />
                </tr>
              </thead>
              <tbody>
                {params.deferredPurchases.map((purchase, index) => (
                  <tr key={purchase.id} className="align-top">
                    <td className="py-1.5 pr-3">
                      <TextInput
                        ariaLabel={t.card.description}
                        value={purchase.description}
                        onChange={(value) => replacePurchase(purchase.id, { description: value })}
                      />
                    </td>
                    <td className="w-44 py-1.5 pr-3">
                      <CurrencyInput
                        ariaLabel={t.card.amount}
                        value={purchase.amount}
                        onChange={(value) => replacePurchase(purchase.id, { amount: value })}
                      />
                    </td>
                    <td className="w-28 py-1.5 pr-3">
                      <NumberInput
                        ariaLabel={t.card.purchaseMonth}
                        value={purchase.purchaseMonth}
                        onChange={(value) =>
                          replacePurchase(purchase.id, { purchaseMonth: Math.round(value) })
                        }
                        min={1}
                        max={params.months}
                        decimals={0}
                      />
                    </td>
                    <td className="w-28 py-1.5 pr-3">
                      <NumberInput
                        ariaLabel={t.card.installments}
                        value={purchase.installments}
                        onChange={(value) =>
                          replacePurchase(purchase.id, { installments: Math.round(value) })
                        }
                        min={1}
                        max={48}
                        decimals={0}
                      />
                    </td>
                    <td className="py-1.5 pr-3">
                      <div className="mt-2">
                        <Checkbox
                          ariaLabel={t.card.interestFree}
                          checked={purchase.interestFree}
                          onChange={(checked) =>
                            replacePurchase(purchase.id, { interestFree: checked })
                          }
                        />
                      </div>
                    </td>
                    <td className="py-1.5">
                      <IconButton
                        variant="danger"
                        aria-label={`${t.common.delete} ${index + 1}`}
                        className="mt-2"
                        onClick={() =>
                          update({
                            deferredPurchases: params.deferredPurchases.filter(
                              (item) => item.id !== purchase.id,
                            ),
                          })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recurring expenses */}
      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-medium text-on-surface">{t.card.recurring}</h3>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              {t.card.defaultInstallments}
              <span className="w-20">
                <NumberInput
                  ariaLabel={t.card.defaultInstallments}
                  value={params.defaultInstallments}
                  onChange={(value) => update({ defaultInstallments: Math.round(value) })}
                  min={1}
                  max={48}
                  decimals={0}
                />
              </span>
            </label>
            <Button
              variant="tonal"
              disabled={recurringAtLimit}
              title={
                recurringAtLimit
                  ? t.card.recurringLimitReached(MAX_RECURRING_EXPENSES)
                  : undefined
              }
              onClick={() => {
                if (recurringAtLimit) return
                update({
                  recurringExpenses: [
                    ...params.recurringExpenses,
                    makeRecurringExpense(t.card.newRecurring, 200_000, 1, params.months, false),
                  ],
                })
              }}
            >
              + {t.card.addRecurring}
            </Button>
          </div>
        </div>

        {params.recurringExpenses.length === 0 ? (
          <p className="rounded-xs border border-dashed border-outline px-3 py-6 text-center text-xs text-on-surface-variant">
            {t.card.noRecurring}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-on-surface-variant">
                  <th className="pb-2 pr-3">{t.card.description}</th>
                  <th className="pb-2 pr-3">{t.card.monthlyAmount}</th>
                  <th className="pb-2 pr-3">{t.card.startMonth}</th>
                  <th className="pb-2 pr-3">{t.card.endMonth}</th>
                  <th className="pb-2 pr-3">{t.card.defer}</th>
                  <th className="w-12 pb-2" />
                </tr>
              </thead>
              <tbody>
                {params.recurringExpenses.map((expense, index) => (
                  <tr key={expense.id} className="align-top">
                    <td className="py-1.5 pr-3">
                      <TextInput
                        ariaLabel={t.card.description}
                        value={expense.description}
                        onChange={(value) => replaceExpense(expense.id, { description: value })}
                      />
                    </td>
                    <td className="w-44 py-1.5 pr-3">
                      <CurrencyInput
                        ariaLabel={t.card.monthlyAmount}
                        value={expense.monthlyAmount}
                        onChange={(value) => replaceExpense(expense.id, { monthlyAmount: value })}
                      />
                    </td>
                    <td className="w-28 py-1.5 pr-3">
                      <NumberInput
                        ariaLabel={t.card.startMonth}
                        value={expense.startMonth}
                        onChange={(value) =>
                          replaceExpense(expense.id, { startMonth: Math.round(value) })
                        }
                        min={1}
                        max={params.months}
                        decimals={0}
                      />
                    </td>
                    <td className="w-28 py-1.5 pr-3">
                      <NumberInput
                        ariaLabel={t.card.endMonth}
                        value={expense.endMonth}
                        onChange={(value) =>
                          replaceExpense(expense.id, { endMonth: Math.round(value) })
                        }
                        min={1}
                        max={params.months}
                        decimals={0}
                      />
                    </td>
                    <td className="py-1.5 pr-3">
                      <div className="mt-2">
                        <Checkbox
                          ariaLabel={t.card.defer}
                          checked={expense.defer}
                          onChange={(checked) => replaceExpense(expense.id, { defer: checked })}
                        />
                      </div>
                    </td>
                    <td className="py-1.5">
                      <IconButton
                        variant="danger"
                        aria-label={`${t.common.delete} ${index + 1}`}
                        className="mt-2"
                        onClick={() =>
                          update({
                            recurringExpenses: params.recurringExpenses.filter(
                              (item) => item.id !== expense.id,
                            ),
                          })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4">
        <WarningList messages={messages} />
      </div>
    </Card>
  )
}
