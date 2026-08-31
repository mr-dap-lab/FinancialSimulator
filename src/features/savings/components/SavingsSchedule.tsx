import { useMemo } from 'react'
import { CollapsibleYearTable, ExportCsvButton } from '../../../components/ui'
import type { YearTableColumn } from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import { savingsToCsv } from '../../../lib/csv'
import type { SavingsRow } from '../../../lib/simulate'
import type { SavingsController } from '../useSavings'

/**
 * The per-month interest figures are annualised, so a year subtotal has to sum
 * the monthly share (value / 12) rather than the annualised numbers, which
 * would be twelve times too large.
 */
const monthlyShare = (rows: SavingsRow[], pick: (row: SavingsRow) => number): number =>
  rows.reduce((sum, row) => sum + pick(row) / 12, 0)

const columnsFor = (t: ReturnType<typeof useT>): YearTableColumn<SavingsRow>[] => [
  {
    key: 'contribution',
    header: t.savings.colContribution,
    cell: (row) => row.contribution,
    subtotal: (rows) => rows.reduce((sum, row) => sum + row.contribution, 0),
  },
  {
    key: 'grossAnnualInterest',
    header: t.savings.colGrossInterest,
    cell: (row) => row.grossAnnualInterest,
    subtotal: (rows) => monthlyShare(rows, (row) => row.grossAnnualInterest),
  },
  {
    key: 'withholding',
    header: t.savings.colWithholding,
    cell: (row) => row.withholding,
    subtotal: (rows) => monthlyShare(rows, (row) => row.withholding),
  },
  {
    key: 'netAnnualInterest',
    header: t.savings.colNetInterest,
    cell: (row) => row.netAnnualInterest,
    subtotal: (rows) => monthlyShare(rows, (row) => row.netAnnualInterest),
  },
  {
    key: 'monthlyInterest',
    header: t.savings.colMonthlyInterest,
    cell: (row) => row.monthlyInterest,
    subtotal: (rows) => rows.reduce((sum, row) => sum + row.monthlyInterest, 0),
  },
  {
    key: 'balance',
    header: t.savings.colBalance,
    cell: (row) => row.balance,
    // The balance is a running total, so the year's figure is its last month.
    subtotal: (rows) => rows[rows.length - 1].balance,
    emphasize: true,
  },
]

export function SavingsSchedule({ savings }: { savings: SavingsController }) {
  const { rows, params } = savings
  const t = useT()
  const columns = useMemo(() => columnsFor(t), [t])

  const filename = useMemo(
    () => `simulacion-ahorro-${params.years}a-${Math.round(params.annualRate * 1000) / 10}pct.csv`,
    [params.years, params.annualRate],
  )

  return (
    <CollapsibleYearTable
      rows={rows}
      columns={columns}
      title={t.common.schedule}
      description={t.savings.scheduleHint(rows.length)}
      actions={
        <ExportCsvButton filename={filename} build={() => savingsToCsv(rows, params)} />
      }
    />
  )
}
