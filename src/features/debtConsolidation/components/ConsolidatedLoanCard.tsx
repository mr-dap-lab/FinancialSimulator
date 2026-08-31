import { Card, CurrencyInput, ParamField, PercentInput, Select, inputClass } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { CONSOLIDATED_TERM_OPTIONS } from '../../../lib/debtConsolidation'
import type { ConsolidatedLoan } from '../../../lib/debtConsolidation'

interface ConsolidatedLoanCardProps {
  consolidated: ConsolidatedLoan
  payment: number
  onChange: (patch: Partial<ConsolidatedLoan>) => void
}

export function ConsolidatedLoanCard({ consolidated, payment, onChange }: ConsolidatedLoanCardProps) {
  const { formatCurrency } = useLocale()
  const t = useT()

  const termOptions = CONSOLIDATED_TERM_OPTIONS.map((months) => ({
    value: String(months),
    label: t.debtConsolidation.termOption(months, Math.round(months / 12)),
  }))

  return (
    <Card variant="outlined" title={t.debtConsolidation.consolidatedTitle}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ParamField
          label={t.debtConsolidation.consolidatedBalance}
          helper={t.debtConsolidation.consolidatedBalanceHint}
          help={t.debtConsolidation.consolidatedBalanceHelp}
        >
          {(id) => (
            <CurrencyInput
              id={id}
              value={consolidated.balance}
              onChange={(value) => onChange({ balance: value })}
            />
          )}
        </ParamField>

        <ParamField
          label={t.debtConsolidation.consolidatedRate}
          helper={t.debtConsolidation.consolidatedRateHint}
          help={t.debtConsolidation.consolidatedRateHelp}
        >
          {(id) => (
            <PercentInput
              id={id}
              value={consolidated.rate}
              onChange={(value) => onChange({ rate: value })}
              decimals={2}
            />
          )}
        </ParamField>

        <ParamField label={t.debtConsolidation.consolidatedTerm} help={t.debtConsolidation.consolidatedTermHelp}>
          {(id) => (
            <Select
              id={id}
              value={String(consolidated.months)}
              onChange={(value) => onChange({ months: Number(value) })}
              options={termOptions}
            />
          )}
        </ParamField>

        <ParamField label={t.debtConsolidation.consolidatedPayment}>
          {(id) => (
            <div
              id={id}
              className={`${inputClass} flex items-center justify-end bg-surface-container text-on-surface`}
            >
              {formatCurrency(payment)}
            </div>
          )}
        </ParamField>
      </div>
    </Card>
  )
}
