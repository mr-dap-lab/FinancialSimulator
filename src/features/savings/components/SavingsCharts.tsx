import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import type { SavingsRow } from '../../../lib/simulate'
import type { SavingsController } from '../useSavings'

export function SavingsCharts({ savings }: { savings: SavingsController }) {
  const { rows, totals } = savings
  const { formatCurrency, formatAbbrev } = useLocale()
  const t = useT()
  const palette = useChartPalette()
  const AXIS = axisProps(palette)
  const reduceMotion = usePrefersReducedMotion()

  const growthData = useMemo(
    () =>
      rows.map((row) => ({
        month: row.month,
        balance: row.balance,
        contributed: row.contributedToDate,
      })),
    [rows],
  )

  // A tick per year keeps the axis readable at 40 years; every other year past 20.
  const monthTicks = useMemo(() => {
    const years = Math.ceil(rows.length / 12)
    const stride = years <= 10 ? 1 : years <= 20 ? 2 : 5
    const ticks: number[] = []
    for (let year = stride; year <= years; year += stride) ticks.push(year * 12)
    return ticks
  }, [rows.length])

  const compositionData = useMemo(
    () => [
      { name: t.savings.sliceContributions, value: Math.max(0, totals.totalContributed), color: palette.contributed },
      { name: t.savings.sliceInterest, value: Math.max(0, totals.netInterest), color: palette.interest },
    ],
    [totals, palette, t],
  )

  const yearlyInterest = useMemo(() => averageMonthlyInterestByYear(rows), [rows])

  const monthTooltip = useChartTooltip((label) => `${t.common.month} ${label}`)
  const yearTooltip = useChartTooltip((label) => `${t.common.year} ${label}`)
  const shareTooltip = useChartTooltip((label) => String(label ?? ''))

  const growthLabel = t.common.chartTrendSummary(
    t.savings.chartGrowth,
    formatCurrency(growthData[0]?.balance ?? 0),
    formatCurrency(growthData[growthData.length - 1]?.balance ?? 0),
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card
        title={t.savings.chartGrowth}
        description={t.savings.chartGrowthHint}
        className="lg:col-span-3"
      >
        <ChartFrame label={growthLabel} className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="fill-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={palette.primary} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fill-contributed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.contributed} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={palette.contributed} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis
                dataKey="month"
                ticks={monthTicks}
                tickFormatter={(month: number) => `${month / 12}a`}
                {...AXIS}
              />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={monthTooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="balance"
                name={t.savings.seriesBalance}
                stroke={palette.primary}
                strokeWidth={2}
                fill="url(#fill-balance)"
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={!reduceMotion}
              />
              <Area
                type="monotone"
                dataKey="contributed"
                name={t.savings.seriesContributed}
                stroke={palette.contributed}
                strokeWidth={2}
                fill="url(#fill-contributed)"
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={!reduceMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.savings.chartGrowth)}
          headers={[t.common.month, t.savings.seriesBalance, t.savings.seriesContributed]}
          rows={growthData.map((row) => [
            row.month,
            formatCurrency(row.balance),
            formatCurrency(row.contributed),
          ])}
        />
      </Card>

      <Card title={t.savings.chartComposition} description={t.savings.chartCompositionHint}>
        <ChartFrame
          label={t.common.chartSummary(t.savings.chartComposition, t.savings.chartCompositionHint)}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={compositionData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                strokeWidth={0}
                isAnimationActive={!reduceMotion}
              >
                {compositionData.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip content={shareTooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.savings.chartComposition)}
          headers={[t.common.category, t.common.value]}
          rows={compositionData.map((slice) => [slice.name, formatCurrency(slice.value)])}
        />
      </Card>

      <Card
        title={t.savings.chartMonthly}
        description={t.savings.chartMonthlyHint}
        className="lg:col-span-2"
      >
        <ChartFrame
          label={t.common.chartSummary(t.savings.chartMonthly, t.savings.chartMonthlyHint)}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyInterest} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="year" {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={yearTooltip} cursor={{ fill: palette.cursor }} />
              <Bar
                dataKey="average"
                name={t.savings.seriesAverageInterest}
                fill={palette.interest}
                radius={[3, 3, 0, 0]}
                isAnimationActive={!reduceMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.savings.chartMonthly)}
          headers={[t.common.year, t.savings.seriesAverageInterest]}
          rows={yearlyInterest.map((entry) => [entry.year, formatCurrency(entry.average)])}
        />
      </Card>
    </div>
  )
}

function averageMonthlyInterestByYear(rows: SavingsRow[]): { year: number; average: number }[] {
  const totals = new Map<number, { sum: number; count: number }>()

  for (const row of rows) {
    const entry = totals.get(row.year) ?? { sum: 0, count: 0 }
    entry.sum += row.monthlyInterest
    entry.count += 1
    totals.set(row.year, entry)
  }

  return [...totals.entries()].map(([year, { sum, count }]) => ({ year, average: sum / count }))
}
