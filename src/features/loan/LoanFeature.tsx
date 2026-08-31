import { useState } from 'react'
import { Button } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import { LoanCharts } from './components/LoanCharts'
import { LoanParametersPanel } from './components/LoanParametersPanel'
import { LoanSchedule } from './components/LoanSchedule'
import { LoanSummary } from './components/LoanSummary'
import { useLoan } from './useLoan'

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
      <div className="flex justify-end">
        <Button variant="tonal" onClick={() => setShowReport(true)}>
          {t.common.viewReport}
        </Button>
      </div>
      <LoanParametersPanel loan={loan} />
      <LoanSummary loan={loan} />
      <LoanCharts loan={loan} />
      <LoanSchedule loan={loan} />

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
