import { useState } from 'react'
import { Button } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { SavingsCharts } from './components/SavingsCharts'
import { SavingsParametersPanel } from './components/SavingsParametersPanel'
import { SavingsSchedule } from './components/SavingsSchedule'
import { SavingsSummary } from './components/SavingsSummary'
import { useSavings } from './useSavings'

/**
 * Ahorro: parameters, summary, charts, detail table.
 *
 * The feature owns its parameters through `useSavings`; only the locale setting
 * is shared, and that comes from context.
 */
export function SavingsFeature() {
  const savings = useSavings()
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
      <SavingsParametersPanel savings={savings} />
      <SavingsSummary savings={savings} />
      <SavingsCharts savings={savings} />
      <SavingsSchedule savings={savings} />

      <ReportView
        open={showReport}
        onClose={() => setShowReport(false)}
        featureTitle={t.app.tabs.savings}
        parameters={[
          { label: t.savings.monthlyContribution, value: formatCurrency(savings.params.monthlyContribution) },
          { label: t.savings.annualRate, value: formatPercent(savings.params.annualRate) },
          { label: t.savings.withholding, value: formatPercent(savings.params.withholdingRate) },
          { label: t.savings.years, value: String(savings.params.years) },
          { label: t.savings.growth, value: formatPercent(savings.params.contributionGrowth) },
          {
            label: t.savings.realCompounding,
            value: savings.params.realMonthlyCompounding ? t.common.yes : t.common.no,
          },
        ]}
        summary={<SavingsSummary savings={savings} />}
        charts={<SavingsCharts savings={savings} />}
        table={{
          columns: [t.common.month, t.savings.colContribution, t.savings.colNetInterest, t.savings.colBalance],
          rows: savings.rows.map((row) => [
            row.month,
            formatCurrency(row.contribution),
            formatCurrency(row.monthlyInterest),
            formatCurrency(row.balance),
          ]),
        }}
      />
    </div>
  )
}
