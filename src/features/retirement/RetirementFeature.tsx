import { useState } from 'react'
import { Button } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { RetirementCharts } from './components/RetirementCharts'
import { RetirementParametersPanel } from './components/RetirementParametersPanel'
import { RetirementSchedule } from './components/RetirementSchedule'
import { RetirementSummary } from './components/RetirementSummary'
import { useRetirement } from './useRetirement'

/**
 * Retiro: projects an accumulation phase (working years, annual
 * contributions) into a withdrawal phase (retirement years, monthly income),
 * and reports what that income is worth after tax and after inflation. See
 * `src/lib/retirement.ts` for the model.
 */
export function RetirementFeature() {
  const retirement = useRetirement()
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        <Button variant="tonal" onClick={() => setShowReport(true)}>
          {t.common.viewReport}
        </Button>
      </div>
      <RetirementParametersPanel retirement={retirement} />
      <RetirementSummary retirement={retirement} />
      <RetirementCharts retirement={retirement} />
      <RetirementSchedule retirement={retirement} />

      <ReportView
        open={showReport}
        onClose={() => setShowReport(false)}
        featureTitle={t.app.tabs.retirement}
        parameters={[
          { label: t.retirement.startingBalance, value: formatCurrency(retirement.params.startingBalance) },
          {
            label: t.retirement.annualContribution,
            value: formatCurrency(retirement.params.annualContribution),
          },
          { label: t.retirement.currentAge, value: String(retirement.params.currentAge) },
          { label: t.retirement.retirementAge, value: String(retirement.params.retirementAge) },
          { label: t.retirement.retirementYears, value: String(retirement.params.retirementYears) },
          {
            label: t.retirement.growWithInflation,
            value: retirement.params.growContributionsWithInflation ? t.common.yes : t.common.no,
          },
          {
            label: t.retirement.taxDeferred,
            value: retirement.params.taxDeferred ? t.common.yes : t.common.no,
          },
          { label: t.retirement.returnBefore, value: formatPercent(retirement.params.returnBeforeRetirement) },
          { label: t.retirement.returnDuring, value: formatPercent(retirement.params.returnDuringRetirement) },
          { label: t.retirement.inflation, value: formatPercent(retirement.params.inflation) },
        ]}
        summary={<RetirementSummary retirement={retirement} />}
        charts={<RetirementCharts retirement={retirement} />}
        table={{
          columns: [t.common.category, t.retirement.colYear, t.retirement.colAge, t.common.value],
          rows: [
            ...retirement.accumulationSchedule.map((row) => [
              t.retirement.accumulationSection,
              row.year,
              row.age,
              formatCurrency(row.balance),
            ]),
            ...retirement.retirementSchedule.map((row) => [
              t.retirement.retirementSection,
              row.year,
              row.age,
              formatCurrency(row.remainingBalance),
            ]),
          ],
        }}
      />
    </div>
  )
}
