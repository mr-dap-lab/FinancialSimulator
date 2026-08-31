import { useMemo } from 'react'
import { Card, Disclosure, ExportCsvButton } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { retirementToCsv } from '../../../lib/csv'
import type { RetirementController } from '../useRetirement'

/**
 * Two independent sections — accumulation and withdrawal don't share a
 * timeline, so each is its own flat year-by-year table (same reasoning as
 * `SavingsGoalSchedule`: no months to group, `CollapsibleYearTable` doesn't
 * apply) inside its own `<details>`.
 */
export function RetirementSchedule({ retirement }: { retirement: RetirementController }) {
  const { params, accumulationSchedule, retirementSchedule } = retirement
  const { formatCurrency } = useLocale()
  const t = useT()

  const filename = useMemo(
    () => `retiro-${params.currentAge}-${params.retirementAge}.csv`,
    [params.currentAge, params.retirementAge],
  )

  return (
    <Card
      title={t.common.schedule}
      bodyClassName="p-4 sm:p-6"
      actions={
        <ExportCsvButton
          filename={filename}
          build={() => retirementToCsv(accumulationSchedule, retirementSchedule, params)}
        />
      }
    >
      <div className="space-y-3">
        <Disclosure
          title={t.retirement.accumulationSection}
          summary={t.retirement.accumulationScheduleHint(accumulationSchedule.length)}
          defaultOpen
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="text-xs font-medium text-on-surface-variant">
                  <th className="h-10 border-b border-outline-variant px-3 text-left whitespace-nowrap">
                    {t.retirement.colYear}
                  </th>
                  <th className="h-10 border-b border-outline-variant px-3 text-left whitespace-nowrap">
                    {t.retirement.colAge}
                  </th>
                  <th className="h-10 border-b border-outline-variant px-3 text-right whitespace-nowrap">
                    {t.retirement.colContribution}
                  </th>
                  <th className="h-10 border-b border-outline-variant px-3 text-right whitespace-nowrap">
                    {t.retirement.colBalance}
                  </th>
                </tr>
              </thead>
              <tbody>
                {accumulationSchedule.map((row) => (
                  <tr
                    key={row.year}
                    className="border-b border-outline-variant/60 text-on-surface-variant"
                    style={{ height: 40 }}
                  >
                    <td className="px-3 text-on-surface">{row.year}</td>
                    <td className="px-3 text-on-surface">{row.age}</td>
                    <td className="px-3 text-right tabular-nums">{formatCurrency(row.contribution)}</td>
                    <td className="px-3 text-right tabular-nums">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>

        <Disclosure
          title={t.retirement.retirementSection}
          summary={t.retirement.retirementScheduleHint(retirementSchedule.length)}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="text-xs font-medium text-on-surface-variant">
                  <th className="h-10 border-b border-outline-variant px-3 text-left whitespace-nowrap">
                    {t.retirement.colYear}
                  </th>
                  <th className="h-10 border-b border-outline-variant px-3 text-left whitespace-nowrap">
                    {t.retirement.colAge}
                  </th>
                  <th className="h-10 border-b border-outline-variant px-3 text-right whitespace-nowrap">
                    {t.retirement.colMonthlyIncome}
                  </th>
                  <th className="h-10 border-b border-outline-variant px-3 text-right whitespace-nowrap">
                    {t.retirement.colRemainingBalance}
                  </th>
                </tr>
              </thead>
              <tbody>
                {retirementSchedule.map((row) => (
                  <tr
                    key={row.year}
                    className="border-b border-outline-variant/60 text-on-surface-variant"
                    style={{ height: 40 }}
                  >
                    <td className="px-3 text-on-surface">{row.year}</td>
                    <td className="px-3 text-on-surface">{row.age}</td>
                    <td className="px-3 text-right tabular-nums">{formatCurrency(row.monthlyIncome)}</td>
                    <td className="px-3 text-right tabular-nums">{formatCurrency(row.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>
      </div>
    </Card>
  )
}
