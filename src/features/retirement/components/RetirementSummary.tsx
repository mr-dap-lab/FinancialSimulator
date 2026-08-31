import { SummaryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import type { RetirementController } from '../useRetirement'

export function RetirementSummary({ retirement }: { retirement: RetirementController }) {
  const { result } = retirement
  const { formatCurrency } = useLocale()
  const t = useT()

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-primary-container px-4 py-3 text-base leading-relaxed font-medium text-on-primary-container">
        {t.retirement.headline(formatCurrency(result.monthlyIncomeToday))}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label={t.retirement.balanceAtRetirement}
          value={formatCurrency(result.balanceAtRetirement)}
          tone="accent"
        />
        <SummaryCard
          label={t.retirement.monthlyIncomeBeforeTax}
          value={formatCurrency(result.monthlyIncomeBeforeTax)}
        />
        <SummaryCard
          label={t.retirement.monthlyIncomeAfterTax}
          value={formatCurrency(result.monthlyIncomeAfterTax)}
        />
        <SummaryCard
          label={t.retirement.monthlyIncomeToday}
          value={formatCurrency(result.monthlyIncomeToday)}
        />
      </div>
    </div>
  )
}
