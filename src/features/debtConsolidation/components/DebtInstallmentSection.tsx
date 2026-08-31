import {
  Button,
  Card,
  CurrencyInput,
  IconButton,
  ParamField,
  PercentInput,
  TextInput,
} from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { toMonthlyRate } from '../../../lib/amortize'
import { monthsToPayoff } from '../../../lib/debtConsolidation'
import type { InstallmentDebt, OtherDebt } from '../../../lib/debtConsolidation'

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  </svg>
)

interface InstallmentSectionProps<T extends InstallmentDebt> {
  title: string
  subtotal: number
  debts: T[]
  atLimit: boolean
  limitMessage?: string
  addLabel: string
  emptyMessage?: string
  withDescription?: boolean
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, patch: Partial<T>) => void
}

export function DebtInstallmentSection<T extends InstallmentDebt & Partial<OtherDebt>>({
  title,
  subtotal,
  debts,
  atLimit,
  limitMessage,
  addLabel,
  emptyMessage,
  withDescription = false,
  onAdd,
  onRemove,
  onUpdate,
}: InstallmentSectionProps<T>) {
  const { formatCurrency } = useLocale()
  const t = useT()

  return (
    <Card
      title={title}
      actions={
        <>
          <span className="text-sm font-medium text-on-surface">{formatCurrency(subtotal)}</span>
          <Button variant="tonal" onClick={onAdd} disabled={atLimit} title={atLimit ? limitMessage : undefined}>
            + {addLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {debts.length === 0 && emptyMessage && (
          <p className="rounded-xs border border-dashed border-outline px-3 py-6 text-center text-xs text-on-surface-variant">
            {emptyMessage}
          </p>
        )}
        {debts.map((debt, index) => {
          const i = toMonthlyRate(debt.rate, 'NOMINAL_MV')
          const months = monthsToPayoff(debt.balance, i, debt.payment)

          return (
            <div
              key={debt.id}
              className="grid grid-cols-1 gap-4 rounded-md border border-outline-variant p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
            >
              {withDescription && (
                <ParamField
                  label={t.debtConsolidation.description}
                  className="lg:col-span-1"
                  help={t.debtConsolidation.descriptionHelp}
                >
                  {(id) => (
                    <TextInput
                      id={id}
                      value={debt.description ?? ''}
                      onChange={(value) => onUpdate(debt.id, { description: value } as Partial<T>)}
                    />
                  )}
                </ParamField>
              )}

              <ParamField label={t.debtConsolidation.balance} help={t.debtConsolidation.balanceHelp}>
                {(id) => (
                  <CurrencyInput
                    id={id}
                    value={debt.balance}
                    onChange={(value) => onUpdate(debt.id, { balance: value } as Partial<T>)}
                  />
                )}
              </ParamField>

              <ParamField label={t.debtConsolidation.rate} help={t.debtConsolidation.rateHelp}>
                {(id) => (
                  <PercentInput
                    id={id}
                    value={debt.rate}
                    onChange={(value) => onUpdate(debt.id, { rate: value } as Partial<T>)}
                    decimals={2}
                  />
                )}
              </ParamField>

              <ParamField
                label={t.debtConsolidation.monthlyPayment}
                helper={months === null ? undefined : `${t.debtConsolidation.monthsRemaining}: ${months}`}
                error={months === null ? t.debtConsolidation.neverPaysOff : undefined}
                help={t.debtConsolidation.paymentHelp}
              >
                {(id) => (
                  <CurrencyInput
                    id={id}
                    value={debt.payment}
                    onChange={(value) => onUpdate(debt.id, { payment: value } as Partial<T>)}
                  />
                )}
              </ParamField>

              <div className="flex items-start justify-end lg:pt-6">
                <IconButton
                  variant="danger"
                  aria-label={`${t.common.delete} ${title} ${index + 1}`}
                  onClick={() => onRemove(debt.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
