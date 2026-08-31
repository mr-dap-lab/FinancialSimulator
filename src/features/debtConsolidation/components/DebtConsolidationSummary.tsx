import { SummaryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import type { DebtConsolidationController } from '../useDebtConsolidation'

export function DebtConsolidationSummary({ debt }: { debt: DebtConsolidationController }) {
  const { currentPayment, consolidatedMonthlyPayment, currentMonths, totalInterestSavings } = debt
  const { formatCurrency } = useLocale()
  const t = useT()

  const monthlySavings = currentPayment - consolidatedMonthlyPayment

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-primary-container px-4 py-3 text-base leading-relaxed font-medium text-on-primary-container">
        {t.debtConsolidation.headline(formatCurrency(consolidatedMonthlyPayment))}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label={t.debtConsolidation.currentPayment} value={formatCurrency(currentPayment)} />
        <SummaryCard
          label={t.debtConsolidation.consolidatedPaymentCard}
          value={formatCurrency(consolidatedMonthlyPayment)}
          tone="accent"
        />
        <SummaryCard
          label={t.debtConsolidation.monthlySavings}
          value={formatCurrency(monthlySavings)}
          tone={monthlySavings >= 0 ? 'accent' : 'negative'}
        />
        <SummaryCard
          label={t.debtConsolidation.currentMonths}
          value={currentMonths === null ? t.common.never : String(currentMonths)}
        />
        <SummaryCard
          label={t.debtConsolidation.consolidatedMonths}
          value={String(debt.params.consolidated.months)}
        />
        <SummaryCard
          label={t.debtConsolidation.totalInterestSavings}
          value={totalInterestSavings === null ? t.common.none : formatCurrency(totalInterestSavings)}
          caption={t.debtConsolidation.totalInterestSavingsHint}
          tone={
            totalInterestSavings === null ? 'default' : totalInterestSavings >= 0 ? 'accent' : 'negative'
          }
        />
      </div>
    </div>
  )
}
