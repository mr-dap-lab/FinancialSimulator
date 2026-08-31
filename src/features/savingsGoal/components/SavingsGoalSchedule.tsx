import { useMemo } from 'react'
import { Card, ExportCsvButton } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { savingsGoalToCsv } from '../../../lib/csv'
import { isNegative } from '../../../lib/format'
import type { SavingsGoalController } from '../useSavingsGoal'

/**
 * A plain year-by-year table, not `CollapsibleYearTable`: that component
 * groups *months* into collapsible *years*, and this feature has no months to
 * group — its horizon is a handful of years at most, exactly what the
 * reference itself reports by year. Nothing here needs collapsing or
 * virtualising.
 */
export function SavingsGoalSchedule({ goal }: { goal: SavingsGoalController }) {
  const { schedule, params } = goal
  const { formatCurrency } = useLocale()
  const t = useT()

  const filename = useMemo(
    () => `meta-de-ahorro-${Math.round(params.goal / 1_000_000)}M-${params.years}a.csv`,
    [params.goal, params.years],
  )

  const amountClass = (value: number) => `px-4 text-right tabular-nums ${isNegative(value) ? 'text-error' : 'text-on-surface-variant'}`

  return (
    <Card
      title={t.common.schedule}
      description={t.savingsGoal.scheduleHint(schedule.length)}
      bodyClassName="px-0 pb-0 pt-4"
      actions={
        <ExportCsvButton filename={filename} build={() => savingsGoalToCsv(schedule, params)} />
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-high text-xs font-medium text-on-surface-variant">
              <th className="h-14 border-b border-outline-variant px-4 text-left whitespace-nowrap">
                {t.savingsGoal.colYear}
              </th>
              <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                {t.savingsGoal.colBalanceAtContribution}
              </th>
              <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                {t.savingsGoal.colBalanceAtRequired}
              </th>
              <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                {t.savingsGoal.colDifferenceVsGoal}
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr
                key={row.year}
                className="border-b border-outline-variant/60 text-on-surface-variant"
                style={{ height: 44 }}
              >
                <td className="px-4 text-on-surface">{row.year}</td>
                <td className={amountClass(row.balanceAtContribution)}>
                  {formatCurrency(row.balanceAtContribution)}
                </td>
                <td className={amountClass(row.balanceAtRequired)}>
                  {formatCurrency(row.balanceAtRequired)}
                </td>
                <td className={amountClass(row.differenceVsGoal)}>
                  {formatCurrency(row.differenceVsGoal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
