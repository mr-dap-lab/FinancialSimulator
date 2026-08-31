import {
  Button,
  Card,
  Checkbox,
  CurrencyInput,
  Disclosure,
  IconButton,
  ParamField,
  PercentInput,
  inputClass,
} from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { toMonthlyRate } from '../../../lib/amortize'
import { MAX_CREDIT_CARD_DEBTS } from '../../../lib/limits'
import { monthsToPayoff, monthsToPayoffDeclining } from '../../../lib/debtConsolidation'
import type { CreditCardDebt } from '../../../lib/debtConsolidation'

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  </svg>
)

interface DebtCardsSectionProps {
  debts: CreditCardDebt[]
  subtotal: number
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, patch: Partial<CreditCardDebt>) => void
}

export function DebtCardsSection({ debts, subtotal, onAdd, onRemove, onUpdate }: DebtCardsSectionProps) {
  const { formatCurrency } = useLocale()
  const t = useT()
  const atLimit = debts.length >= MAX_CREDIT_CARD_DEBTS

  return (
    <Card
      title={t.debtConsolidation.cardsTitle}
      actions={
        <>
          <span className="text-sm font-medium text-on-surface">{formatCurrency(subtotal)}</span>
          <Button
            variant="tonal"
            onClick={onAdd}
            disabled={atLimit}
            title={atLimit ? t.debtConsolidation.cardLimitReached(MAX_CREDIT_CARD_DEBTS) : undefined}
          >
            + {t.debtConsolidation.addCard}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {debts.map((debt, index) => {
          const i = toMonthlyRate(debt.rate, 'NOMINAL_MV')
          const firstPayment = Math.max(debt.balance * debt.minimumPct, debt.minimumFloor)
          const fixedMonths = debt.useMinimumPayment
            ? null
            : monthsToPayoff(debt.balance, i, debt.payment)
          const decliningMonths = debt.useMinimumPayment
            ? monthsToPayoffDeclining(debt.balance, i, debt.minimumPct, debt.minimumFloor).months
            : null

          return (
            <div key={debt.id} className="space-y-3 rounded-md border border-outline-variant p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <ParamField label={t.debtConsolidation.balance} help={t.debtConsolidation.balanceHelp}>
                  {(id) => (
                    <CurrencyInput
                      id={id}
                      value={debt.balance}
                      onChange={(value) => onUpdate(debt.id, { balance: value })}
                    />
                  )}
                </ParamField>

                <ParamField label={t.debtConsolidation.rate} help={t.debtConsolidation.rateHelp}>
                  {(id) => (
                    <PercentInput
                      id={id}
                      value={debt.rate}
                      onChange={(value) => onUpdate(debt.id, { rate: value })}
                      decimals={2}
                    />
                  )}
                </ParamField>

                <ParamField
                  label={t.debtConsolidation.payment}
                  helper={
                    debt.useMinimumPayment
                      ? t.debtConsolidation.paymentHint
                      : fixedMonths === null
                        ? undefined
                        : `${t.debtConsolidation.monthsRemaining}: ${fixedMonths}`
                  }
                  error={!debt.useMinimumPayment && fixedMonths === null ? t.debtConsolidation.neverPaysOff : undefined}
                  help={t.debtConsolidation.paymentHelp}
                >
                  {(id) =>
                    debt.useMinimumPayment ? (
                      <div
                        id={id}
                        className={`${inputClass} flex items-center justify-end bg-surface-container text-on-surface-variant opacity-70`}
                      >
                        {formatCurrency(firstPayment)}
                      </div>
                    ) : (
                      <CurrencyInput
                        id={id}
                        value={debt.payment}
                        onChange={(value) => onUpdate(debt.id, { payment: value })}
                      />
                    )
                  }
                </ParamField>

                <div className="flex items-start justify-end lg:pt-6">
                  <IconButton
                    variant="danger"
                    aria-label={`${t.common.delete} ${t.debtConsolidation.cardsTitle} ${index + 1}`}
                    onClick={() => onRemove(debt.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </div>

              <Checkbox
                checked={debt.useMinimumPayment}
                onChange={(checked) => onUpdate(debt.id, { useMinimumPayment: checked })}
                label={t.debtConsolidation.useMinimumPayment}
              />

              {debt.useMinimumPayment && (
                <Disclosure title={t.debtConsolidation.advancedSettings}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ParamField
                      label={t.debtConsolidation.minimumPct}
                      helper={t.debtConsolidation.minimumPctHint}
                      help={t.debtConsolidation.minimumPctHelp}
                    >
                      {(id) => (
                        <PercentInput
                          id={id}
                          value={debt.minimumPct}
                          onChange={(value) => onUpdate(debt.id, { minimumPct: value })}
                        />
                      )}
                    </ParamField>

                    <ParamField
                      label={t.debtConsolidation.minimumFloor}
                      helper={t.debtConsolidation.minimumFloorHint}
                      help={t.debtConsolidation.minimumFloorHelp}
                    >
                      {(id) => (
                        <CurrencyInput
                          id={id}
                          value={debt.minimumFloor}
                          onChange={(value) => onUpdate(debt.id, { minimumFloor: value })}
                        />
                      )}
                    </ParamField>
                  </div>
                  {decliningMonths === null && (
                    <p className="mt-2 text-xs text-error">{t.debtConsolidation.neverPaysOff}</p>
                  )}
                </Disclosure>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
