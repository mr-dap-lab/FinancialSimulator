import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, ChartFrame, VisuallyHiddenTable, useChartTooltip } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { useT } from '../../../i18n/i18n'
import { useCategoryColors } from '../../../theme/useChartPalette'
import type { BudgetController } from '../useBudget'

export function BudgetCharts({ budget }: { budget: BudgetController }) {
  const { expenseSlices, incomeSlices } = budget
  const { formatCurrency } = useLocale()
  const t = useT()
  const colors = useCategoryColors()
  const reduceMotion = usePrefersReducedMotion()

  const expenseLabel: Record<string, string> = {
    mortgageDebt: t.budget.sliceMortgageDebt,
    utilities: t.budget.sliceUtilities,
    food: t.budget.sliceFood,
    insurance: t.budget.sliceInsurance,
    maintenance: t.budget.sliceMaintenance,
    availableToSave: t.budget.sliceAvailableToSave,
  }

  const incomeLabel: Record<string, string> = {
    federal: t.budget.sliceFederal,
    state: t.budget.sliceState,
    local: t.budget.sliceLocal,
    otherTaxes: t.budget.sliceOtherTaxes,
    ficaAndHealth: t.budget.sliceFicaAndHealth,
    insuranceBenefits: t.budget.sliceInsuranceBenefits,
    retirementSavings: t.budget.sliceRetirementSavings,
    netIncome: t.budget.sliceNetIncome,
  }

  const expenseData = expenseSlices.map((slice) => ({ name: expenseLabel[slice.key] ?? slice.key, value: slice.value }))
  const incomeData = incomeSlices.map((slice) => ({ name: incomeLabel[slice.key] ?? slice.key, value: slice.value }))

  const shareTooltip = useChartTooltip((label) => String(label ?? ''))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title={t.budget.chartExpenseTitle} description={t.budget.chartExpenseHint}>
        <ChartFrame
          label={t.common.chartSummary(t.budget.chartExpenseTitle, t.budget.chartExpenseHint)}
          className="h-72 w-full sm:h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                strokeWidth={0}
                isAnimationActive={!reduceMotion}
              >
                {expenseData.map((slice, index) => (
                  <Cell key={slice.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={shareTooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.budget.chartExpenseTitle)}
          headers={[t.common.category, t.common.value]}
          rows={expenseData.map((slice) => [slice.name, formatCurrency(slice.value)])}
        />
      </Card>

      <Card title={t.budget.chartIncomeTitle} description={t.budget.chartIncomeHint}>
        <ChartFrame
          label={t.common.chartSummary(t.budget.chartIncomeTitle, t.budget.chartIncomeHint)}
          className="h-72 w-full sm:h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={incomeData}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                strokeWidth={0}
                isAnimationActive={!reduceMotion}
              >
                {incomeData.map((slice, index) => (
                  <Cell key={slice.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={shareTooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.budget.chartIncomeTitle)}
          headers={[t.common.category, t.common.value]}
          rows={incomeData.map((slice) => [slice.name, formatCurrency(slice.value)])}
        />
      </Card>
    </div>
  )
}
