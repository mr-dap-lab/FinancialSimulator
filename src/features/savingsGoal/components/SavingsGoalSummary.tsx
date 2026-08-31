import { SummaryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import type { SavingsGoalController } from '../useSavingsGoal'

/**
 * The headline sentence's tone tracks the actual state, not just the happy
 * path: reaching the goal, already there, or genuinely never (worded to the
 * actual cause — no contribution and no return doing the work, versus a
 * contribution that is merely too slow within a 100-year horizon).
 */
function useHeadline(goal: SavingsGoalController) {
  const { params, result } = goal
  const t = useT()

  if (result.monthsToGoal === 0) {
    return { tone: 'success' as const, text: t.savingsGoal.headlineAlreadyMet }
  }
  if (result.monthsToGoal === null) {
    const neverGrows = params.monthlyContribution <= 0 && result.monthlyRate <= 0
    return {
      tone: 'error' as const,
      text: neverGrows ? t.savingsGoal.headlineNeverZero : t.savingsGoal.headlineNeverTooSlow,
    }
  }
  const years = Math.floor(result.monthsToGoal / 12)
  const months = result.monthsToGoal % 12
  return {
    tone: 'accent' as const,
    text: t.savingsGoal.headlineReachable(t.savingsGoal.duration(years, months)),
  }
}

const HEADLINE_STYLES = {
  accent: 'bg-primary-container text-on-primary-container',
  success: 'bg-success-container text-on-success-container',
  error: 'bg-error-container text-on-error-container',
}

export function SavingsGoalSummary({ goal }: { goal: SavingsGoalController }) {
  const { params, result } = goal
  const { formatCurrency } = useLocale()
  const t = useT()
  const headline = useHeadline(goal)

  return (
    <div className="space-y-4">
      <p
        role={headline.tone === 'error' ? 'alert' : undefined}
        className={`rounded-md px-4 py-3 text-base leading-relaxed font-medium ${HEADLINE_STYLES[headline.tone]}`}
      >
        {headline.text}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label={t.savingsGoal.goalCard} value={formatCurrency(params.goal)} tone="accent" />
        <SummaryCard
          label={t.savingsGoal.requiredContribution}
          value={formatCurrency(result.requiredContribution)}
          caption={t.savingsGoal.requiredContributionCaption(
            formatCurrency(params.monthlyContribution),
          )}
        />
        <SummaryCard
          label={t.savingsGoal.purchasingPower}
          value={formatCurrency(result.purchasingPowerToday)}
          caption={t.savingsGoal.purchasingPowerCaption}
        />
      </div>
    </div>
  )
}
