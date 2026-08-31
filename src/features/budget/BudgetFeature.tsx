import { useState } from 'react'
import { Button, FeatureIntro, LegalDisclaimer } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { budgetFieldLabel, budgetSectionLabel } from './budgetLabels'
import { BudgetCharts } from './components/BudgetCharts'
import { BudgetParametersPanel } from './components/BudgetParametersPanel'
import { BudgetSchedule } from './components/BudgetSchedule'
import { BudgetSummary } from './components/BudgetSummary'
import { useBudget } from './useBudget'

const BudgetIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M13 3.06V11h7.94A8 8 0 0 0 13 3.06zM11 5.06A8 8 0 1 0 18.94 13H11z" />
  </svg>
)

/**
 * Mi Presupuesto: how much you have left to save once every income and
 * expense is normalised to a monthly figure. Unlike every other feature in
 * this app there is almost no compounding math here — see
 * `src/lib/budget.ts` for the frequency-conversion model behind it.
 */
export function BudgetFeature() {
  const budget = useBudget()
  const { formatCurrency } = useLocale()
  const t = useT()
  const [showReport, setShowReport] = useState(false)

  const sectionLabel = budgetSectionLabel(t)
  const fieldLabel = budgetFieldLabel(t)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FeatureIntro
          icon={<BudgetIcon />}
          title={t.budget.introTitle}
          description={t.budget.introDescription}
          className="flex-1"
        />
        <Button variant="tonal" onClick={() => setShowReport(true)} className="shrink-0">
          {t.common.viewReport}
        </Button>
      </div>
      <BudgetParametersPanel budget={budget} />
      <BudgetSummary budget={budget} />
      <BudgetCharts budget={budget} />
      <BudgetSchedule budget={budget} />
      <LegalDisclaimer />

      <ReportView
        open={showReport}
        onClose={() => setShowReport(false)}
        featureTitle={t.app.tabs.budget}
        // Every input already has its own row in the detail table below — one
        // per non-zero field, per `buildBudgetRows` — so there's no separate
        // scalar-parameter recap to build here, unlike the other features.
        parameters={[]}
        summary={<BudgetSummary budget={budget} />}
        charts={<BudgetCharts budget={budget} />}
        table={{
          columns: [t.budget.colSection, t.budget.colConcept, t.budget.colMonthlyAmount],
          rows: budget.rows.map((row) => [
            sectionLabel[row.section] ?? row.section,
            fieldLabel[row.field] ?? row.field,
            formatCurrency(row.monthlyAmount),
          ]),
        }}
      />
    </div>
  )
}
