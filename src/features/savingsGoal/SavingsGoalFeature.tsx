import { useState } from 'react'
import { Button, FeatureIntro, LegalDisclaimer } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { SavingsGoalChart } from './components/SavingsGoalChart'
import { SavingsGoalParametersPanel } from './components/SavingsGoalParametersPanel'
import { SavingsGoalSchedule } from './components/SavingsGoalSchedule'
import { SavingsGoalSummary } from './components/SavingsGoalSummary'
import { useSavingsGoal } from './useSavingsGoal'

const SavingsGoalIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M6 21V3h1v2h11l-2.5 4L18 13H7v8z" />
  </svg>
)

/**
 * Meta de ahorro: parameters, summary, chart, detail table.
 *
 * Answers a different question than Ahorro — not "how much will a fixed
 * contribution grow to," but "how long until it reaches a target, and what
 * contribution would hit the target exactly on schedule." See
 * `src/lib/savingsGoal.ts` for the goal-seeking model behind it.
 */
export function SavingsGoalFeature() {
  const goal = useSavingsGoal()
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FeatureIntro
          icon={<SavingsGoalIcon />}
          title={t.savingsGoal.introTitle}
          description={t.savingsGoal.introDescription}
          className="flex-1"
        />
        <Button variant="tonal" onClick={() => setShowReport(true)} className="shrink-0">
          {t.common.viewReport}
        </Button>
      </div>
      <SavingsGoalParametersPanel goal={goal} />
      <SavingsGoalSummary goal={goal} />
      <SavingsGoalChart goal={goal} />
      <SavingsGoalSchedule goal={goal} />
      <LegalDisclaimer />

      <ReportView
        open={showReport}
        onClose={() => setShowReport(false)}
        featureTitle={t.app.tabs.savingsGoal}
        parameters={[
          { label: t.savingsGoal.goal, value: formatCurrency(goal.params.goal) },
          { label: t.savingsGoal.years, value: String(goal.params.years) },
          { label: t.savingsGoal.currentSavings, value: formatCurrency(goal.params.currentSavings) },
          {
            label: t.savingsGoal.monthlyContribution,
            value: formatCurrency(goal.params.monthlyContribution),
          },
          { label: t.savingsGoal.expectedReturn, value: formatPercent(goal.params.expectedReturn) },
          { label: t.savingsGoal.expectedInflation, value: formatPercent(goal.params.expectedInflation) },
        ]}
        summary={<SavingsGoalSummary goal={goal} />}
        charts={<SavingsGoalChart goal={goal} />}
        table={{
          columns: [
            t.savingsGoal.colYear,
            t.savingsGoal.colBalanceAtContribution,
            t.savingsGoal.colBalanceAtRequired,
            t.savingsGoal.colDifferenceVsGoal,
          ],
          rows: goal.schedule.map((row) => [
            row.year,
            formatCurrency(row.balanceAtContribution),
            formatCurrency(row.balanceAtRequired),
            formatCurrency(row.differenceVsGoal),
          ]),
        }}
      />
    </div>
  )
}
