import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, ChartFrame, VisuallyHiddenTable, useChartTooltip } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { useT } from '../../../i18n/i18n'
import { axisProps, useChartPalette } from '../../../theme/useChartPalette'
import type { SavingsGoalController } from '../useSavingsGoal'

export function SavingsGoalChart({ goal }: { goal: SavingsGoalController }) {
  const { params, schedule, contributionVsRequired } = goal
  const { formatCurrency, formatAbbrev } = useLocale()
  const t = useT()
  const palette = useChartPalette()
  const AXIS = axisProps(palette)
  const reduceMotion = usePrefersReducedMotion()

  const tooltip = useChartTooltip((label) => `${t.common.year} ${label}`)

  const captionAtContribution = t.savingsGoal.captionAtContribution(
    formatCurrency(params.monthlyContribution),
    contributionVsRequired,
  )
  const captionAtRequired = t.savingsGoal.captionAtRequired(formatCurrency(goal.result.requiredContribution))

  const chartLabel = t.common.chartSummary(t.savingsGoal.chartTitle, t.savingsGoal.chartHint)

  return (
    <Card title={t.savingsGoal.chartTitle} description={t.savingsGoal.chartHint}>
      <ChartFrame label={chartLabel} className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={schedule} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis dataKey="year" {...AXIS} />
            <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
            <Tooltip content={tooltip} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine
              y={params.goal}
              stroke={palette.deduction}
              strokeDasharray="6 4"
              label={{
                value: `${t.savingsGoal.referenceLineLabel} ${formatCurrency(params.goal)}`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: palette.deduction,
              }}
            />
            <Bar
              dataKey="balanceAtContribution"
              name={t.savingsGoal.seriesAtContribution}
              fill={palette.primary}
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reduceMotion}
            />
            <Bar
              dataKey="balanceAtRequired"
              name={t.savingsGoal.seriesAtRequired}
              fill={palette.contributed}
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reduceMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <VisuallyHiddenTable
        caption={t.common.chartDataTable(t.savingsGoal.chartTitle)}
        headers={[t.common.year, t.savingsGoal.seriesAtContribution, t.savingsGoal.seriesAtRequired]}
        rows={schedule.map((row) => [
          row.year,
          formatCurrency(row.balanceAtContribution),
          formatCurrency(row.balanceAtRequired),
        ])}
      />

      <div className="mt-3 space-y-1 text-sm leading-relaxed text-on-surface-variant">
        <p>{captionAtContribution}</p>
        <p>{captionAtRequired}</p>
      </div>
    </Card>
  )
}
