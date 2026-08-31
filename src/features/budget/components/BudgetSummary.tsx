import { SummaryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { isNegative } from '../../../lib/format'
import type { BudgetController } from '../useBudget'

export function BudgetSummary({ budget }: { budget: BudgetController }) {
  const { result } = budget
  const { formatCurrency } = useLocale()
  const t = useT()

  const totalDeductions = result.primary.totalDeductions + result.spouse.totalDeductions
  const negative = isNegative(result.availableToSave)

  return (
    <div className="space-y-3">
      <p className="rounded-md bg-primary-container px-4 py-3 text-base leading-relaxed font-medium text-on-primary-container">
        {t.budget.headline1Before(formatCurrency(result.totalExpenses))}{' '}
        <span className={negative ? 'text-error' : undefined}>{formatCurrency(result.availableToSave)}</span>{' '}
        {t.budget.headline1After}
      </p>
      <p className="rounded-md bg-primary-container px-4 py-3 text-base leading-relaxed font-medium text-on-primary-container">
        {t.budget.headline2(formatCurrency(result.totalNetIncome), formatCurrency(totalDeductions))}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label={t.budget.totalNetIncome} value={formatCurrency(result.totalNetIncome)} tone="accent" />
        <SummaryCard label={t.budget.totalExpenses} value={formatCurrency(result.totalExpenses)} />
        <SummaryCard
          label={t.budget.availableToSave}
          value={formatCurrency(result.availableToSave)}
          tone={negative ? 'negative' : 'accent'}
        />
      </div>
    </div>
  )
}
