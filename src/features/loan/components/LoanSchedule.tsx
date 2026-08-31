import { useMemo } from 'react'
import { CollapsibleYearTable, ExportCsvButton } from '../../../components/ui'
import type { YearTableColumn } from '../../../components/ui'
import { useI18n } from '../../../i18n/i18n'
import { loanToCsv } from '../../../lib/csv'
import { formatDate } from '../../../lib/dates'
import type { LoanRow } from '../../../lib/amortize'
import type { LoanController } from '../useLoan'

const sumOf = (rows: LoanRow[], pick: (row: LoanRow) => number) =>
  rows.reduce((total, row) => total + pick(row), 0)

export function LoanSchedule({ loan }: { loan: LoanController }) {
  const { rows, params } = loan
  const { t, dateLocale } = useI18n()

  const columns = useMemo<YearTableColumn<LoanRow>[]>(
    () => [
      {
        key: 'date',
        header: t.common.date,
        align: 'left',
        render: (row) => (
          <span className="text-on-surface-variant">{formatDate(row.date, dateLocale)}</span>
        ),
      },
      {
        key: 'payment',
        header: t.loan.colPayment,
        cell: (row) => row.payment,
        subtotal: (group) => sumOf(group, (row) => row.payment),
      },
      {
        key: 'interest',
        header: t.loan.colInterest,
        cell: (row) => row.interest,
        subtotal: (group) => sumOf(group, (row) => row.interest),
      },
      {
        key: 'principalPaid',
        header: t.loan.colPrincipal,
        cell: (row) => row.principalPaid,
        subtotal: (group) => sumOf(group, (row) => row.principalPaid),
      },
      {
        key: 'extraPayment',
        header: t.loan.colExtra,
        cell: (row) => row.extraPayment,
        subtotal: (group) => sumOf(group, (row) => row.extraPayment),
      },
      {
        key: 'insurance',
        header: t.loan.colInsurance,
        cell: (row) => row.insurance,
        subtotal: (group) => sumOf(group, (row) => row.insurance),
      },
      {
        key: 'totalPayment',
        header: t.loan.colTotalPayment,
        cell: (row) => row.totalPayment,
        subtotal: (group) => sumOf(group, (row) => row.totalPayment),
      },
      {
        key: 'balance',
        header: t.loan.colBalance,
        cell: (row) => row.balance,
        // A running balance: the year's figure is its last month, not a sum.
        subtotal: (group) => group[group.length - 1].balance,
        emphasize: true,
      },
    ],
    [t, dateLocale],
  )

  const filename = useMemo(
    () =>
      `credito-${Math.round(params.principal / 1_000_000)}M-${params.months}m-${params.system}.csv`,
    [params.principal, params.months, params.system],
  )

  return (
    <CollapsibleYearTable
      rows={rows}
      columns={columns}
      title={t.common.schedule}
      description={t.loan.scheduleHint(rows.length)}
      minWidth="min-w-[68rem]"
      monthLabel={(row) => (
        <span className="text-on-surface-variant">
          {row.month}
          {row.isGrace && <span className="ml-1 text-tertiary">{t.loan.graceBadge}</span>}
        </span>
      )}
      rowClassName={(row) =>
        row.extraPayment > 0 ? 'bg-success-container/40' : ''
      }
      actions={<ExportCsvButton filename={filename} build={() => loanToCsv(rows, params)} />}
    />
  )
}
