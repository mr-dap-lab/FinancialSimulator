import { useMemo } from 'react'
import { Card, ExportCsvButton } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import { budgetToCsv } from '../../../lib/csv'
import { isNegative } from '../../../lib/format'
import { budgetFieldLabel, budgetSectionLabel } from '../budgetLabels'
import type { BudgetController } from '../useBudget'

export function BudgetSchedule({ budget }: { budget: BudgetController }) {
  const { rows } = budget
  const { formatCurrency } = useLocale()
  const t = useT()

  const sectionLabel = budgetSectionLabel(t)
  const fieldLabel = budgetFieldLabel(t)

  const filename = useMemo(() => `presupuesto-${rows.length}-conceptos.csv`, [rows.length])

  const amountClass = (value: number) =>
    `px-4 text-right tabular-nums ${isNegative(value) ? 'text-error' : 'text-on-surface-variant'}`

  return (
    <Card
      title={t.budget.detailTitle}
      description={t.budget.detailHint(rows.length)}
      bodyClassName="px-0 pb-0 pt-4"
      actions={<ExportCsvButton filename={filename} build={() => budgetToCsv(rows)} />}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-high text-xs font-medium text-on-surface-variant">
              <th className="h-14 border-b border-outline-variant px-4 text-left whitespace-nowrap">
                {t.budget.colSection}
              </th>
              <th className="h-14 border-b border-outline-variant px-4 text-left whitespace-nowrap">
                {t.budget.colConcept}
              </th>
              <th className="h-14 border-b border-outline-variant px-4 text-right whitespace-nowrap">
                {t.budget.colMonthlyAmount}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.section}-${row.field}-${index}`}
                className="border-b border-outline-variant/60 text-on-surface-variant"
                style={{ height: 44 }}
              >
                <td className="px-4 text-on-surface">{sectionLabel[row.section] ?? row.section}</td>
                <td className="px-4 text-on-surface">{fieldLabel[row.field] ?? row.field}</td>
                <td className={amountClass(row.monthlyAmount)}>{formatCurrency(row.monthlyAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
