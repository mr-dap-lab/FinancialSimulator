import { useMemo } from 'react'
import { CollapsibleYearTable, ExportCsvButton } from '../../../components/ui'
import type { YearTableColumn } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useI18n } from '../../../i18n/i18n'
import { cardToCsv } from '../../../lib/csv'
import { formatDate } from '../../../lib/dates'
import type { CardMonth } from '../../../lib/creditCard'
import type { CreditCardController } from '../useCreditCard'

const sumOf = (rows: CardMonth[], pick: (row: CardMonth) => number) =>
  rows.reduce((total, row) => total + pick(row), 0)

/** Header plus one line per plan, so the virtualiser knows the exact height. */
const DETAIL_ROW_HEIGHT = 26
const DETAIL_PADDING = 44

/** Good enough for a filename: an accented letter just becomes its own hyphen. */
const slugify = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function CardSchedule({ card }: { card: CreditCardController }) {
  const { rows, params, totals, cards, activeCardId } = card
  const activeCard = cards.find((entry) => entry.id === activeCardId) ?? cards[0]
  const { formatCurrency, formatPercent } = useLocale()
  const { t, dateLocale } = useI18n()

  const columns = useMemo<YearTableColumn<CardMonth>[]>(
    () => [
      {
        key: 'cutoffDate',
        header: t.card.colCutoff,
        align: 'left',
        render: (row) => (
          <span className="text-on-surface-variant">{formatDate(row.cutoffDate, dateLocale)}</span>
        ),
      },
      {
        key: 'dueDate',
        header: t.card.colDue,
        align: 'left',
        render: (row) => (
          <span className="text-on-surface-variant">{formatDate(row.dueDate, dateLocale)}</span>
        ),
      },
      {
        key: 'revolvingPurchases',
        header: t.card.colPurchases,
        cell: (row) => row.revolvingPurchases,
        subtotal: (group) => sumOf(group, (row) => row.revolvingPurchases),
      },
      {
        key: 'installmentCharges',
        header: t.card.colInstallments,
        cell: (row) => row.installmentCharges,
        subtotal: (group) => sumOf(group, (row) => row.installmentCharges),
      },
      {
        key: 'interest',
        header: t.card.colInterest,
        cell: (row) => row.interest,
        subtotal: (group) => sumOf(group, (row) => row.interest),
      },
      {
        key: 'fee',
        header: t.card.colFee,
        cell: (row) => row.fee,
        subtotal: (group) => sumOf(group, (row) => row.fee),
      },
      {
        key: 'payment',
        header: t.card.colPayment,
        cell: (row) => row.payment,
        subtotal: (group) => sumOf(group, (row) => row.payment),
      },
      {
        key: 'revolvingBalance',
        header: t.card.colRevolving,
        cell: (row) => row.revolvingBalance,
        subtotal: (group) => group[group.length - 1].revolvingBalance,
      },
      {
        key: 'totalBalance',
        header: t.card.colTotalBalance,
        cell: (row) => row.totalBalance,
        subtotal: (group) => group[group.length - 1].totalBalance,
        emphasize: true,
      },
      {
        key: 'utilization',
        header: t.card.colUtilization,
        render: (row) => (
          <span
            className={`tabular-nums ${
              row.utilization > 0.9
                ? 'font-medium text-error'
                : row.utilization > 0.7
                  ? 'text-tertiary'
                  : 'text-on-surface-variant'
            }`}
          >
            {formatPercent(row.utilization)}
          </span>
        ),
        renderSubtotal: (group) => (
          <span className="tabular-nums text-on-surface-variant">
            {formatPercent(group[group.length - 1].utilization)}
          </span>
        ),
      },
    ],
    [t, dateLocale, formatPercent],
  )

  const cardSlug = slugify(activeCard.name) || 'tarjeta'
  const filename = useMemo(
    () => `${cardSlug}-${params.strategy}-${params.months}m.csv`,
    [cardSlug, params.strategy, params.months],
  )

  return (
    <CollapsibleYearTable
      rows={rows}
      columns={columns}
      title={t.common.schedule}
      description={t.card.scheduleHint(rows.length)}
      minWidth="min-w-[80rem]"
      monthLabel={(row) => <span className="text-on-surface-variant">{row.month}</span>}
      rowClassName={(row) => (row.utilization > 1 ? 'bg-error-container/40' : '')}
      detailHeight={(row) => DETAIL_PADDING + Math.max(1, row.charges.length) * DETAIL_ROW_HEIGHT}
      renderDetail={(row) =>
        row.charges.length === 0 ? (
          <p className="text-xs text-on-surface-variant">{t.card.detailNone}</p>
        ) : (
          <div>
            <p className="mb-1.5 text-xs font-medium text-on-surface">
              {t.card.detailTitle(row.month)}
            </p>
            <table className="w-full text-xs">
              <tbody>
                {row.charges.map((charge) => (
                  <tr key={charge.planId} style={{ height: DETAIL_ROW_HEIGHT }}>
                    <td className="pr-3 text-on-surface">{charge.description}</td>
                    <td className="pr-3 text-on-surface-variant tabular-nums">
                      {charge.installment}/{charge.installments}
                    </td>
                    <td className="pr-3 text-right text-on-surface tabular-nums">
                      {formatCurrency(charge.amount)}
                    </td>
                    <td className="pr-3 text-right text-on-surface-variant tabular-nums">
                      {t.card.detailPrincipal(formatCurrency(charge.principal))}
                    </td>
                    <td className="pr-3 text-right text-on-surface-variant tabular-nums">
                      {t.card.detailInterest(formatCurrency(charge.interest))}
                    </td>
                    <td className="text-right text-on-surface-variant tabular-nums">
                      {t.card.detailRemaining(formatCurrency(charge.remainingPrincipal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      actions={
        <ExportCsvButton
          filename={filename}
          build={() =>
            cardToCsv(rows, params, totals, {
              name: activeCard.name.trim() || t.card.defaultCardName(1),
              franchise: activeCard.franchise,
            })
          }
        />
      }
    />
  )
}
