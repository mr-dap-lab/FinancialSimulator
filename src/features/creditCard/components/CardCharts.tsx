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
import { axisProps, useChartPalette } from '../../../theme/useChartPalette'
import { simulateCard } from '../../../lib/creditCard'
import type { CreditCardController } from '../useCreditCard'

export function CardCharts({ card }: { card: CreditCardController }) {
  const { params, rows, comparison } = card
  const { formatAbbrev, formatCurrency } = useLocale()
  const t = useT()
  const palette = useChartPalette()
  const AXIS = axisProps(palette)
  const reduceMotion = usePrefersReducedMotion()

  const balanceData = useMemo(
    () => rows.map((row) => ({ month: row.month, total: row.totalBalance })),
    [rows],
  )

  /**
   * The strategy comparison re-runs the model per series. `comparison` in the
   * controller carries the totals; the curves need the full schedules, so they
   * are built here from the same pure function.
   */
  const strategyData = useMemo(() => {
    const minimum = simulateCard({ ...params, strategy: 'minimum' })
    const fixed = simulateCard({ ...params, strategy: 'fixed' })
    const full = simulateCard({ ...params, strategy: 'full' })

    return Array.from({ length: params.months }, (_, index) => ({
      month: index + 1,
      minimum: minimum[index]?.totalBalance ?? 0,
      fixed: fixed[index]?.totalBalance ?? 0,
      full: full[index]?.totalBalance ?? 0,
    }))
  }, [params])

  const compositionData = useMemo(
    () =>
      rows.map((row) => {
        // The revolving part of the payment is whatever is left after the
        // instalments, interest and fee are covered.
        const revolvingPrincipal = Math.max(
          0,
          row.payment - row.installmentCharges - row.interest - row.fee,
        )
        return {
          month: row.month,
          installments: Math.min(row.installmentCharges, row.payment),
          revolvingPrincipal,
          interest: Math.min(row.interest, Math.max(0, row.payment - row.installmentCharges)),
          fee: Math.min(
            row.fee,
            Math.max(0, row.payment - row.installmentCharges - row.interest),
          ),
        }
      }),
    [rows],
  )

  const monthTicks = useMemo(() => {
    const stride = params.months <= 24 ? 3 : params.months <= 60 ? 6 : 12
    const ticks: number[] = []
    for (let month = stride; month <= params.months; month += stride) ticks.push(month)
    return ticks
  }, [params.months])

  const tooltip = useChartTooltip((label) => `${t.common.month} ${label}`)

  const neverLabel = (monthsToZero: number | null, name: string) =>
    monthsToZero === null ? t.card.neverReachesZero(name) : name

  const balanceLabel = t.common.chartTrendSummary(
    t.card.chartBalance,
    formatCurrency(balanceData[0]?.total ?? 0),
    formatCurrency(balanceData[balanceData.length - 1]?.total ?? 0),
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card
        title={t.card.chartBalance}
        description={t.card.chartBalanceHint}
        className="lg:col-span-3"
      >
        <ChartFrame label={balanceLabel} className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="month" ticks={monthTicks} {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={tooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <ReferenceLine
                y={params.creditLimit}
                stroke={palette.deduction}
                strokeDasharray="6 4"
                label={{
                  value: t.card.limitLabel(formatCurrency(params.creditLimit)),
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: palette.deduction,
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name={t.card.seriesBalance}
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
          caption={t.common.chartDataTable(t.card.chartBalance)}
          headers={[t.common.month, t.card.seriesBalance]}
          rows={balanceData.map((row) => [row.month, formatCurrency(row.total)])}
        />
      </Card>

      <Card
        title={t.card.chartStrategies}
        description={t.card.chartStrategiesHint}
        className="lg:col-span-2"
      >
        <ChartFrame
          label={t.common.chartSummary(t.card.chartStrategies, t.card.chartStrategiesHint)}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={strategyData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="month" ticks={monthTicks} {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={tooltip} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="minimum"
                name={neverLabel(comparison.minimum.monthsToZero, t.card.strategyMinimum)}
                stroke={palette.deduction}
                strokeWidth={2}
                dot={false}
                isAnimationActive={!reduceMotion}
              />
              <Line
                type="monotone"
                dataKey="fixed"
                name={neverLabel(comparison.fixed.monthsToZero, t.card.strategyFixed)}
                stroke={palette.interest}
                strokeWidth={2}
                dot={false}
                isAnimationActive={!reduceMotion}
              />
              <Line
                type="monotone"
                dataKey="full"
                name={neverLabel(comparison.full.monthsToZero, t.card.strategyFull)}
                stroke={palette.contributed}
                strokeWidth={2}
                dot={false}
                isAnimationActive={!reduceMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.card.chartStrategies)}
          headers={[t.common.month, t.card.strategyMinimum, t.card.strategyFixed, t.card.strategyFull]}
          rows={strategyData.map((row) => [
            row.month,
            formatCurrency(row.minimum),
            formatCurrency(row.fixed),
            formatCurrency(row.full),
          ])}
        />
      </Card>

      <Card title={t.card.chartPayment} description={t.card.chartPaymentHint}>
        <ChartFrame
          label={t.common.chartSummary(t.card.chartPayment, t.card.chartPaymentHint)}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compositionData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="month" ticks={monthTicks} {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={56} {...AXIS} />
              <Tooltip content={tooltip} cursor={{ fill: palette.cursor }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar
                dataKey="installments"
                stackId="p"
                name={t.card.seriesInstallments}
                fill={palette.primary}
                isAnimationActive={!reduceMotion}
              />
              <Bar
                dataKey="revolvingPrincipal"
                stackId="p"
                name={t.card.seriesRevolvingPrincipal}
                fill={palette.contributed}
                isAnimationActive={!reduceMotion}
              />
              <Bar
                dataKey="interest"
                stackId="p"
                name={t.card.seriesInterest}
                fill={palette.interest}
                isAnimationActive={!reduceMotion}
              />
              <Bar
                dataKey="fee"
                stackId="p"
                name={t.card.seriesFee}
                fill={palette.deduction}
                isAnimationActive={!reduceMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.card.chartPayment)}
          headers={[
            t.common.month,
            t.card.seriesInstallments,
            t.card.seriesRevolvingPrincipal,
            t.card.seriesInterest,
            t.card.seriesFee,
          ]}
          rows={compositionData.map((row) => [
            row.month,
            formatCurrency(row.installments),
            formatCurrency(row.revolvingPrincipal),
            formatCurrency(row.interest),
            formatCurrency(row.fee),
          ])}
        />
      </Card>
    </div>
  )
}
