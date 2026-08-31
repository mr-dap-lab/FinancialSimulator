import type { TooltipContentProps } from 'recharts'
import { useLocale } from '../../context/locale'

/**
 * One tooltip for every chart in every feature, so formatting and chrome stay
 * consistent.
 *
 * `titleOf` turns the axis label into a heading — "Mes 42", "Año 7" — and
 * `formatValue` renders each series value.
 */
export function useValueTooltip(
  titleOf: (label: unknown) => string,
  formatValue: (value: number) => string,
) {
  return function ChartTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null

    return (
      <div className="rounded-xs bg-inverse-surface px-3 py-2 text-xs shadow-e2">
        <p className="font-medium text-inverse-on-surface">{titleOf(label)}</p>
        <ul className="mt-1 space-y-0.5">
          {payload.map((entry, index) => (
            <li key={index} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: entry.color }}
                aria-hidden="true"
              />
              <span className="text-inverse-on-surface/80">{entry.name}</span>
              <span className="ml-auto pl-3 font-medium tabular-nums text-inverse-on-surface">
                {formatValue(Number(entry.value ?? 0))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

/** Currency-formatted tooltip — the default for money series. */
export function useChartTooltip(titleOf: (label: unknown) => string) {
  const { formatCurrency } = useLocale()
  return useValueTooltip(titleOf, formatCurrency)
}

/** Tooltip for series already expressed as percentage points (0-100). */
export function usePercentTooltip(titleOf: (label: unknown) => string) {
  return useValueTooltip(titleOf, (value) => `${value.toFixed(1)}%`)
}
