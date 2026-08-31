import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, ChartFrame, VisuallyHiddenTable, useChartTooltip, useValueTooltip } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { useT } from '../../../i18n/i18n'
import { axisProps, useChartPalette } from '../../../theme/useChartPalette'
import type { DebtConsolidationController } from '../useDebtConsolidation'

/** A small colour-swatch legend matching the reference's own "dot + value" style. */
function Swatches({ items, colors }: { items: { name: string; label: string }[]; colors: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
      {items.map((item, index) => (
        <span key={item.name} className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: colors[index] }}
            aria-hidden="true"
          />
          {item.name} <strong className="font-medium text-on-surface">{item.label}</strong>
        </span>
      ))}
    </div>
  )
}

export function DebtConsolidationCharts({ debt }: { debt: DebtConsolidationController }) {
  const { currentPayment, consolidatedMonthlyPayment, currentMonths, params } = debt
  const { formatCurrency, formatAbbrev } = useLocale()
  const t = useT()
  const palette = useChartPalette()
  const AXIS = axisProps(palette)
  const reduceMotion = usePrefersReducedMotion()

  const paymentTooltip = useChartTooltip((label) => String(label))
  const timeTooltip = useValueTooltip(
    (label) => String(label),
    (value) => `${value} ${t.common.months}`,
  )

  const paymentData = useMemo(
    () => [
      { name: t.debtConsolidation.seriesCurrent, value: currentPayment },
      { name: t.debtConsolidation.seriesConsolidated, value: consolidatedMonthlyPayment },
    ],
    [t, currentPayment, consolidatedMonthlyPayment],
  )

  const timeData = useMemo(
    () => [
      { name: t.debtConsolidation.seriesCurrent, value: currentMonths ?? 0 },
      { name: t.debtConsolidation.seriesConsolidated, value: params.consolidated.months },
    ],
    [t, currentMonths, params.consolidated.months],
  )

  const colors = [palette.comparison, palette.primary]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title={t.debtConsolidation.chartPaymentTitle} description={t.debtConsolidation.chartPaymentHint}>
        <ChartFrame
          label={t.common.chartSummary(t.debtConsolidation.chartPaymentTitle, t.debtConsolidation.chartPaymentHint)}
          className="h-64 w-full sm:h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="name" {...AXIS} />
              <YAxis tickFormatter={formatAbbrev} width={64} {...AXIS} />
              <Tooltip content={paymentTooltip} cursor={{ fill: palette.cursor }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={!reduceMotion}>
                {paymentData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <Swatches
          items={paymentData.map((entry) => ({ name: entry.name, label: formatCurrency(entry.value) }))}
          colors={colors}
        />
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.debtConsolidation.chartPaymentTitle)}
          headers={[t.common.category, t.common.value]}
          rows={paymentData.map((row) => [row.name, formatCurrency(row.value)])}
        />
      </Card>

      <Card title={t.debtConsolidation.chartTimeTitle} description={t.debtConsolidation.chartTimeHint}>
        <ChartFrame
          label={t.common.chartSummary(t.debtConsolidation.chartTimeTitle, t.debtConsolidation.chartTimeHint)}
          className="h-64 w-full sm:h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="name" {...AXIS} />
              <YAxis width={48} {...AXIS} />
              <Tooltip content={timeTooltip} cursor={{ fill: palette.cursor }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={!reduceMotion}>
                {timeData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <Swatches
          items={timeData.map((entry) => ({
            name: entry.name,
            label: `${entry.value} ${t.common.months}`,
          }))}
          colors={colors}
        />
        <VisuallyHiddenTable
          caption={t.common.chartDataTable(t.debtConsolidation.chartTimeTitle)}
          headers={[t.common.category, t.common.month]}
          rows={timeData.map((row) => [row.name, row.value])}
        />
      </Card>
    </div>
  )
}
