import { useMemo } from 'react'
import { Card, CollapsibleYearTable, ExportCsvButton } from '../../../components/ui'
import type { YearTableColumn } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { debtConsolidationToCsv } from '../../../lib/csv'
import { isNegative } from '../../../lib/format'
import type { DebtRow } from '../../../lib/debtConsolidation'
import type { LoanRow } from '../../../lib/amortize'
import type { DebtConsolidationController } from '../useDebtConsolidation'

export function DebtConsolidationSchedule({ debt }: { debt: DebtConsolidationController }) {
  const { rows, consolidatedRows, params } = debt
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()

  const label = (row: DebtRow): string => {
    if (row.type === 'card') return t.debtConsolidation.cardLabel(row.categoryIndex)
    if (row.type === 'auto') return t.debtConsolidation.autoLabel(row.categoryIndex)
    return row.description
  }

  const typeLabel = (row: DebtRow): string =>
    row.type === 'card'
      ? t.debtConsolidation.typeCard
      : row.type === 'auto'
        ? t.debtConsolidation.typeAuto
        : t.debtConsolidation.typeOther

  const consolidatedColumns = useMemo<YearTableColumn<LoanRow>[]>(
    () => [
      {
        key: 'payment',
        header: t.loan.colPayment,
        cell: (row) => row.payment,
        subtotal: (group) => group.reduce((sum, row) => sum + row.payment, 0),
      },
      {
        key: 'interest',
        header: t.debtConsolidation.colInterest,
        cell: (row) => row.interest,
        subtotal: (group) => group.reduce((sum, row) => sum + row.interest, 0),
      },
      {
        key: 'principalPaid',
        header: t.debtConsolidation.colPrincipal,
        cell: (row) => row.principalPaid,
        subtotal: (group) => group.reduce((sum, row) => sum + row.principalPaid, 0),
      },
      {
        key: 'balance',
        header: t.retirement.colBalance,
        cell: (row) => row.balance,
        subtotal: (group) => group[group.length - 1].balance,
        emphasize: true,
      },
    ],
    [t],
  )

  const filename = useMemo(
    () => `consolidacion-deudas-${Math.round(params.consolidated.balance / 1_000_000)}M.csv`,
    [params.consolidated.balance],
  )

  const amountClass = (value: number) =>
    `px-4 text-right tabular-nums ${isNegative(value) ? 'text-error' : 'text-on-surface-variant'}`

  return (
    <div className="space-y-4">
      <Card
        title={t.debtConsolidation.detailTitle}
        description={t.debtConsolidation.detailHint(rows.length)}
        bodyClassName="px-0 pb-0 pt-4"
        actions={
          <ExportCsvButton
            filename={filename}
            build={() => debtConsolidationToCsv(rows, consolidatedRows, params.consolidated)}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-high text-xs font-medium text-on-surface-variant">
                <th className="h-14 border-b border-outline-variant px-4 text-left whitespace-nowrap">
                  {t.debtConsolidation.colType}
                </th>
                <th className="h-14 border-b border-outline-variant px-4 text-left whitespace-nowrap">
                  {t.debtConsolidation.colDescription}
                </th>
                <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                  {t.debtConsolidation.colBalance}
                </th>
                <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                  {t.debtConsolidation.colRate}
                </th>
                <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                  {t.debtConsolidation.colPayment}
                </th>
                <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                  {t.debtConsolidation.colMonths}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-outline-variant/60 text-on-surface-variant"
                  style={{ height: 44 }}
                >
                  <td className="px-4 text-on-surface">{typeLabel(row)}</td>
                  <td className="px-4 text-on-surface">{label(row)}</td>
                  <td className={amountClass(row.balance)}>{formatCurrency(row.balance)}</td>
                  <td className="px-4 text-right tabular-nums">{formatPercent(row.rate)}</td>
                  <td className={amountClass(row.payment)}>{formatCurrency(row.payment)}</td>
                  <td className="px-4 text-right tabular-nums">
                    {row.months === null ? t.common.never : row.months}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CollapsibleYearTable
        rows={consolidatedRows}
        columns={consolidatedColumns}
        title={t.debtConsolidation.consolidatedScheduleTitle}
        description={t.loan.scheduleHint(consolidatedRows.length)}
        defaultExpandedYears={[]}
        minWidth="min-w-[44rem]"
      />
    </div>
  )
}
