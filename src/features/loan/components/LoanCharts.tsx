import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  ChartFrame,
  VisuallyHiddenTable,
  useChartTooltip,
  usePercentTooltip,
} from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { useT } from '../../../i18n/i18n'
import { axisProps, useChartPalette } from '../../../theme/useChartPalette'
import type { LoanController } from '../useLoan'

export function LoanCharts({ loan }: { loan: LoanController }) {
  const { rows, baseline, totals, hasExtraPayments } = loan
  const { formatCurrency, formatAbbrev, formatPercent } = useLocale()
  const t = useT()
  const palette = useChartPalette()
  const AXIS = axisProps(palette)
  const reduceMotion = usePrefersReducedMotion()

  const balanceData = useMemo(() => {
    const baselineByMonth = new Map(baseline.map((row) => [row.month, row.balance]))
    return rows.map((row) => ({
      month: row.month,
      balance: row.balance,
      baseline: hasExtraPayments ? (baselineByMonth.get(row.month) ?? 0) : undefined,
    }))
  }, [rows, baseline, hasExtraPayments])

  const monthTicks = useMemo(() => {
    const years = Math.ceil(rows.length / 12)
    const stride = years <= 10 ? 1 : years <= 20 ? 2 : 5
    const ticks: number[] = []
    for (let year = stride; year <= years; year += stride) ticks.push(year * 12)
    return ticks
  }, [rows.length])

  /**
   * The composition chart is normalised to 100 % so the crossover between
   * principal and interest is legible even as the instalment shrinks.
   */
  const compositionData = useMemo(
    () =>
      rows.map((row) => {
        const total = row.principalPaid + row.interest + row.insurance
        const share = (value: number) => (total > 0 ? (value / total) * 100 : 0)
        return {
          month: row.month,
          principal: share(row.principalPaid),
          interest: share(row.interest),
          insurance: share(row.insurance),
        }
      }),
    [rows],
  )

  const donutData = useMemo(() => {
    const principal = rows.reduce((sum, row) => sum + row.principalPaid + row.extraPayment, 0)
    return [
      { name: t.loan.seriesPrincipal, value: principal, color: palette.contributed },
      { name: t.loan.seriesInterest, value: totals.totalInterest, color: palette.interest },
      { name: t.loan.sliceCharges, value: totals.totalInsurance, color: palette.deduction },
    ].filter((slice) => slice.value > 0)
  }, [rows, totals, palette, t])

  const balanceTooltip = useChartTooltip((label) => `${t.common.month} ${label}`)
  const donutTooltip = useChartTooltip((label) => String(label ?? ''))
  const compositionTooltip = usePercentTooltip((label) => `${t.common.month} ${label}`)

  const balanceLabel = t.common.chartTrendSummary(
    t.loan.chartBalance,
    formatCurrency(balanceData[0]?.balance ?? 0),
    formatCurrency(balanceData[balanceData.length - 1]?.balance ?? 0),
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card
        title={t.loan.chartBalance}
        description={hasExtraPayments ? t.loan.chartBalanceHintExtra : t.loan.chartBalanceHint}
        className="lg:col-span-3"
      >
        <ChartFrame label={balanceLabel} className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="fill-loan-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={palette.primary} stopOpacity={0.02} />
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
              <Tooltip content={balanceTooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="balance"
                name={t.loan.seriesBalance}
                stroke={palette.primary}
                strokeWidth={2}
                fill="url(#fill-loan-balance)"
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={!reduceMotion}
              />
              {hasExtraPayments && (
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name={t.loan.seriesBaseline}
                  stroke={palette.comparison}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={!reduceMotion}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.loan.chartBalance)}
          headers={
            hasExtraPayments
              ? [t.common.month, t.loan.seriesBalance, t.loan.seriesBaseline]
              : [t.common.month, t.loan.seriesBalance]
          }
          rows={balanceData.map((row) =>
            hasExtraPayments
              ? [row.month, formatCurrency(row.balance), formatCurrency(row.baseline ?? 0)]
              : [row.month, formatCurrency(row.balance)],
          )}
        />
      </Card>

      <Card
        title={t.loan.chartComposition}
        description={
          totals.crossoverMonth
            ? t.loan.chartCompositionCrossover(totals.crossoverMonth)
            : t.loan.chartCompositionNoCrossover
        }
        className="lg:col-span-2"
      >
        <ChartFrame
          label={t.common.chartSummary(
            t.loan.chartComposition,
            totals.crossoverMonth
              ? t.loan.chartCompositionCrossover(totals.crossoverMonth)
              : t.loan.chartCompositionNoCrossover,
          )}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={compositionData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis
                dataKey="month"
                ticks={monthTicks}
                tickFormatter={(month: number) => `${month / 12}a`}
                {...AXIS}
              />
              <YAxis
                width={44}
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                {...AXIS}
              />
              <Tooltip content={compositionTooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {totals.crossoverMonth && (
                <ReferenceLine
                  x={totals.crossoverMonth}
                  stroke={palette.axis}
                  strokeDasharray="4 4"
                  label={{
                    value: t.loan.crossoverLabel(totals.crossoverMonth),
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: palette.axis,
                  }}
                />
              )}
              <Area
                type="monotone"
                stackId="1"
                dataKey="principal"
                name={t.loan.seriesPrincipal}
                stroke={palette.contributed}
                fill={palette.contributed}
                fillOpacity={0.75}
                isAnimationActive={!reduceMotion}
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="interest"
                name={t.loan.seriesInterest}
                stroke={palette.interest}
                fill={palette.interest}
                fillOpacity={0.75}
                isAnimationActive={!reduceMotion}
              />
              <Area
                type="monotone"
                stackId="1"
                dataKey="insurance"
                name={t.loan.seriesInsurance}
                stroke={palette.deduction}
                fill={palette.deduction}
                fillOpacity={0.75}
                isAnimationActive={!reduceMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.loan.chartComposition)}
          headers={[t.common.month, t.loan.seriesPrincipal, t.loan.seriesInterest, t.loan.seriesInsurance]}
          rows={compositionData.map((row) => [
            row.month,
            `${row.principal.toFixed(1)}%`,
            `${row.interest.toFixed(1)}%`,
            `${row.insurance.toFixed(1)}%`,
          ])}
        />
      </Card>

      <Card
        title={t.loan.chartDonut}
        description={t.loan.chartDonutHint(formatPercent(totals.creditCost))}
      >
        <ChartFrame
          label={t.common.chartSummary(
            t.loan.chartDonut,
            t.loan.chartDonutHint(formatPercent(totals.creditCost)),
          )}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                strokeWidth={0}
                isAnimationActive={!reduceMotion}
              >
                {donutData.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip content={donutTooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.loan.chartDonut)}
          headers={[t.common.category, t.common.value]}
          rows={donutData.map((slice) => [slice.name, formatCurrency(slice.value)])}
        />
      </Card>
    </div>
  )
}
