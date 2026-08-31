import { CATEGORY_COLORS, CHART_PALETTES, useTheme } from './theme'
import type { ChartPalette } from './theme'

/** The chart palette for the active theme. */
export function useChartPalette(): ChartPalette {
  return CHART_PALETTES[useTheme().resolved]
}

/** The wider categorical palette for charts with more than five slices. */
export function useCategoryColors(): string[] {
  return CATEGORY_COLORS[useTheme().resolved]
}

/** Axis props shared by every cartesian chart. */
export function axisProps(palette: ChartPalette) {
  return {
    stroke: palette.axis,
    tick: { fontSize: 11, fill: palette.axis },
    tickLine: false,
    axisLine: { stroke: palette.grid },
  } as const
}
