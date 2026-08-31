import { useState } from 'react'
import { Button, FeatureIntro, LegalDisclaimer } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { SavingsCharts } from './components/SavingsCharts'
import { SavingsParametersPanel } from './components/SavingsParametersPanel'
import { SavingsSchedule } from './components/SavingsSchedule'
import { SavingsSummary } from './components/SavingsSummary'
import { useSavings } from './useSavings'

const SavingsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M4 20h3v-7H4zm6.5 0h3V9h-3zM17 20h3V4h-3z" />
  </svg>
)

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FeatureIntro
          icon={<SavingsIcon />}
          title={t.savings.introTitle}
          description={t.savings.introDescription}
          className="flex-1"
        />
        <Button variant="tonal" onClick={() => setShowReport(true)} className="shrink-0">
          {t.common.viewReport}
        </Button>
      </div>
      <SavingsParametersPanel savings={savings} />
      <SavingsSummary savings={savings} />
      <SavingsCharts savings={savings} />
      <SavingsSchedule savings={savings} />
      <LegalDisclaimer />

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
