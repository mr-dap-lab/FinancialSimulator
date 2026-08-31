import { createContext, useContext } from 'react'

/** What the user picked. `system` follows the OS setting. */
export type ThemeMode = 'light' | 'dark' | 'system'

/** What is actually painted right now. */
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  mode: ThemeMode
  resolved: ResolvedTheme
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider')
  return context
}

export const THEME_STORAGE_KEY = 'fs.theme'

/**
 * The chart palette.
 *
 * Recharts needs literal colour strings for its SVG attributes, so unlike every
 * other colour in the app these are defined here rather than as CSS custom
 * properties. Reading them back from the document would be a render-ordering
 * trap: the theme attribute is applied in an effect, so a render-time
 * `getComputedStyle` returns the *previous* theme's colours for one frame.
 *
 * Values are the M3 tonal-palette steps that clear contrast on each surface —
 * tone 40 on light, tone 80 on dark.
 */
export interface ChartPalette {
  /** Primary running total: savings balance, loan balance, card balance. */
  primary: string
  /** What the user put in: contributions, principal. */
  contributed: string
  /** What the rate added: interest earned or charged. */
  interest: string
  /** Money taken away: withholding, fees, the credit limit. */
  deduction: string
  /** A second scenario shown alongside the first. */
  comparison: string
  grid: string
  axis: string
  cursor: string
}

const withCursor = (palette: Omit<ChartPalette, 'cursor'>): ChartPalette => ({
  ...palette,
  cursor: `color-mix(in srgb, ${palette.primary} 12%, transparent)`,
})

export const CHART_PALETTES: Record<ResolvedTheme, ChartPalette> = {
  light: withCursor({
    primary: '#6750a4',
    contributed: '#006a6a',
    interest: '#8b5000',
    deduction: '#b3261e',
    comparison: '#7d5260',
    grid: '#cac4d0',
    axis: '#49454f',
  }),
  dark: withCursor({
    primary: '#d0bcff',
    contributed: '#4fd8db',
    interest: '#ffb877',
    deduction: '#f2b8b5',
    comparison: '#efb8c8',
    grid: '#49454f',
    axis: '#cac4d0',
  }),
}

/**
 * A wider categorical palette for charts with more slices than the five
 * semantic `ChartPalette` roles cover — a donut with one wedge per budget
 * category, for instance. Same M3 tonal-palette steps (tone 40 light / tone
 * 80 dark) as `CHART_PALETTES`, just more hues; the first five intentionally
 * repeat `CHART_PALETTES`' own colours so a feature that already uses those
 * roles elsewhere stays visually consistent if it also needs a wider donut.
 */
export const CATEGORY_COLORS: Record<ResolvedTheme, string[]> = {
  light: [
    '#6750a4', // purple (primary)
    '#006a6a', // teal (contributed)
    '#8b5000', // brown (interest)
    '#b3261e', // red (deduction)
    '#7d5260', // mauve (comparison)
    '#385f0d', // green
    '#0061a4', // blue
    '#6b5900', // olive
  ],
  dark: [
    '#d0bcff',
    '#4fd8db',
    '#ffb877',
    '#f2b8b5',
    '#efb8c8',
    '#a8d08d',
    '#9ecaff',
    '#ddc55c',
  ],
}
