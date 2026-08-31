import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { purchasingPowerToday } from '../../../lib/retirement'
import { axisProps, useChartPalette } from '../../../theme/useChartPalette'
import type { RetirementController } from '../useRetirement'

export function RetirementCharts({ retirement }: { retirement: RetirementController }) {
  const { params, result, accumulationSchedule, depletion } = retirement
  const { formatCurrency, formatAbbrev, formatPercent } = useLocale()
  const t = useT()
  const palette = useChartPalette()
  const AXIS = axisProps(palette)
  const reduceMotion = usePrefersReducedMotion()

  const tooltip = useChartTooltip((label) => `${t.common.year} ${label}`)
  const monthTooltip = useChartTooltip((label) => `${t.common.month} ${label}`)

  const yearsToRetirement = Math.max(0, params.retirementAge - params.currentAge)

  const incomeData = useMemo(
    () => [
      {
        group: t.retirement.groupBeforeInflation,
        beforeTax: result.monthlyIncomeBeforeTax,
        afterTax: result.monthlyIncomeAfterTax,
      },
      {
        group: t.retirement.groupWithInflation(formatPercent(params.inflation)),
        beforeTax: purchasingPowerToday(result.monthlyIncomeBeforeTax, params.inflation, yearsToRetirement),
        afterTax: result.monthlyIncomeToday,
      },
    ],
    [t, result, params.inflation, formatPercent, yearsToRetirement],
  )

  const incomeChartTitle = t.retirement.incomeChartTitle(params.retirementAge, params.retirementYears)
  const incomeLabel = t.common.chartSummary(incomeChartTitle, t.retirement.incomeChartHint)

  const accumulationLabel = t.common.chartTrendSummary(
    t.retirement.accumulationChartTitle,
    formatCurrency(params.startingBalance),
    formatCurrency(result.balanceAtRetirement),
  )

  const depletionLabel = t.common.chartTrendSummary(
    t.retirement.depletionChartTitle,
    formatCurrency(result.balanceAtRetirement),
    formatCurrency(depletion[depletion.length - 1]?.balance ?? 0),
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title={incomeChartTitle} description={t.retirement.incomeChartHint}>
        <ChartFrame label={incomeLabel} className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="group" {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={tooltip} cursor={{ fill: palette.cursor }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar
                dataKey="beforeTax"
                name={t.retirement.seriesBeforeTax}
                fill={palette.contributed}
                radius={[3, 3, 0, 0]}
                isAnimationActive={!reduceMotion}
              />
              <Bar
                dataKey="afterTax"
                name={t.retirement.seriesAfterTax}
                fill={palette.primary}
                radius={[3, 3, 0, 0]}
                isAnimationActive={!reduceMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(incomeChartTitle)}
          headers={[t.common.category, t.retirement.seriesBeforeTax, t.retirement.seriesAfterTax]}
          rows={incomeData.map((row) => [
            row.group,
            formatCurrency(row.beforeTax),
            formatCurrency(row.afterTax),
          ])}
        />
      </Card>

      <Card title={t.retirement.accumulationChartTitle} description={t.retirement.accumulationChartHint}>
        <ChartFrame label={accumulationLabel} className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accumulationSchedule} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={tooltip} />
              <ReferenceLine
                y={result.balanceAtRetirement}
                stroke={palette.deduction}
                strokeDasharray="6 4"
                label={{
                  value: t.retirement.finalBalanceLabel(formatCurrency(result.balanceAtRetirement)),
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: palette.deduction,
                }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                name={t.retirement.seriesBalance}
                stroke={palette.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={!reduceMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.retirement.accumulationChartTitle)}
          headers={[t.common.year, t.retirement.seriesBalance]}
          rows={accumulationSchedule.map((row) => [row.year, formatCurrency(row.balance)])}
        />
      </Card>

      <Card
        title={t.retirement.depletionChartTitle}
        description={t.retirement.depletionChartHint}
        className="lg:col-span-2"
      >
        <ChartFrame label={depletionLabel} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={depletion} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="month" {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={monthTooltip} />
              <Line
                type="monotone"
                dataKey="balance"
                name={t.retirement.seriesBalance}
                stroke={palette.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={!reduceMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.retirement.depletionChartTitle)}
          headers={[t.common.month, t.retirement.seriesBalance]}
          rows={depletion.map((row) => [row.month, formatCurrency(row.balance)])}
        />
      </Card>
    </div>
  )
}
