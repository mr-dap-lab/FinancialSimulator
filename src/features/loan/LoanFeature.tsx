import { useState } from 'react'
import { Button, FeatureIntro, LegalDisclaimer } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { LoanCharts } from './components/LoanCharts'
import { LoanParametersPanel } from './components/LoanParametersPanel'
import { LoanSchedule } from './components/LoanSchedule'
import { LoanSummary } from './components/LoanSummary'
import { useLoan } from './useLoan'

const LoanIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M12 2 2 7v2h20V7zM4 10v8H3v2h18v-2h-1v-8h-2v8h-3v-8h-2v8h-3v-8H8v8H6v-8z" />
  </svg>
)

const CONVENTION_LABEL_KEY = {
  EA: 'conventionShortEA',
  NOMINAL_MV: 'conventionShortNominal',
  MONTHLY: 'conventionShortMonthly',
} as const

const SYSTEM_LABEL_KEY = {
  french: 'systemFrench',
  german: 'systemGerman',
  bullet: 'systemBullet',
} as const

/**
 * Crédito: parameters, summary, charts, detail table.
 *
 * The feature owns its parameters through `useLoan`; only the locale setting is
 * shared, and that comes from context.
 */
export function LoanFeature() {
  const loan = useLoan()
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FeatureIntro
          icon={<LoanIcon />}
          title={t.loan.introTitle}
          description={t.loan.introDescription}
          className="flex-1"
        />
        <Button variant="tonal" onClick={() => setShowReport(true)} className="shrink-0">
          {t.common.viewReport}
        </Button>
      </div>
      <LoanParametersPanel loan={loan} />
      <LoanSummary loan={loan} />
      <LoanCharts loan={loan} />
      <LoanSchedule loan={loan} />
      <LegalDisclaimer />

      <ReportView
        open={showReport}
        onClose={() => setShowReport(false)}
        featureTitle={t.app.tabs.loan}
        parameters={[
          { label: t.loan.principal, value: formatCurrency(loan.params.principal) },
          {
            label: t.loan.rate,
            value: `${formatPercent(loan.params.rate, 2)} ${t.loan[CONVENTION_LABEL_KEY[loan.params.rateConvention]]}`,
          },
          { label: t.loan.term, value: `${loan.params.months} ${t.loan.termUnitMonths}` },
          { label: t.loan.system, value: t.loan[SYSTEM_LABEL_KEY[loan.params.system]] },
          { label: t.loan.graceMonths, value: String(loan.params.graceMonths) },
        ]}
        summary={<LoanSummary loan={loan} />}
        charts={<LoanCharts loan={loan} />}
        table={{
          columns: [t.common.month, t.loan.colPayment, t.loan.colInterest, t.loan.colPrincipal, t.loan.colBalance],
          rows: loan.rows.map((row) => [
            row.month,
            formatCurrency(row.totalPayment),
            formatCurrency(row.interest),
            formatCurrency(row.principalPaid),
            formatCurrency(row.balance),
          ]),
        }}
      />
    </div>
  )
}
