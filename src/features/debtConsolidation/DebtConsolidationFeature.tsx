import { useState } from 'react'
import { Button } from '../../components/ui'
import { ReportView } from '../../components/report/ReportView'
import { useLocale } from '../../context/locale'
import { useT } from '../../i18n/i18n'
import type { DebtRow } from '../../lib/debtConsolidation'
import { DebtConsolidationCharts } from './components/DebtConsolidationCharts'
import { DebtConsolidationParametersPanel } from './components/DebtConsolidationParametersPanel'
import { DebtConsolidationSchedule } from './components/DebtConsolidationSchedule'
import { DebtConsolidationSummary } from './components/DebtConsolidationSummary'
import { useDebtConsolidation } from './useDebtConsolidation'

/**
 * Consolidación de deudas: compares what you're currently paying across
 * several debts against one new consolidated loan. See
 * `src/lib/debtConsolidation.ts` for the two payment models this draws on —
 * `amortize()` for the consolidated loan, and a month-by-month simulation for
 * the credit card minimum-payment trap.
 */
export function DebtConsolidationFeature() {
  const debt = useDebtConsolidation()
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()
  const [showReport, setShowReport] = useState(false)

  const typeLabel = (row: DebtRow): string =>
    row.type === 'card' ? t.debtConsolidation.typeCard : row.type === 'auto' ? t.debtConsolidation.typeAuto : t.debtConsolidation.typeOther

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        <Button variant="tonal" onClick={() => setShowReport(true)}>
          {t.common.viewReport}
        </Button>
      </div>
      <DebtConsolidationParametersPanel debt={debt} />
      <DebtConsolidationSummary debt={debt} />
      <DebtConsolidationCharts debt={debt} />
      <DebtConsolidationSchedule debt={debt} />

      <ReportView
        open={showReport}
        onClose={() => setShowReport(false)}
        featureTitle={t.app.tabs.debtConsolidation}
        parameters={[
          {
            label: t.debtConsolidation.consolidatedBalance,
            value: formatCurrency(debt.params.consolidated.balance),
          },
          {
            label: t.debtConsolidation.consolidatedRate,
            value: formatPercent(debt.params.consolidated.rate, 2),
          },
          { label: t.debtConsolidation.consolidatedTerm, value: String(debt.params.consolidated.months) },
        ]}
        summary={<DebtConsolidationSummary debt={debt} />}
        charts={<DebtConsolidationCharts debt={debt} />}
        table={{
          columns: [
            t.debtConsolidation.colType,
            t.debtConsolidation.colDescription,
            t.debtConsolidation.colBalance,
            t.debtConsolidation.colPayment,
          ],
          rows: debt.rows.map((row) => [
            typeLabel(row),
            row.description || `${typeLabel(row)} #${row.categoryIndex}`,
            formatCurrency(row.balance),
            formatCurrency(row.payment),
          ]),
        }}
      />
    </div>
  )
}
