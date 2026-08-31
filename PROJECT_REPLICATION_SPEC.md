# Simulador Financiero — Complete Build Specification

**Purpose of this document.** This is a self-contained, exhaustive specification for building the
Financial Simulator application from an empty repository, with no other context. It is written as a
sequence of ordered, self-contained build prompts — the same style used successfully throughout this
project's own history — so that a fresh Claude Code session (or a human developer) can execute Part A,
then Part B (seven independent subsections, order doesn't matter among themselves, but each depends on
Part A), then Part C **in the numbered order given** (each prompt in Part C depends on the ones before
it), and end up with the exact same product, byte-for-byte equivalent in behavior if not in literal
source formatting.

**How to use this document.**
1. Read Part 0 for the one-paragraph pitch and the final feature list — know what you're building before
   you start.
2. Execute Part A in full first. It is the foundation everything else sits on: tooling, design system,
   shared UI kit, i18n/currency/theme architecture, the app shell, and the accessibility/testing
   baseline every later prompt must follow.
3. Execute all seven subsections of Part B (one per calculator). They are independent of each other and
   can be built in any order, but each depends on Part A being finished first.
4. Execute Part C **strictly in order** — C.1 through C.10. Each prompt explicitly builds on the ones
   before it (e.g., C.2 retrofits every string Part A/B produced into the i18n system C.1 didn't yet
   have; C.9 fixes a bug introduced by C.5). Do not skip or reorder these.
5. Part D covers deployment. Part E is a reference appendix — glossary, full file tree, and the
   project's own record of deliberate deviations from whatever external "reference calculator" each
   model was checked against.
6. Throughout, if you find a stale assumption below against whatever codebase state you're actually
   looking at, **flag it explicitly and resolve it with reasoning** rather than blindly complying or
   silently deviating — that discipline is itself part of what this spec is asking you to replicate.

---

# PART 0 — READ ME FIRST

## 0.1 What this is

Financial Simulator is a bilingual (Spanish/English), client-side single-page web application for
modelling seven personal-finance scenarios: savings growth, a savings goal, retirement accumulation and
drawdown, a loan amortization, consolidating several debts into one, a revolving credit card (one or
many), and a monthly household budget. Every projection recalculates live as a parameter changes — there
is no "Calculate" button anywhere. The app has no backend of its own; the two deliberate exceptions
(mock authentication and client-side PDF generation) are covered in Part C. It follows a Material Design
3 design system throughout, supports five display currencies independent of the UI language, and has a
hard-coded, tested guarantee that no component ever renders a hardcoded user-facing string outside the
i18n dictionary.

## 0.2 Final feature list (what you're building toward)

- Seven calculators: **Ahorro**, **Meta de ahorro**, **Retiro**, **Crédito**, **Consolidación de
  deudas**, **Tarjeta de crédito** (supporting multiple cards, each with its own name and network
  franchise), **Mi Presupuesto** (with extensible, user-growable expense categories).
- A persistent top bar on every screen: language toggle (ES/EN), currency selector (5 options), theme
  toggle (light/dark/system), a `?` help icon, and a sign-in control.
- A full mock sign-in flow at `#/login`, additive by default (never required to use any feature) but
  promotable to a hard, full-screen access gate in front of the entire app via a single build-time
  environment flag.
- A dedicated `Ayuda` (Help) reference page reusing the exact same explanatory text every field's inline
  tooltip already shows.
- A shared "Ver reporte" on-screen report and "Descargar PDF" client-side export, available identically
  on all seven features, correctly paginated per-section (never splitting a chart across a page break).
- CSV export of every feature's full schedule.
- A short feature-intro banner and a shared legal disclaimer on every tab.

## 0.3 Non-functional requirements that apply throughout

- **Accessibility**: every parameter field gets a real `<label>`, a fixed-height helper-text slot, and
  an accessible `(?)` popover (not a hover-only tooltip). Every interactive control is keyboard-operable.
  An automated `axe-core` check runs against every tab in the test suite and must report zero
  violations.
- **Internationalization**: no component may contain a literal user-facing string; everything routes
  through a dictionary. This is enforced by a TypeScript-AST-based test that fails the build on a
  violation (built in Part C.2, but keep it in mind from the first line of code).
- **Performance**: every user-growable array (rate tiers, extra payments, purchases, debts, budget line
  items, credit cards themselves) has a hard numeric cap. The monthly detail table uses row
  virtualization.
- **Security/privacy**: no real backend, no real user data leaves the browser. A CSV cell that could be
  read as a spreadsheet formula is escaped.
- **Testability**: every calculation model is a pure function with zero React/DOM imports, unit-tested
  in isolation.

---

# PART A — FOUNDATION

## A.1 — Technology Stack

Initialize a Vite + React + TypeScript project and install exactly this stack:

```json
{
  "dependencies": {
    "@material/web": "^2.5.0",
    "@tailwindcss/vite": "^4.3.3",
    "html2canvas-pro": "^2.4.0",
    "jspdf": "^4.2.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "recharts": "^3.10.1",
    "tailwindcss": "^4.3.3",
    "three": "latest"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/react": "^16.3.3",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@types/three": "latest",
    "@vitejs/plugin-react": "^6.1.0",
    "@vitest/coverage-v8": "^4.1.11",
    "axe-core": "^4.13.0",
    "jsdom": "^30.0.1",
    "oxlint": "^1.79.0",
    "typescript": "~6.0.2",
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

Package roles, so a substitution decision later has the right context:

| Package | Role |
| --- | --- |
| React 19 | UI library. Use the React 19 ref-as-prop pattern (`ref?: Ref<T>` as a plain named prop) — **do not use `forwardRef`** anywhere in this codebase. |
| Vite + `@tailwindcss/vite` | Dev server and production bundler; native Tailwind v4 integration. |
| Tailwind CSS v4 | Utility classes; every design token declared once via `@theme inline` in `index.css` (see A.3) — no component ever writes a `dark:` variant. |
| Recharts | Every chart in every feature. |
| `@material/web` | Exactly **one** real usage in the whole app: the `HelpPopover`'s `(?)` trigger button (`<md-icon-button>`). Every other control is hand-built Tailwind. |
| `jspdf` + `html2canvas-pro` | Client-side PDF export (Part C.5/C.9). Use the `-pro` fork, not plain `html2canvas` — the plain package cannot parse the `oklab()`/`oklch()`/`color-mix()` color functions Tailwind v4's `@theme` machinery emits, and throws mid-capture. |
| `three` | One decorative particle-field animation behind the access gate overlay (Part C.8). |
| Vitest + jsdom + Testing Library + axe-core | The entire test suite — pure-function unit tests run under plain Node; the handful of React-rendering tests opt into `jsdom` per-file via a `// @vitest-environment jsdom` pragma. |
| `oxlint` | Fast linter, run via `npm run lint`. |

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vitest run && vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`npm run build` must run the type-checker, the **full** test suite, and the production bundle in one
command — a change cannot ship if any of the three fails.

## A.2 — Project Scaffolding & Tooling

### `vite.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    // Model tests run under plain Node; a11y tests render real components and
    // opt into jsdom themselves via a `// @vitest-environment jsdom` pragma.
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
```

### `tsconfig` set

Standard Vite React-TS split config (`tsconfig.json` referencing `tsconfig.app.json` +
`tsconfig.node.json`). `tsconfig.app.json`'s `types` array must include `"vite/client"` (gives every
`.ts`/`.tsx` file `import.meta.env.*` typing and default asset-import typing for `.jpg`/`.png`/`.svg`
etc.) — the one exception is the i18n hardcoded-strings guard test, which needs Node's `fs`/`path`
typing too; give that one file its own `/// <reference types="node" />` pragma rather than widening the
whole app's type scope.

### `.env` files

```
# .env — committed. Not secret: any VITE_-prefixed var is bundled into the
# public client JS regardless, so there is nothing to gain by gitignoring it.
VITE_REQUIRE_LOGIN=true
```

```
# .env.test — committed. Vitest's default mode is "test", so this overrides
# .env for the test suite only, keeping the access gate (Part C.8) off so the
# broad test suite can keep rendering <App /> and finding the tab strip
# directly, without every test first needing to sign in.
VITE_REQUIRE_LOGIN=false
```

### `.gitignore`

Standard Vite/Node ignores (`node_modules`, `dist`, `dist-ssr`, `*.local`, editor directories). Do
**not** gitignore `.env`/`.env.test` — see above.

### `index.html`

Load Roboto from the `<head>` (Google Fonts `<link>` tags), a `<div id="root">`, and the module entry
script pointing at `src/main.tsx`.

### `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

## A.3 — Design System: Material Design 3

Every color is declared **once per role**, once for light and once for dark, as CSS custom properties,
then mapped to Tailwind utility classes via `@theme inline` — this is what lets a theme switch recolor
the entire app with **zero** `dark:` variants written in any component.

### `src/index.css`

```css
@import 'tailwindcss';
/* Roboto is loaded from index.html's <head>. */

:root {
  color-scheme: light;

  --md-primary: #6750a4;
  --md-on-primary: #ffffff;
  --md-primary-container: #eaddff;
  --md-on-primary-container: #21005d;

  --md-secondary: #625b71;
  --md-on-secondary: #ffffff;
  --md-secondary-container: #e8def8;
  --md-on-secondary-container: #1d192b;

  --md-tertiary: #7d5260;
  --md-on-tertiary: #ffffff;
  --md-tertiary-container: #ffd8e4;
  --md-on-tertiary-container: #31111d;

  --md-error: #b3261e;
  --md-on-error: #ffffff;
  --md-error-container: #f9dedc;
  --md-on-error-container: #410e0b;

  /* Success is not an M3 baseline role — added for gains, using the M3 recipe. */
  --md-success: #3a6a41;
  --md-on-success: #ffffff;
  --md-success-container: #bcf0c0;
  --md-on-success-container: #00210b;

  --md-surface: #fef7ff;
  --md-on-surface: #1d1b20;
  --md-surface-variant: #e7e0ec;
  --md-on-surface-variant: #49454f;

  --md-surface-container-lowest: #ffffff;
  --md-surface-container-low: #f7f2fa;
  --md-surface-container: #f3edf7;
  --md-surface-container-high: #ece6f0;
  --md-surface-container-highest: #e6e0e9;

  --md-outline: #79747e;
  --md-outline-variant: #cac4d0;

  --md-inverse-surface: #322f35;
  --md-inverse-on-surface: #f5eff7;
  --md-inverse-primary: #d0bcff;
  --md-scrim: #000000;
}

:root[data-theme='dark'] {
  color-scheme: dark;

  --md-primary: #d0bcff;
  --md-on-primary: #381e72;
  --md-primary-container: #4f378b;
  --md-on-primary-container: #eaddff;

  --md-secondary: #ccc2dc;
  --md-on-secondary: #332d41;
  --md-secondary-container: #4a4458;
  --md-on-secondary-container: #e8def8;

  --md-tertiary: #efb8c8;
  --md-on-tertiary: #492532;
  --md-tertiary-container: #633b48;
  --md-on-tertiary-container: #ffd8e4;

  --md-error: #f2b8b5;
  --md-on-error: #601410;
  --md-error-container: #8c1d18;
  --md-on-error-container: #f9dedc;

  --md-success: #a1d5a4;
  --md-on-success: #0a3915;
  --md-success-container: #23512c;
  --md-on-success-container: #bcf0c0;

  --md-surface: #141218;
  --md-on-surface: #e6e0e9;
  --md-surface-variant: #49454f;
  --md-on-surface-variant: #cac4d0;

  --md-surface-container-lowest: #0f0d13;
  --md-surface-container-low: #1d1b20;
  --md-surface-container: #211f26;
  --md-surface-container-high: #2b2930;
  --md-surface-container-highest: #36343b;

  --md-outline: #938f99;
  --md-outline-variant: #49454f;

  --md-inverse-surface: #e6e0e9;
  --md-inverse-on-surface: #322f35;
  --md-inverse-primary: #6750a4;
  --md-scrim: #000000;
}

@theme inline {
  --color-primary: var(--md-primary);
  --color-on-primary: var(--md-on-primary);
  --color-primary-container: var(--md-primary-container);
  --color-on-primary-container: var(--md-on-primary-container);

  --color-secondary: var(--md-secondary);
  --color-on-secondary: var(--md-on-secondary);
  --color-secondary-container: var(--md-secondary-container);
  --color-on-secondary-container: var(--md-on-secondary-container);

  --color-tertiary: var(--md-tertiary);
  --color-on-tertiary: var(--md-on-tertiary);
  --color-tertiary-container: var(--md-tertiary-container);
  --color-on-tertiary-container: var(--md-on-tertiary-container);

  --color-error: var(--md-error);
  --color-on-error: var(--md-on-error);
  --color-error-container: var(--md-error-container);
  --color-on-error-container: var(--md-on-error-container);

  --color-success: var(--md-success);
  --color-on-success: var(--md-on-success);
  --color-success-container: var(--md-success-container);
  --color-on-success-container: var(--md-on-success-container);

  --color-surface: var(--md-surface);
  --color-on-surface: var(--md-on-surface);
  --color-surface-variant: var(--md-surface-variant);
  --color-on-surface-variant: var(--md-on-surface-variant);

  --color-surface-lowest: var(--md-surface-container-lowest);
  --color-surface-low: var(--md-surface-container-low);
  --color-surface-container: var(--md-surface-container);
  --color-surface-high: var(--md-surface-container-high);
  --color-surface-highest: var(--md-surface-container-highest);

  --color-outline: var(--md-outline);
  --color-outline-variant: var(--md-outline-variant);

  --color-inverse-surface: var(--md-inverse-surface);
  --color-inverse-on-surface: var(--md-inverse-on-surface);

  --color-scrim: var(--md-scrim);

  --font-sans: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* M3 shape scale. */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 28px;

  /* M3 elevation levels 1-3; higher levels are unused in this app. */
  --shadow-e1: 0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15);
  --shadow-e2: 0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15);
  --shadow-e3: 0 4px 8px 3px rgb(0 0 0 / 0.15), 0 1px 3px 0 rgb(0 0 0 / 0.3);
}

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* M3 state layers: an overlay of the "on" color at a fixed opacity. */
@utility state-layer { position: relative; isolation: isolate; }
@utility state-layer-target {
  position: absolute; inset: 0; border-radius: inherit;
  background: currentColor; opacity: 0; transition: opacity 120ms ease; pointer-events: none;
}

/* M3 slider: 16dp handle, 4dp track, active track in the primary color. */
.md-slider { appearance: none; height: 16px; background: transparent; cursor: pointer; }
.md-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: var(--md-slider-track); }
.md-slider::-moz-range-track { height: 4px; border-radius: 2px; background: var(--md-slider-track); }
.md-slider::-webkit-slider-thumb {
  appearance: none; height: 16px; width: 16px; margin-top: -6px; border-radius: 9999px;
  background: var(--md-primary); border: none; box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
  transition: box-shadow 120ms ease;
}
.md-slider::-moz-range-thumb {
  height: 16px; width: 16px; border: none; border-radius: 9999px;
  background: var(--md-primary); box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
}
.md-slider:hover::-webkit-slider-thumb, .md-slider:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--md-primary) 16%, transparent);
}
.md-slider:hover::-moz-range-thumb, .md-slider:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--md-primary) 16%, transparent);
}
/* A real `outline` (not just the thumb glow above) guarantees a visible
   keyboard-focus indicator in every engine — the glow rules are WebKit/Gecko
   pseudo-elements and degrade silently if unsupported. */
.md-slider:focus-visible { outline: 2px solid var(--md-primary); outline-offset: 4px; }

/* Spinners fight with tabular alignment in numeric fields. */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button { appearance: none; margin: 0; }
input[type='number'] { -moz-appearance: textfield; }

/* Native date/checkbox controls follow the theme instead of the OS. */
input[type='date']::-webkit-calendar-picker-indicator { filter: var(--md-icon-filter, none); cursor: pointer; }
:root[data-theme='dark'] input[type='date']::-webkit-calendar-picker-indicator { filter: invert(1); }

/* Respect prefers-reduced-motion globally for CSS transitions/animations. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Screen-reader-only content: visually hidden, still in the a11y tree. */
.sr-only-focusable:not(:focus) {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
}
```

(A `--color-scrim` token maps `bg-scrim/60` for the report modal's backdrop.)

### Color-role quick reference

| Role | Light | Dark | Typical use |
| --- | --- | --- | --- |
| primary | #6750A4 | #D0BCFF | Primary buttons, active tab underline, focus rings |
| primary-container | #EADDFF | #4F378B | FS logo chip, top-bar avatar bg, `SummaryCard`/`FeatureIntro` accent tone |
| secondary-container | #E8DEF8 | #4A4458 | Selected toggle/pill, comparison strips |
| error / error-container | #B3261E / #F9DEDC | #F2B8B5 / #8C1D18 | Validation errors, "never pays off" banner, over-limit warnings |
| success / success-container | #3A6A41 / #BCF0C0 | #A1D5A4 / #23512C | Not a baseline M3 role — added for gains, M3 recipe |
| surface | #FEF7FF | #141218 | Page background |
| on-surface / on-surface-variant | #1D1B20 / #49454F | #E6E0E9 / #CAC4D0 | Primary / muted text |
| surface-container(-lowest…-highest) | 5-step, white→#E6E0E9 | 5-step, #0F0D13→#36343B | Elevation-like layering without shadows |
| outline / outline-variant | #79747E / #CAC4D0 | #938F99 / #49454F | Borders |

### Typography, shape, elevation

- Typeface: Roboto only, with a system fallback stack.
- Shape scale: `radius-xs` 4px, `radius-sm` 8px (every parameter input), `radius-md` 12px (cards),
  `radius-lg` 16px, `radius-xl` 28px (pills — top-bar toggles, credit-card switcher).
- Elevation: `shadow-e1` (resting cards, sticky top bar), `shadow-e2` (hover/raised), `shadow-e3`
  (most prominent surfaces, e.g. the report modal).

### `src/theme/theme.ts` — theme context + chart palettes

```ts
export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  mode: ThemeMode
  resolved: ResolvedTheme
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
export function useTheme(): ThemeContextValue { /* throws if used outside ThemeProvider */ }
export const THEME_STORAGE_KEY = 'fs.theme'

/**
 * Recharts needs literal color strings for its SVG attributes, so — unlike
 * every other color in the app — these are TypeScript constants, not CSS
 * custom properties. Reading them back via getComputedStyle would race the
 * theme-switching effect (a render-time read returns the *previous* theme's
 * colors for one frame). Values are the M3 tonal-palette steps that clear
 * contrast on each surface: tone 40 on light, tone 80 on dark.
 */
export interface ChartPalette {
  primary: string       // running total: savings balance, loan balance, card balance
  contributed: string   // what the user put in
  interest: string      // what the rate added
  deduction: string     // money taken away: withholding, fees, credit limit
  comparison: string    // a second scenario shown alongside the first
  grid: string
  axis: string
  cursor: string
}

const withCursor = (p: Omit<ChartPalette, 'cursor'>): ChartPalette => ({
  ...p, cursor: `color-mix(in srgb, ${p.primary} 12%, transparent)`,
})

export const CHART_PALETTES: Record<ResolvedTheme, ChartPalette> = {
  light: withCursor({ primary: '#6750a4', contributed: '#006a6a', interest: '#8b5000', deduction: '#b3261e', comparison: '#7d5260', grid: '#cac4d0', axis: '#49454f' }),
  dark:  withCursor({ primary: '#d0bcff', contributed: '#4fd8db', interest: '#ffb877', deduction: '#f2b8b5', comparison: '#efb8c8', grid: '#49454f', axis: '#cac4d0' }),
}

/** Wider categorical palette for charts with more slices than the 5 roles cover
 * (e.g. the budget expense donut) — same tonal steps, more hues, first 5 hues
 * intentionally repeat CHART_PALETTES' own colors. */
export const CATEGORY_COLORS: Record<ResolvedTheme, string[]> = {
  light: ['#6750a4','#006a6a','#8b5000','#b3261e','#7d5260','#385f0d','#0061a4','#6b5900'],
  dark:  ['#d0bcff','#4fd8db','#ffb877','#f2b8b5','#efb8c8','#a8d08d','#9ecaff','#ddc55c'],
}
```

### `src/theme/ThemeProvider.tsx`

Resolves `mode` (`'light'|'dark'|'system'`) into a `resolved` theme, sets `data-theme` on `<html>`,
persists **`mode`** (not the resolved value) to `localStorage` under `THEME_STORAGE_KEY`. In `system`
mode, listens to `window.matchMedia('(prefers-color-scheme: dark)')` live.

### `src/hooks/usePrefersReducedMotion.ts`

```ts
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}
```
Used to pass `isAnimationActive={!reduceMotion}` to every Recharts series (CSS transitions are already
killed globally by the media query above; Recharts' own entry animations are driven from JS, which CSS
can't reach).

## A.4 — Shared UI Component Library (`src/components/ui/`)

None of these import from `src/features` or `src/lib` (except pure formatting helpers). Barrel-export
all of them from `src/components/ui/index.ts`.

### `fieldStyles.ts` — the one control surface

```ts
export const inputClass =
  'h-11 w-full rounded-sm border border-outline-variant bg-surface-container-highest ' +
  'px-3 text-sm text-on-surface tabular-nums outline-none transition-colors ' +
  'hover:bg-surface-high focus:border-primary ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'group-data-[error=true]:border-error'

export const bareInputClass = inputClass
```
44px height, 8px radius, one shared focus ring — every input in the app renders through this class so a
row of mixed control types (a 56px filled field next to a 40px segmented control) never misaligns.

### `Controls.tsx` — `Button`, `IconButton`, `Switch`, `Disclosure`

```tsx
type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger'
const VARIANTS: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary shadow-e1 hover:shadow-e2',
  tonal: 'bg-secondary-container text-on-secondary-container',
  outlined: 'border border-outline text-primary',
  text: 'text-primary',
  danger: 'text-error',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  ref?: Ref<HTMLButtonElement>   // React 19 ref-as-prop, no forwardRef
}
// Button: h-10, rounded-xl, a state-layer <span> overlay for hover/active (opacity 8%/10%).
// IconButton: h-10 w-10, rounded-full, same state-layer pattern — for compact table actions.

interface SwitchProps { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }
// role="switch" aria-checked, handle grows 16dp→24dp with a check glyph when on.

interface DisclosureProps { title: ReactNode; summary?: ReactNode; defaultOpen?: boolean; children: ReactNode }
// Built on native <details>/<summary> — NOT a div driven by aria-expanded — so the browser
// handles focusability/Enter-Space/state-announcement for free. Chevron mirrors `open` via
// the `group-open:` variant, no React state needed.
```

### `Inputs.tsx` — `CurrencyInput`, `NumberInput`, `PercentInput`, `TextInput`, `Select`, `Checkbox`

Key behavioral contracts (implement exactly):

- **`CurrencyInput`**: whole-currency amount. Holds a `draft` string while typing (falls back to the
  formatted `value` prop when `draft` is `null`), so a half-typed value isn't reformatted out from under
  the caret; the caret is explicitly re-placed after the same *count of digits* it was behind, since
  reformatting on every keystroke would otherwise throw it to the end. `maxLength={18}`. `max` prop
  defaults to `1_000_000_000_000`, always applied via `Math.min` regardless of parse overflow.
- **`NumberInput`**: decimal input accepting either separator (`,` or `.`) so an `es-CO` user can type
  `11,5` and an `en-US` user `11.5`. A half-typed `"11,"` is left in the draft until blur; out-of-range
  keystrokes stay in the draft too, blur clamps. `maxLength={14}`.
- **`PercentInput`**: a thin wrapper over `NumberInput` — stores/receives a **fraction** (`0.11`),
  displays/accepts **percentage points** (`11`), owns the `×100`/`÷100` conversion so no call site
  repeats it.
- **`TextInput`**: `type?: 'text'|'email'|'password'`, `autoComplete` defaults to `'off'`/the type name,
  `ref?: Ref<HTMLInputElement>` (React 19 plain prop).
- **`Select<T extends string>`**: native `<select>` wearing `inputClass` with a custom chevron icon.
  Every `<option>` must carry `className="bg-surface-container text-on-surface"` explicitly — **do not
  rely on `color-scheme` alone** to theme the native popup; explicit `<option>` colors are the only
  reliable cross-browser fix for a dark-mode dropdown rendering with default/invisible native styling.
- **`Checkbox`**: a visually-hidden native `<input type="checkbox">` (`className="peer sr-only"`) driving
  a styled sibling box via `peer-*` variants — real checkbox semantics, custom visuals.
- All parsing goes through `src/lib/format.ts`'s `parseInteger`/`parseDecimal`/`clamp` (see A.5) — never
  reimplement parsing inline in a component.

### `ParamField.tsx` — the three-slot field wrapper

```tsx
interface ParamFieldProps {
  label: string
  helper?: ReactNode
  help?: string          // longer explanatory copy → renders a (?) HelpPopover; omit and none renders
  error?: string         // replaces helper, switches to error colors
  children: (id: string) => ReactNode
  className?: string
}
```
Three **fixed-height** slots — label (one line), control (`min-h-11`), helper (always renders a line;
render a non-breaking space `' '` when there's nothing to say) — so a field without a hint never sits
shorter than a neighbor that has one, and mixed control types in one grid row never misalign. A field
combining two controls in one logical unit (a rate value + its E.A./Nominal/Mensual convention selector)
is **one** `ParamField` with both controls laid out in a single row inside the control slot — never two
separate `ParamField`s.

### `HelpPopover.tsx` — the accessible `(?)` popover

```tsx
export function HelpPopover({ label, text }: { label: string; text: string })
```
The **one real `@material/web` usage** in the app: `<md-icon-button>` as the trigger, holding a custom
inline SVG glyph (not `<md-icon>`, to avoid pulling in the separate Material Symbols icon font for one
glyph). Panel opens on click, closes on Escape (returns focus to the trigger) or an outside pointerdown;
cross-referenced via `aria-describedby` while open. Panel positions `absolute` relative to its own
`relative`-positioned wrapper — **never `position: fixed`**, which would let it escape any container
(e.g. a modal) it's rendered inside.

> **Gotcha to carry forward**: passing a raw JS boolean to `aria-expanded` on `<md-icon-button>` silently
> fails — React sets a non-string value on a custom element as a JS *property*, not an HTML *attribute*,
> and the element's own ARIA reflection doesn't turn a JS `true`/`false` back into the `"true"`/`"false"`
> string a screen reader needs. Always pass the string explicitly: `aria-expanded={open ? 'true' : 'false'}`.

### `SegmentedControl.tsx`

Built on real `<input type="radio">` elements, visually hidden, with styled `<label>`s standing in for
each segment — **not** a `role="radio"` `<button>` re-implementation, which would need hand-rolled roving
tabindex/arrow-key handling to match native radiogroup behavior.

### `SliderWithNumber.tsx`

A slider paired with a numeric field. Supports optional non-linear (e.g. log-scaled) position mapping
via `toPosition`/`fromPosition` props — opt-in, every ordinary linear slider is unaffected. (Used by Meta
de ahorro's goal-amount slider — see B.2.)

### `Card.tsx`

```tsx
type CardVariant = 'elevated' | 'filled' | 'outlined'
interface CardProps { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; variant?: CardVariant; className?: string; bodyClassName?: string }

export function Card({ title, description, actions, children, variant = 'elevated', className = '', bodyClassName = 'p-4 sm:p-6' }: CardProps) {
  return (
    <section data-pdf-block="true" className={`rounded-lg ${VARIANTS[variant]} ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
          <div>
            {title && <h2 className="text-base leading-6 font-medium text-on-surface">{title}</h2>}
            {description && <p className="mt-0.5 text-xs leading-4 text-on-surface-variant">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
```
**Note the `data-pdf-block="true"` attribute on the root `<section>` — this is not part of the original
design, it is added in Part C.9 (report pagination fix) and is what gives every individual chart card in
every feature its own page-break-safe boundary in the PDF export, for free, with no per-feature changes.
Add it now if you're building fresh; it is inert until C.9's `generatePdf` reads it.**

### `CategoryCard.tsx`

A real `<fieldset>`/`<legend>` collapsible group with a live subtotal in the header and a collapse toggle
that starts **open** by default (unlike `Disclosure`'s closed-by-default — this is a data-entry form, not
optional extras). Used by Mi Presupuesto's five expense categories (B.7).

### `SummaryCard.tsx`

```tsx
export type SummaryTone = 'default' | 'negative' | 'accent'
const TONES: Record<SummaryTone, { container: string; value: string }> = {
  default: { container: 'bg-surface-low', value: 'text-on-surface' },
  negative: { container: 'bg-error-container', value: 'text-on-error-container' },
  accent: { container: 'bg-primary-container', value: 'text-on-primary-container' },
}
interface SummaryCardProps { label: string; value: string; caption?: ReactNode; tone?: SummaryTone }
```
An M3 filled card carrying one headline figure — label (label-medium), value (headline-small, tabular
nums), optional caption. `value` is always pre-formatted text; the card never knows about currencies.

### `CollapsibleYearTable.tsx` — the shared schedule table

The one detail-table implementation reused by every feature's monthly/yearly schedule. Groups rows by
year with collapsible subtotals (year 1 open by default), a sticky header, and **fixed-height row
virtualization** so a 480-month schedule stays at roughly 30 mounted DOM rows regardless of horizon
length. Supports a `renderDetail` slot for an expandable per-row detail panel (used by the credit card
schedule to show a month's individual installment charges) and a `rowClassName` callback (used to
highlight an over-limit month in red).

### `ExportCsvButton.tsx`

A small button that **lazily** builds and downloads a CSV via a `build: () => string` callback — the CSV
string is only constructed when the button is actually clicked, not on every render.

### `ChartFrame.tsx` + `VisuallyHiddenTable.tsx` + `ChartTooltip.tsx`

```tsx
// ChartFrame: marks a chart's container as one labelled image for a screen reader —
// a Recharts SVG's "text" is vector paths, unreadable without this.
export function ChartFrame({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <div role="img" aria-label={label} className={className}>{children}</div>
}

// VisuallyHiddenTable: the real numbers, in a sr-only <table>, rendered alongside every
// ChartFrame — the actual non-visual data access point, since the chart itself is opaque.

// ChartTooltip.tsx: one shared tooltip renderer for every chart in the app.
export function useValueTooltip(titleOf: (label: unknown) => string, formatValue: (value: number) => string) {
  return function ChartTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xs bg-inverse-surface px-3 py-2 text-xs shadow-e2">
        <p className="font-medium text-inverse-on-surface">{titleOf(label)}</p>
        <ul className="mt-1 space-y-0.5">
          {payload.map((entry, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
              <span className="text-inverse-on-surface/80">{entry.name}</span>
              <span className="ml-auto pl-3 font-medium tabular-nums text-inverse-on-surface">{formatValue(Number(entry.value ?? 0))}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}
export function useChartTooltip(titleOf: (label: unknown) => string) { /* formatCurrency-backed */ }
export function usePercentTooltip(titleOf: (label: unknown) => string) { /* value.toFixed(1)+'%' */ }
```
This tooltip renders inside Recharts' own `.recharts-tooltip-wrapper`, which Recharts positions
`absolute` **relative to the chart's own container**, not the viewport — never override this to
`position: fixed`.

### `FeatureIntro.tsx` + `LegalDisclaimer.tsx` — built in Part C.10; specified there in full.

## A.5 — Shared `lib/` Utilities

None of these import React or touch the DOM.

### `src/lib/dates.ts` — pure ISO-date arithmetic (verbatim, this file is small and complete)

```ts
const parse = (iso: string): [number, number, number] => {
  const [year, month, day] = iso.split('-').map(Number)
  return [year, month, day]
}
const pad = (v: number): string => String(v).padStart(2, '0')

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Adds whole months, clamping the day so 31 Jan + 1mo lands on 28/29 Feb, not March. */
export function addMonths(iso: string, months: number): string {
  const [year, month, day] = parse(iso)
  const absolute = year * 12 + (month - 1) + months
  const targetYear = Math.floor(absolute / 12)
  const targetMonth = (absolute % 12) + 1
  const clamped = Math.min(day, daysInMonth(targetYear, targetMonth))
  return `${targetYear}-${pad(targetMonth)}-${pad(clamped)}`
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = parse(iso)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** Sets the day of month, clamped to the month's length. */
export function withDayOfMonth(iso: string, day: number): string {
  const [year, month] = parse(iso)
  return `${year}-${pad(month)}-${pad(Math.min(day, daysInMonth(year, month)))}`
}

export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** "15 mar 2027" in the given locale. Parsed as UTC so the day never shifts by timezone. */
export function formatDate(iso: string, locale: string): string {
  const [year, month, day] = parse(iso)
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)))
}
```

### `src/lib/format.ts` — locale-aware formatting (memoised per locale/currency pair)

```ts
export const DEFAULT_LOCALE = 'es-CO'
export const DEFAULT_CURRENCY = 'COP'

// Bundle of Intl.NumberFormat instances per (locale, currency) — construction
// is expensive relative to one format() call, and the schedule table formats
// thousands of cells per keystroke.
function bundle(locale: string, currency: string): { currency, integer, abbrev, ratio: Intl.NumberFormat; symbol: string }

export function formatCurrency(value: number, locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY): string
// Thousands separators, no decimals, negatives in PARENTHESES: `(₡1.234)` not `-₡1.234`.
// Normalises -0 to 0 so a rounded-away negative doesn't render as "-$ 0".

export function formatAbbrev(value: number, locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY): string
// "$5M", "$10M", "$500K" — for chart axis labels. Thresholds: 1e9→B, 1e6→M, 1e3→K.

export function formatPercent(value: number, locale = DEFAULT_LOCALE, fractionDigits = 1): string
// "11%" / "11,5%" from a fraction.

export function formatMultiplier(value: number, locale = DEFAULT_LOCALE): string  // "1,83x"
export function formatInteger(value: number, locale = DEFAULT_LOCALE): string     // plain grouped int
export function currencySymbol(locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY): string
export const isNegative = (value: number): boolean => Math.round(value) < 0

/** The decimal separator this locale uses, so inputs can accept it. */
export function decimalSeparator(locale: string): string

/**
 * Parses user-typed digits into a whole number, tolerating any grouping.
 * Truncates to 15 digits first (a pathological paste can overflow Number()
 * to Infinity otherwise) so the conversion stays inside a safe integer range
 * unconditionally.
 */
export function parseInteger(raw: string): number

/** Accepts either decimal separator so an es-CO user can type "11,5" and an en-US user "11.5". */
export function parseDecimal(raw: string): number | null

/** NaN-safe clamp — Math.max/min propagate NaN through instead of clamping it. */
export const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min

export const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] as const

/**
 * The exactly-five currencies the app supports (wired in Part C.3) — no open
 * locale/currency pairing. Deliberately carries no locale of its own: number
 * formatting always follows the UI LANGUAGE, never the selected currency —
 * see A.7/C.3 for why.
 */
export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'KYD', 'COP'] as const
export type CurrencyCode = (typeof CURRENCY_CODES)[number]
```

### `src/lib/limits.ts` — every array-size cap, exhaustive, with the exact values

```ts
/**
 * Hard caps on every array the user grows one row at a time. None of today's
 * UI lets someone paste hundreds of rows at once, but these exist regardless
 * of how a row gets added: without one, enough clicking could grow an array
 * large enough to noticeably slow the render (every row re-runs the whole
 * model, and renders its own set of inputs). Each value is generous for any
 * real scenario and small enough to stay fast.
 */
export const MAX_RATE_TIERS = 12
export const MAX_EXTRA_PAYMENTS = 24
export const MAX_DEFERRED_PURCHASES = 30
export const MAX_RECURRING_EXPENSES = 20
export const MAX_CREDIT_CARD_DEBTS = 10
export const MAX_AUTO_LOAN_DEBTS = 10
export const MAX_OTHER_LOAN_DEBTS = 10
export const MAX_BUDGET_OTHER_CATEGORIES = 15
export const MAX_CREDIT_CARDS = 8
```

### `src/lib/csv.ts` — CSV export, one function per feature

```ts
/**
 * A cell whose text starts with =, +, -, or @ is read as the start of a
 * formula by Excel/Sheets on open (CWE-1236, standard CSV formula-injection
 * vector). Prefixing it with a literal apostrophe forces plain-text — applied
 * to EVERY cell, including a plain negative number (withholding/extra-payment
 * columns are often negative), which is the deliberate trade-off for making
 * the export safe to open unconditionally, with no per-column allowlist.
 */
const FORMULA_PREFIX = /^[=+\-@]/
const sanitizeForSpreadsheet = (value: string): string => FORMULA_PREFIX.test(value) ? `'${value}` : value
const escape = (value: string): string => {
  const safe = sanitizeForSpreadsheet(value)
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
export const csvRow = (cells: (string | number)[]): string =>
  cells.map((c) => escape(typeof c === 'number' ? String(c) : c)).join(',')
export const round2 = (value: number): number => Math.round(value * 100) / 100
```
Every feature gets its own `xToCsv(rows, params, totals)` function: a `Parámetro,Valor` recap section
(the entered parameters), a blank line, then `SECCIÓN,<name>` and the full schedule table.
**CSV output is always produced in Spanish, regardless of the active UI language** — a deliberate,
permanent asymmetry versus every other user-facing string in the app (decided once, in Part C.2, and
never revisited).

### `src/lib/report.ts` — PDF export. Build the version from **Part C.9**, not an earlier draft — see
that section for the full, final implementation (per-block capture + pure pagination planner). Do not
implement the naive "one giant canvas sliced at fixed page heights" version even as a first pass; it is
a known, already-fixed bug (Part C.9 documents exactly why it's wrong).

## A.6 — Global App Shell & Routing

### Routing: `src/hooks/useHashTab.ts`

```ts
const read = (valid: readonly string[], fallback: string): string => {
  const id = window.location.hash.replace(/^#\/?/, '')
  return valid.includes(id) ? id : fallback
}

/** Keeps the active tab in the URL hash so a view can be linked/shared, and so
 * browser back/forward move between tabs. */
export function useHashTab<T extends string>(valid: readonly T[], fallback: T): [T, (id: T) => void] {
  const [active, setActive] = useState<T>(() => read(valid, fallback) as T)

  useEffect(() => {
    const onHashChange = () => setActive(read(valid, fallback) as T)
    window.addEventListener('hashchange', onHashChange)
    // Normalise a missing/unknown hash on first load.
    if (window.location.hash.replace(/^#\/?/, '') !== active) {
      window.history.replaceState(null, '', `#/${active}`)
    }
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [active, fallback, valid])

  const select = useCallback((id: T) => {
    window.location.hash = `#/${id}`
    setActive(id)
  }, [])

  return [active, select]
}
```
This is the whole app's router. There is no other client-side routing library. `#/login` and `#/ayuda`
(added in Parts C.1/C.6) are valid *routes* but are never in the tab strip — only reachable from the top
bar — and both remember and return to whichever tab was active before they opened.

> **Known collision to avoid**: any plain `<a href="#some-id">` anchor used purely for an in-page
> fragment jump (e.g. a skip-to-content link) will, if actually followed by the browser, set
> `location.hash` and get read by this same hook as a route request — an unrecognized fragment falls
> back to the default tab, silently kicking the user out of whatever page they were on. Any such link
> **must** `event.preventDefault()` and move focus programmatically instead of letting the browser
> follow the href. This bites the Ayuda skip-link specifically — see C.6.

### `src/App.tsx` — provider stack, top bar, tab strip, hash-route switch

Provider nesting order (outermost to innermost), matching exactly:

```
ThemeProvider > I18nProvider > LocaleProvider > AuthProvider > AccessGate > Shell
```
(`AuthProvider` and `AccessGate` are added in Part C.1/C.8 respectively — build the shell now with just
`ThemeProvider > I18nProvider > LocaleProvider > Shell` and add the rest later exactly as instructed.)

`Shell` owns:
- `const [active, setActive] = useHashTab<RouteId>(ROUTE_IDS, 'ahorro')`.
- A `lastRealTab` piece of state, updated **during render** (not in a `useEffect`) whenever `active`
  changes away from a non-tab route, guarded by comparing against a `prevActive` ref-like state — this
  is React's documented pattern for deriving state from a changed value without an extra post-commit
  render pass, avoiding any visible flash.
- The sticky top app bar (`<header className="sticky top-0 z-20 bg-surface-container shadow-e1">`)
  containing: the "FS" logo chip, the app title, and (right-aligned) the language toggle, currency
  selector, theme toggle, help icon, and account control (all specified in later prompts, stub them for
  now as inert placeholders you'll wire up).
- The primary tab strip (`<nav>` with a horizontally-scrollable `<ul>` of `<a href="#/<tab>">`s), each
  with an M3 active-indicator underline.
- The `<main>` switch rendering whichever feature is active.
- A `<footer>` with a one-line disclaimer placeholder (superseded by Part C.10's `LegalDisclaimer`,
  which moves per-tab instead).

`TAB_IDS` (in this exact order): `ahorro`, `meta`, `retiro`, `credito`, `consolidacion`, `tarjeta`,
`presupuesto`.

## A.7 — Internationalization Architecture

Even though the full retrofit happens in Part C.2, build the *mechanism* now so every calculator in Part
B is written against it from its very first line — do not write a single hardcoded string anywhere,
ever, even before C.2's enforcement test exists.

### `src/i18n/i18n.ts`

```ts
export type Language = 'es' | 'en'
export const LANGUAGE_LOCALES: Record<Language, string> = { es: 'es-CO', en: 'en-US' }
export const LANGUAGE_LABELS: Record<Language, string> = { es: 'Español', en: 'English' }
export const LANGUAGE_STORAGE_KEY = 'fs.language'

export interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Dictionary          // the active dictionary — read directly: t.savings.finalBalance
  dateLocale: string     // follows the UI language
}
export const I18nContext = createContext<I18nContextValue | null>(null)
export function useI18n(): I18nContextValue { /* throws outside provider */ }
export function useT(): Dictionary { return useI18n().t }   // shorthand for the common case
```

### `src/i18n/I18nProvider.tsx`

On first visit, guesses the language from `navigator.language` (defaulting to Spanish if
undetectable); on a return visit, restores from `localStorage[LANGUAGE_STORAGE_KEY]`. Persists on every
change.

### `src/i18n/es.ts` / `en.ts`

`es.ts` is the **reference dictionary** — a single large object literal, one top-level key per feature
namespace (`common`, `auth`, `savings`, `savingsGoal`, `retirement`, `loan`, `debtConsolidation`, `card`,
`budget`, `help`, `app`, ...). `en.ts` is **typed against** `es.ts`'s inferred `Dictionary` type, so
adding a key to one and not the other **fails the TypeScript build**.

Interpolated strings are **functions**, never template placeholders inserted into a translated string at
runtime:
```ts
// es.ts
lastPaymentSaved: (months: number, saved: string) => `${months} meses — ${saved} menos`
// en.ts — same key, args in whatever order English grammar needs, argument TYPES checked by the compiler
lastPaymentSaved: (months: number, saved: string) => `saved ${saved} over ${months} months`
```
Every field that has a help popover (Part C.2) carries **two** dictionary entries for one explanation:
`xHelp` (1–2 sentences, the popover) and `xHelpLong` (a fuller paragraph, reused verbatim by Ayuda,
Part C.6) — one source of truth, never two copies to keep in sync.

**Architectural rule, never violate it**: feature hooks (Part B) never build sentences. A hook returns a
small descriptor object — `{ code: 'overLimit', month: 6 }` — and the *component* translates it via
`t.feature.someKey(descriptor.month)`. This is what keeps every hook language-agnostic; no hook or model
anywhere in this codebase ever calls `useT()` or `useI18n()`.

### The no-hardcoded-strings guard test (build this in Part C.2, but know its exact shape now)

`src/i18n/__tests__/noHardcodedStrings.test.ts` — walks the **real TypeScript AST** (via the TypeScript
Compiler API, `ts.createSourceFile` + `ts.forEachChild`), not a regex/grep, because a regex is too easy
to fool with JSX's nesting:

```ts
// @vitest-environment node — a pure static-analysis test, not a rendering one.
/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const SRC_ROOT = join(currentDir, '..', '..')
const ATTRIBUTE_WATCHLIST = new Set(['aria-label', 'alt', 'title', 'placeholder'])

function hasLetters(text: string): boolean { return /\p{L}{2,}/u.test(text) }

function collectTsxFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectTsxFiles(full, files)
    else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) files.push(full)
  }
  return files
}

/** True when `node` sits anywhere inside an aria-hidden="true" element — decorative content. */
function isInsideAriaHidden(node: ts.Node): boolean { /* walks node.parent chain checking JsxElement openingElement attributes */ }

function checkFile(path: string): string[] {
  const text = readFileSync(path, 'utf8')
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const violations: string[] = []
  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const trimmed = node.text.trim()
      if (trimmed && hasLetters(trimmed) && !isInsideAriaHidden(node)) violations.push(/* file:line — JSX text "..." */ '')
    } else if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression) && hasLetters(node.expression.text) && !isInsideAriaHidden(node)) {
      violations.push(/* JSX expression {'...'} */ '')
    } else if (ts.isJsxAttribute(node) && ATTRIBUTE_WATCHLIST.has(node.name.getText(sourceFile)) && node.initializer && ts.isStringLiteral(node.initializer) && hasLetters(node.initializer.text)) {
      violations.push(/* attribute="..." */ '')
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return violations
}

describe('no hardcoded user-facing strings', () => {
  it('every JSX text node and aria-label/alt/title/placeholder comes from the i18n dictionary', () => {
    const violations = collectTsxFiles(SRC_ROOT).flatMap(checkFile)
    expect(violations).toEqual([])
  })
})
```
Scans **only `.tsx` files** (plain `.ts` files, like hooks and models, are outside its scope by design —
they never render JSX anyway). Register it with Vitest via `vite.config.ts`'s
`include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.tsx']` (the second glob pattern also matches
`.test.tsx` files that sit directly under `src/`, like the a11y suite, not only ones inside a
`__tests__` folder).

## A.8 — Currency & Locale Architecture

### `src/context/locale.ts`

```ts
export interface LocaleContextValue {
  locale: string                                  // read-only, derived from LANGUAGE — see below
  currency: string
  setCurrency: (currency: string) => void
  formatCurrency: (value: number) => string
  formatAbbrev: (value: number) => string
  formatPercent: (value: number, fractionDigits?: number) => string
  formatMultiplier: (value: number) => string
  formatInteger: (value: number) => string
  currencySymbol: string
}
export const LocaleContext = createContext<LocaleContextValue | null>(null)
export function useLocale(): LocaleContextValue { /* throws outside provider */ }
```

**The one rule to never violate**: `locale` (which drives thousands/decimal *separator style*) is
derived from `LANGUAGE_LOCALES[language]` — the active **UI language** — never from the selected
**currency**. Someone reading the app in English sees `$1,234.56` even when the currency is Colombian
pesos, never `$1.234,56`. `LocaleProvider` derives `locale` this way internally; it's exposed read-only
on the context only for the couple of consumers (`Inputs.tsx`) that need it to parse what the user
types. This decoupling is why `CurrencyCode` (in `format.ts`) deliberately carries no locale of its own
— it's just a code plus a label. (Wired for real in Part C.3; the five-currency list itself is C.3's
job — build the mechanism now with a single default currency, e.g. `'COP'`.)

## A.9 — Accessibility Baseline (applies to every prompt from here on)

- Every parameter field: real `<label htmlFor>`, via `ParamField`.
- Every `(?)` popover: `HelpPopover`, `aria-describedby`, keyboard-operable, closes on Escape/outside
  click, returns focus to the trigger.
- Every custom toggle/switch/segmented-control: real ARIA role (`switch`, native radio inputs) or a
  native element (`<details>`), never a bare styled `<div>`.
- Every chart: a `ChartFrame` (`role="img" aria-label="..."`) plus a `VisuallyHiddenTable` with the same
  data, sr-only.
- Focus-visible outline: one shared 2px primary-colored ring everywhere, never suppressed without a
  replacement.
- Respect `prefers-reduced-motion` (CSS globally; Recharts per-series via `usePrefersReducedMotion`).
- An automated `axe-core` smoke test (`src/a11y.test.tsx`, `@vitest-environment jsdom`) renders `<App />`
  and each tab in turn, asserting zero violations, plus, once C.1/C.6/C.8 exist, the login screen, Ayuda
  (empty + with a field selected), and the access gate. Needs three jsdom stand-ins that don't exist in
  the default jsdom environment, added in `beforeAll`:
  ```ts
  window.matchMedia ??= (query) => ({ matches: false, media: query, onchange: null, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false })
  class StubResizeObserver { observe(){}; unobserve(){}; disconnect(){} }
  globalThis.ResizeObserver ??= StubResizeObserver
  // @material/web's form-associated <md-icon-button> calls ElementInternals methods jsdom doesn't implement:
  const internals = globalThis.ElementInternals?.prototype
  if (internals) { internals.setFormValue ??= () => {}; internals.setValidity ??= () => {}; internals.checkValidity ??= () => true; internals.reportValidity ??= () => true }
  ```

## A.10 — Testing Strategy Overview

- One `src/lib/__tests__/<model>.test.ts` file per pure model (Part B), run under plain Node
  (`@vitest-environment` defaults to `node` per `vite.config.ts`). Every model's tests include at least
  one **reference check** against whatever external "source calculator" figure the brief specifies —
  and where the model's actual output doesn't match that figure, the test pins what the model *actually*
  produces and the discrepancy is written up as an explicit, investigated, open item (see Part E.4) —
  never silently forced to match a number the formula doesn't produce.
- `src/i18n/__tests__/noHardcodedStrings.test.ts` (A.7).
- `src/a11y.test.tsx` (A.9), plus a dedicated `src/features/auth/__tests__/AccessGate.test.tsx` once
  Part C.8 exists.
- `src/lib/__tests__/report.test.ts` once Part C.9 exists — unit tests for the pure pagination planner
  and the DOM block-collector, with no canvas/jsPDF involved (see C.9 for why this split matters).
- Everything runs via `npm test` (`vitest run`) and is also the middle step of `npm run build`.

---

# PART B — THE SEVEN CALCULATORS

Build each of these seven as one self-contained prompt. Every one follows the **exact same shape**,
described once here, so each subsection below only needs to state what's unique to it.

## B.0 — The shared per-feature shape (applies to all seven)

**Files**, per feature `X` (`savings`, `savingsGoal`, `retirement`, `loan`, `debtConsolidation`,
`creditCard`, `budget`):
```
src/lib/<model>.ts                       # pure model: Params, Row(s), Totals interfaces + functions
src/lib/__tests__/<model>.test.ts        # unit tests incl. the reference check
src/features/<feature>/use<Feature>.ts   # the ONE hook owning that feature's Params state
src/features/<feature>/<Feature>Feature.tsx   # top-level component
src/features/<feature>/components/
  <Feature>ParametersPanel.tsx
  <Feature>Summary.tsx
  <Feature>Charts.tsx
  <Feature>Schedule.tsx
```

**Hook contract** (identical shape every time):
```ts
export interface XController {
  params: XParams
  update: (patch: Partial<XParams>) => void
  reset: () => void
  rows: XRow[]                 // or several named row arrays, e.g. Retiro's two-phase schedule
  totals: XTotals               // summarized headline figures
  warnings: XWarning[]          // descriptor objects, never pre-built sentences
  // any feature-specific extras (e.g. Crédito's monthlyRate, Tarjeta's per-card management fns)
}
export function useX(): XController {
  const [params, setParams] = useState<XParams>(createXParams)
  const update = useCallback((patch) => setParams((prev) => ({ ...prev, ...patch })), [])
  const reset = useCallback(() => setParams(createXParams()), [])
  const rows = useMemo(() => simulateX(params), [params])
  const totals = useMemo(() => summarizeX(rows, params), [rows, params])
  const warnings = useMemo(() => validate(params, rows), [params, rows])
  return { params, update, reset, rows, totals, warnings }
}
```

**Top-level component contract** (identical shape every time — this is the exact structure Part C.5,
C.9, and C.10 all assume and build on top of; write it this way from the start):
```tsx
export function XFeature() {
  const x = useX()
  const { formatCurrency, formatPercent } = useLocale()
  const t = useT()
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        <Button variant="tonal" onClick={() => setShowReport(true)}>{t.common.viewReport}</Button>
      </div>
      <XParametersPanel x={x} />
      <XSummary x={x} />
      <XCharts x={x} />
      <XSchedule x={x} />

      <ReportView
        open={showReport} onClose={() => setShowReport(false)} featureTitle={t.app.tabs.x}
        parameters={[/* every scalar input, as { label, value } pairs */]}
        summary={<XSummary x={x} />} charts={<XCharts x={x} />}
        table={{ columns: [...], rows: x.rows.map((row) => [...]) }}
      />
    </div>
  )
}
```
(The `<div className="flex justify-end">` row and the plain footer become, respectively, the
`FeatureIntro`-augmented row and a `<LegalDisclaimer />` in Part C.10 — build the plain version first,
per Part B, then apply C.10's edit to all seven afterward, in order.)

**Data model contract**: every feature's data is exactly a `Params` (input) → `Row[]` (schedule,
computed) → `Totals` (rolled-up summary, computed) triple. All monetary fields are plain numbers in
whole currency units (never cents); all rate fields are fractions (`0.11` means 11%); every `id` field on
a repeatable row is a string from an incrementing in-memory counter (e.g. `tier-3`), unique only for the
page's lifetime.

**Charts convention**: a `grid grid-cols-1 gap-4 lg:grid-cols-3` (or similar) of `<Card>`s, each wrapping
one `<ChartFrame><ResponsiveContainer width="100%" height="100%"><Recharts-chart-here /></ResponsiveContainer></ChartFrame>`
plus a `<VisuallyHiddenTable>` with the same series.

**CSV convention**: one `xToCsv(rows, params, totals)` export in `csv.ts`, wired to the schedule's
`<ExportCsvButton>`.

Now, the seven models — read each subsection as "everything from B.0, plus exactly this."

## B.1 — Ahorro (Savings)

**Question answered**: how much will a fixed monthly contribution grow to, given a rate (optionally
tiered)?

**`src/lib/simulate.ts`**:
```ts
export type RateTierMode = 'age' | 'balance'
export interface RateTier { id: string; from: number; annualRate: number }
// `from` = "desde el mes" in age mode, "saldo mínimo" in balance mode.

export interface SavingsParams {
  monthlyContribution: number
  annualRate: number              // fraction
  years: number                   // 1–40
  withholdingRate: number         // fraction, default 0.07
  contributionGrowth: number      // fraction, annual step-up
  realMonthlyCompounding: boolean // false: monthly credit = annual interest ÷ 12 (default, matches
                                   // source spreadsheet). true: genuine (1+r)^(1/12)-1 compounding —
                                   // deliberately NOT r/12, since r/12 under the same withholding
                                   // reproduces the default formula exactly and the toggle would be a no-op.
  tiersEnabled: boolean
  tierMode: RateTierMode
  tiers: RateTier[]
}
export interface SavingsRow {
  month: number; year: number; monthOfYear: number
  annualRate: number
  contribution: number
  grossAnnualInterest: number
  withholding: number             // always ≤ 0
  netAnnualInterest: number
  monthlyInterest: number         // amount actually credited this month
  balance: number
  contributedToDate: number
}
export interface SavingsTotals {
  finalBalance: number; totalContributed: number
  grossInterest: number; totalWithholding: number; netInterest: number
  multiplier: number   // finalBalance / totalContributed, 0 if nothing contributed
  months: number
}

export const MIN_YEARS = 1
export const MAX_YEARS = 40
export const DEFAULT_SAVINGS_PARAMS: SavingsParams = {
  monthlyContribution: 500_000, annualRate: 0.11, years: 15, withholdingRate: 0.07,
  contributionGrowth: 0, realMonthlyCompounding: false, tiersEnabled: false, tierMode: 'age', tiers: [],
}
export const createSavingsParams = (): SavingsParams => ({ ...DEFAULT_SAVINGS_PARAMS, tiers: [makeTier(1, 0.11)] })

/** Sorts tiers ascending, pins the first to the floor of its domain (month 1 / balance 0) —
 * that's what makes a tier table total: every month/balance resolves to exactly one tier. */
export function normalizeTiers(tiers: RateTier[], mode: RateTierMode): RateTier[]

/** Age mode: tier with the largest `from` ≤ month. Balance mode: largest `from` ≤ PRIOR month's balance
 * (so the rate steps up as the fund grows). */
export function resolveRate(params: SavingsParams, month: number, previousBalance: number): number

function monthlyInterestOn(base: number, annualRate: number, real: boolean): number {
  return real ? base * (Math.pow(1 + annualRate, 1/12) - 1) : (base * annualRate) / 12
}

export function simulate(params: SavingsParams): SavingsRow[] {
  // For t = 1..years*12:
  //   year[t] = floor((t-1)/12) + 1
  //   contribution[t] = monthlyContribution × (1 + contributionGrowth)^(year[t]-1)
  //   rate[t] = resolveRate(t, balance[t-1])
  //   base[t] = t==1 ? contribution[1] : balance[t-1]     ← month 1 has no prior balance, so the
  //                                                           contribution stands in for it (intentional)
  //   grossMonthly[t] = monthlyInterestOn(base[t], rate[t], realMonthlyCompounding)
  //   grossAnnual[t] = grossMonthly[t] × 12
  //   withholding[t] = -grossAnnual[t] × withholdingRate
  //   netAnnual[t] = grossAnnual[t] + withholding[t]
  //   monthlyInterest[t] = netAnnual[t] / 12
  //   balance[t] = balance[t-1] + contribution[t] + monthlyInterest[t]
}
export function summarizeSavings(rows: SavingsRow[]): SavingsTotals
```

**Reference checks / deviations (pin these exactly in tests)**:
- 50,000,000 at 18% E.A. over 60 months French — shared cross-check with the loan model (B.4), not
  Ahorro-specific; skip here.
- At the app's own defaults with tiers `[{month 1, 11%}, {month 14, 13%}]`: month-60 balance =
  **40,837,320**. The brief this was built against quotes **39,041,631** for the same scenario — a full
  parameter scan (switch month, second rate, retention rate, contribution growth, per-month rounding,
  interest base) found **no combination** reproducing that figure; the closest natural reading (flat 11%
  over 60 months) gives 38,961,827. **Pin the value the model actually produces** (40,837,320) and record
  the discrepancy as an open, investigated issue — do not force-match the wrong number.
- "Capitalización mensual real" (real monthly compounding) produces a **lower** balance than the default
  at the same inputs: 202,518,437 vs. 211,687,038 at defaults — lower, not higher, because true monthly
  compounding of a fixed annual rate is less generous per month than dividing the annual figure by 12.

**UI specifics**: a collapsible "Tramos de tasa" (`Disclosure`) reveals the editable tier table in two
modes (por antigüedad / por saldo); tiers auto-sort ascending, first pinned to month 1/balance 0.
`Interés anual` is always the source of truth for the base rate — editing it rewrites tier 1 and vice
versa. Charts: growth area chart (balance vs. contributed, `lg:col-span-3`), composition donut
(contributions vs. net interest), average-monthly-interest-by-year bar chart.

## B.2 — Meta de Ahorro (Savings Goal)

**Question answered**: how long until a fixed contribution reaches a target — or what contribution
would hit it exactly on schedule? (Goal-seeking compound interest, the mirror image of solving a loan
payment.) **Reuses `toMonthlyRate` from `amortize.ts` (B.4)** rather than a second rate-conversion
helper — build B.4 first, or stub `toMonthlyRate` and wire it properly once B.4 exists.

**`src/lib/savingsGoal.ts`**:
```ts
export interface SavingsGoalParams {
  goal: number
  years: number                  // 1–40; horizon for the chart/table and requiredContribution
  currentSavings: number
  monthlyContribution: number    // compared against the required contribution, not solved for
  expectedReturn: number         // fraction, always read as Effective Annual, no convention selector
  expectedInflation: number      // DISPLAY-ONLY — see below
}
export const DEFAULT_SAVINGS_GOAL_PARAMS: SavingsGoalParams = {
  goal: 10_000_000, years: 5, currentSavings: 0, monthlyContribution: 200_000,
  expectedReturn: 0.0025, expectedInflation: 0.03,
}
const MAX_MONTHS_SEARCHED = 12 * 100   // 100-year hard stop

/** Future value of an ANNUITY-DUE contribution (paid at the START of each month —
 * matches the source calculator's own stated assumption). i=0 falls back to linear accumulation. */
export function fv(months: number, contribution: number, startingBalance: number, i: number): number {
  if (months <= 0) return startingBalance
  if (i === 0) return startingBalance + contribution * months
  const growth = Math.pow(1 + i, months)
  return startingBalance * growth + contribution * ((growth - 1) / i) * (1 + i)
}

/** Smallest month with fv(...) >= goal. null if: (contribution<=0 AND i<=0) — a
 * guaranteed-never case checked up front — OR the goal isn't reached within
 * MAX_MONTHS_SEARCHED — a practical-never case, reported the same as truly unreachable. */
export function monthsToGoal(goal: number, contribution: number, currentSavings: number, i: number): number | null

/** Closed-form solve of fv(n, c, p0, i) = goal for c — NOT a search.
 * A negative raw result (currentSavings alone already clears the goal by interest) is clamped to 0. */
export function requiredContribution(goal: number, currentSavings: number, i: number, months: number): number {
  if (months <= 0) return 0
  if (i === 0) return Math.max(0, (goal - currentSavings) / months)
  const growth = Math.pow(1 + i, months)
  return Math.max(0, ((goal - currentSavings * growth) * i) / ((growth - 1) * (1 + i)))
}

/** Display-only: discounts `goal` back by `inflation` over `years`. Does NOT feed monthsToGoal or
 * requiredContribution — both are always nominal. Adjusting the goal itself for inflation before
 * solving would be a materially different (and larger) model. */
export function todaysPurchasingPower(goal: number, inflation: number, years: number): number {
  return goal / Math.pow(1 + inflation, years)
}

export interface SavingsGoalResult {
  monthlyRate: number
  monthsToGoal: number | null
  requiredContribution: number   // solved over years×12 months — the horizon, not monthsToGoal
  purchasingPowerToday: number
}
export function evaluateSavingsGoal(params: SavingsGoalParams): SavingsGoalResult

export interface GoalYearRow {
  year: number                    // 0-based through `years`
  balanceAtContribution: number   // projected at monthlyContribution
  balanceAtRequired: number       // projected at the solved requiredContribution
  differenceVsGoal: number        // balanceAtContribution - goal; negative shown in parens = short
}
export function buildGoalSchedule(params: SavingsGoalParams): GoalYearRow[]
// Year-by-year, not month-by-month — the reference itself reports by year and the horizon is short
// enough that finer granularity isn't needed.
```

**Reference check**: 10,000,000 goal, 5 years, 200,000/month at 0.25% E.A. → reaches the goal in **50
months** ("4 años y 2 meses") and requires **165,611/month** to land exactly at the 5-year mark — both
verified against the source calculator's own worked example.

**UI specifics**: the goal-amount slider uses `SliderWithNumber`'s **log-scaled** position mapping (ticks
at $0/$1M/$10M/$100M) — a linear track would put every realistic goal in the first few pixels.

## B.3 — Retiro (Retirement)

**Question answered**: accumulate toward retirement, then draw a monthly income during retirement — what
is that income, before/after tax and inflation? **Reuses `toMonthlyRate` from `amortize.ts` (B.4)**.

**`src/lib/retirement.ts`**:
```ts
export interface RetirementParams {
  startingBalance: number; annualContribution: number
  currentAge: number; retirementAge: number; retirementYears: number
  growContributionsWithInflation: boolean   // contribution[t] = annualContribution × (1+inflation)^(t-1)
  taxDeferred: boolean                      // selects the tax branch — see resolveEffectiveRates
  returnBeforeRetirement: number; returnDuringRetirement: number
  currentTaxRate: number; retirementTaxRate: number
  inflation: number
}
export const DEFAULT_RETIREMENT_PARAMS: RetirementParams = {
  startingBalance: 250_000_000, annualContribution: 24_000_000,
  currentAge: 45, retirementAge: 65, retirementYears: 30,
  growContributionsWithInflation: false, taxDeferred: true,
  returnBeforeRetirement: 0.07, returnDuringRetirement: 0.04,
  currentTaxRate: 0, retirementTaxRate: 0, inflation: 0.03,
}
export const MIN_CURRENT_AGE = 18; export const MAX_CURRENT_AGE = 90
export const MIN_RETIREMENT_AGE = 40; export const MAX_RETIREMENT_AGE = 90
export const MIN_RETIREMENT_YEARS = 1; export const MAX_RETIREMENT_YEARS = 50

/** taxDeferred=true: growth compounds at the stated rate untaxed; the WITHDRAWAL is taxed later
 *  (once). taxDeferred=false: the annual RATE is taxed every year instead; the withdrawal is NOT
 *  taxed again — this is what keeps either branch from taxing the same money twice. */
export function resolveEffectiveRates(params): { before: number; during: number } {
  return {
    before: params.taxDeferred ? params.returnBeforeRetirement : params.returnBeforeRetirement * (1 - params.currentTaxRate),
    during: params.taxDeferred ? params.returnDuringRetirement : params.returnDuringRetirement * (1 - params.retirementTaxRate),
  }
}

/** Future value of a starting balance + a SEQUENCE of annuity-due contributions (one per year,
 * contributed before that year's growth). savingsGoal.fv generalised from a flat contribution to
 * a schedule — needed to support inflation-growing contributions. */
export function accumulate(startingBalance: number, contributions: number[], rate: number): number {
  let balance = startingBalance
  for (const c of contributions) balance = (balance + c) * (1 + rate)
  return balance
}
export function buildContributionSchedule(params: RetirementParams): number[]
// years = max(0, retirementAge - currentAge); contribution[i] = growWithInflation
//   ? annualContribution × (1+inflation)^i : annualContribution

/** ORDINARY annuity (income at the END of each month) — the ONE departure from "period start"
 * everywhere else in this app. Only reproduces the reference's own numbers under this convention. */
export function monthlyIncomeFromBalance(balance: number, i: number, months: number): number {
  if (months <= 0) return 0
  if (i === 0) return balance / months
  return (balance * i) / (1 - Math.pow(1 + i, -months))
}
export function purchasingPowerToday(amount: number, inflation: number, years: number): number

export interface RetirementResult {
  effectiveReturnBeforeRetirement: number; effectiveReturnDuringRetirement: number
  monthlyRateDuringRetirement: number; contributions: number[]
  balanceAtRetirement: number
  monthlyIncomeBeforeTax: number; monthlyIncomeAfterTax: number  // after-tax only differs when taxDeferred
  monthlyIncomeToday: number    // monthlyIncomeAfterTax discounted to today — THE headline figure
}
export function evaluateRetirement(params: RetirementParams): RetirementResult

export interface AccumulationYearRow { year: number; age: number; contribution: number; balance: number }
export function buildAccumulationSchedule(params): AccumulationYearRow[]  // one row per accumulation year

export interface RetirementYearRow { year: number; age: number; monthlyIncome: number; remainingBalance: number }
export function buildRetirementSchedule(params, result): RetirementYearRow[]
// one row per withdrawal year, sampled every 12th month: balance = balance*(1+im) - payment

export interface RetirementMonthPoint { month: number; age: number; balance: number }
/** Month-by-month depletion during withdrawal — feeds an optional "Saldo durante el retiro" chart,
 * a value-add beyond the reference (which doesn't show this), included because the model already
 * has every number needed for it for free. */
export function buildRetirementDepletion(params, result): RetirementMonthPoint[]
```

**Reference check**: 250,000 balance, 2,000/year contribution, ages 45→65, 30 years retired, 7%/4%
returns, 0% taxes → balance at retirement ≈ **1,055,151**, monthly income before tax ≈ **4,994**, monthly
income in today's money ≈ **2,765** — all matched exactly.

**Caveat to carry forward**: the tax branch has only been checked at 0% for both rates (the one
reference scenario available). Treat non-zero-tax results as *directionally* correct, not
reference-grade, until checked against a real worked example with nonzero rates.

## B.4 — Crédito (Loan)

**Question answered**: what is the full amortization schedule of a loan — French/German/bullet — with
grace periods and extra payments?

**`src/lib/amortize.ts`**:
```ts
export type RateConvention = 'EA' | 'NOMINAL_MV' | 'MONTHLY'
export type AmortizationSystem = 'french' | 'german' | 'bullet'
export type GraceType = 'interestOnly' | 'total'
export type ExtraPaymentEffect = 'reduceTerm' | 'reducePayment'
export interface ExtraPayment { id: string; month: number; amount: number; effect: ExtraPaymentEffect }

export interface LoanParams {
  principal: number; rate: number; rateConvention: RateConvention; months: number
  system: AmortizationSystem; graceMonths: number; graceType: GraceType
  lifeInsuranceRate: number   // monthly, fraction of outstanding balance
  assetInsurance: number; adminFee: number   // flat monthly amounts
  disbursementDate: string   // ISO — labels rows with real dates only
  extraPayments: ExtraPayment[]
}
export interface LoanRow {
  month: number; year: number; monthOfYear: number; date: string
  openingBalance: number
  payment: number       // principal + interest, before insurance/charges
  interest: number; principalPaid: number; extraPayment: number
  lifeInsurance: number; fixedCharges: number   // = assetInsurance + adminFee
  insurance: number      // = lifeInsurance + fixedCharges — the "Seguros" column
  totalPayment: number   // payment + insurance + extraPayment — everything that actually left the account
  balance: number; isGrace: boolean
}
export interface LoanTotals {
  monthlyRate: number; firstPayment: number; lastPayment: number
  levelPayment: boolean   // true iff every instalment is identical (French, no extras)
  totalPaid: number; totalInterest: number; totalInsurance: number; totalExtra: number
  creditCost: number      // (totalInterest + totalInsurance) / principal
  months: number; lastDate: string
  savings: { interest: number; months: number } | null   // vs. the same loan minus extras; null if none
  crossoverMonth: number | null   // first month principalPaid > interest; null if never
}
export const MIN_LOAN_MONTHS = 6; export const MAX_LOAN_MONTHS = 360
export const DEFAULT_LOAN_PARAMS = {
  principal: 50_000_000, rate: 0.18, rateConvention: 'EA', months: 60, system: 'french',
  graceMonths: 0, graceType: 'interestOnly', lifeInsuranceRate: 0, assetInsurance: 0, adminFee: 0,
  extraPayments: [],
} // + disbursementDate: todayIso() added by createLoanParams()

/** Runs before anything else — every downstream formula assumes a plain monthly rate. */
export function toMonthlyRate(rate: number, convention: RateConvention): number {
  switch (convention) {
    case 'EA': return Math.pow(1 + rate, 1/12) - 1
    case 'NOMINAL_MV': return rate / 12
    case 'MONTHLY': return rate
  }
}
/** Level payment retiring `balance` over `months` at `monthlyRate`. Falls back to
 * straight-line at rate 0 (the annuity formula divides by zero there). */
export function levelPayment(balance: number, monthlyRate: number, months: number): number {
  if (months <= 0) return 0
  if (monthlyRate === 0) return balance / months
  return (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
}

export function amortize(params: LoanParams): LoanRow[] {
  // Grace period (months 1..graceMonths):
  //   interestOnly: balance unchanged, payment = interest = openingBalance × i
  //   total:        balance += interest (capitalised), payment = 0
  //   An extra payment can still land during grace, reducing the balance further.
  //
  // Amortizing months:
  //   interest[t] = openingBalance[t] × i
  //   french:  principalPaid[t] = payment - interest[t]         (payment = levelPayment(...), fixed
  //                                                               unless a reducePayment extra recomputes it)
  //   german:  principalPaid[t] = min(balance / remainingMonths, openingBalance[t])
  //   bullet:  principalPaid[t] = 0                              (except the final month: full balance)
  //   FINAL scheduled month: principalPaid = openingBalance      (absorbs rounding so balance lands on 0)
  //   insurance[t] = openingBalance[t] × lifeInsuranceRate + assetInsurance + adminFee
  //   totalPayment[t] = payment[t] + insurance[t] + extraPayment[t]
  //
  // Extra payment effect:
  //   reduceTerm:    balance drops early; the term simply ends sooner.
  //   reducePayment: balance drops, then payment = levelPayment(newBalance, i, monthsLeft) —
  //                  RECOMPUTED from the outstanding balance and remaining term, never patched —
  //                  this is what keeps the schedule internally consistent and the final
  //                  balance exactly zero.
}
export function summarizeLoan(rows: LoanRow[], params: LoanParams, baseline?: LoanRow[]): LoanTotals
```

**Reference check**: 50,000,000 at 18% E.A. over 60 months, French → **1,233,670/month**,
**24,020,205** total interest, checked against the closed form first and then the quoted anchors.

**Deviation from the brief, deliberate**: `cuotaTotal` is defined as `payment + insurance +
extraPayment`, not just `payment + insurance` — excluding a real cash outflow (the extra payment) would
understate what the loan actually cost that month. The schedule keeps `Abono extra` as its own column so
both readings stay visible.

## B.5 — Consolidación de Deudas (Debt Consolidation)

**Question answered**: is it worth consolidating several debts (cards, auto loans, other loans) into one
new loan? **Reuses `amortize()`/`levelPayment`/`toMonthlyRate` from B.4 directly** for the consolidated
loan — do not re-derive the payment formula.

**`src/lib/debtConsolidation.ts`**:
```ts
/** EVERY rate in this feature is Nominal M.V. — the opposite of Crédito's own default (EA). No
 * convention selector anywhere (matches the reference's own plain "interest rate" fields). */
export const DEBT_RATE_CONVENTION = 'NOMINAL_MV' as const

export interface CreditCardDebt {
  id: string; balance: number; rate: number   // Nominal M.V.
  useMinimumPayment: boolean
  minimumPct: number; minimumFloor: number     // used only when useMinimumPayment
  payment: number                              // used only when !useMinimumPayment
}
export interface InstallmentDebt { id: string; balance: number; rate: number; payment: number }
export interface OtherDebt extends InstallmentDebt { description: string }   // free-text, user's own label
export interface ConsolidatedLoan { balance: number; rate: number; months: number }
export interface DebtConsolidationParams {
  creditCards: CreditCardDebt[]; autoLoans: InstallmentDebt[]; otherLoans: OtherDebt[]
  consolidated: ConsolidatedLoan   // balance defaults to the LIVE SUM of every entered debt
}
export const MIN_CONSOLIDATED_MONTHS = 12; export const MAX_CONSOLIDATED_MONTHS = 360
export const CONSOLIDATED_TERM_OPTIONS = [12,24,36,48,60,72,84,96,108,120,180,240,300,360] as const
export const DEFAULT_MINIMUM_PCT = 0.04

/** Closed-form (inverse of the annuity payment formula): months for a FIXED `payment` to retire
 * `balance` at rate `i`. null if payment never exceeds the interest (never pays off). */
export function monthsToPayoff(balance: number, i: number, payment: number): number | null {
  if (balance <= 0) return 0
  if (payment <= balance * i) return null
  if (i === 0) return Math.ceil(balance / payment)
  return Math.ceil(-Math.log(1 - (i * balance) / payment) / Math.log(1 + i))
}
export function fixedPayoffInterest(balance: number, payment: number, months: number): number {
  return Math.max(0, payment * months - balance)
}

export interface DecliningPayoff { months: number | null; totalInterest: number }
/** The classic minimum-payment trap: payment is a PERCENTAGE OF THE CURRENT BALANCE, recomputed
 * every month — no closed form exists, simulated month by month. */
export function monthsToPayoffDeclining(balance: number, i: number, minPct: number, floor = 0): DecliningPayoff {
  // for each month: interest = remaining×i; payment = max(remaining×minPct, floor);
  // if payment <= interest → never pays off (null); else principal = payment-interest,
  // remaining -= principal, accumulate totalInterest; stop when remaining <= epsilon.
  // (Cap the simulation at ~1200 months to guarantee termination.)
}

export interface DebtRow {
  id: string; type: 'card' | 'auto' | 'other'
  categoryIndex: number   // 1-based position within its own category — lets the UI build a translated
                           // label ("Tarjeta de crédito #2") without the model knowing about language
  description: string     // only ever real text for "Otros"; card/auto leave it blank
  balance: number; rate: number; payment: number
  months: number | null; totalInterest: number | null
}
export function buildDebtRows(params: DebtConsolidationParams): DebtRow[]
// cards use monthsToPayoffDeclining if useMinimumPayment, else monthsToPayoff; auto/other always monthsToPayoff.
export const currentTotalPayment = (rows: DebtRow[]): number
/** MAX of every debt's own payoff month — the household is only debt-free once the SLOWEST debt
 * clears. null if any single debt never pays off. */
export const currentMonthsToPayoff = (rows: DebtRow[]): number | null
export const currentTotalInterest = (rows: DebtRow[]): number | null

export function buildConsolidatedLoanParams(consolidated: ConsolidatedLoan): LoanParams  // → amortize()
export function consolidatedLoanRows(consolidated: ConsolidatedLoan): LoanRow[]   // = amortize(buildConsolidatedLoanParams(...))
export const consolidatedPayment = (rows: LoanRow[]): number
export const consolidatedTotalInterest = (rows: LoanRow[]): number
```

**Reference check**: $5,000 at 11% over 120 months → **$68.88/month** — only comes out of `amortize()`
under **Nominal M.V.**, not EA, which is why this feature reads every rate that way.

**Deviation, checked not assumed**: the 4%/no-floor minimum-payment default does **not** reproduce the
reference's own **138-month** figure for a $5,000 balance at 18.9%. A pure percentage-of-balance payment
decays geometrically and technically never finishes; with no floor it takes ~560 months at that rate.
A Nominal M.V. rate with a **$15 floor** reproduces 138 months almost exactly, and that combination is
what the reference-check test actually passes as input — the shipped **default** stays `floor = 0` to
match the spec this was built against, so a fresh install's numbers will not match the reference
screenshot out of the box for a minimum-payment card unless a floor is entered. Document this exactly
this way; do not quietly change the default to $15 to "fix" the mismatch — that would contradict the
spec it was built against.

## B.6 — Tarjeta de Crédito (Credit Card), including multi-card

**Question answered**: how does a revolving card balance evolve under a chosen payment strategy —
including deferred purchases and recurring charges, and what happens if you only ever pay the minimum?

**`src/lib/creditCard.ts`** — build this once as a single-card model first (as below), matching every
other feature's shape; the **multi-card wrapper** (`CardProfile`) is layered on top afterward, unchanged
underneath.

```ts
export type PaymentStrategy = 'full' | 'minimum' | 'fixed' | 'percentage'

export interface DeferredPurchase {
  id: string; description: string; amount: number
  purchaseMonth: number   // 1-based month of the horizon
  installments: number
  interestFree: boolean   // no finance charge: split evenly
}
export interface RecurringExpense {
  id: string; description: string; monthlyAmount: number
  startMonth: number; endMonth: number   // inclusive
  defer: boolean   // true: each month's charge spawns its own installment plan instead of hitting the revolving balance
}
export interface CreditCardParams {
  creditLimit: number; openingBalance: number   // revolving balance carried in before month 1
  rate: number; rateConvention: RateConvention
  usuryRate: number      // effective-annual legal cap — DISPLAY CHECK ONLY, never changes the projection
  monthlyFee: number; feeIncludesVat: boolean
  cutoffDay: number      // 1–28; due date = cutoff + 15 days
  months: number         // 6–120
  strategy: PaymentStrategy
  minimumRate: number; minimumFloor: number      // for 'minimum'
  fixedPayment: number                           // for 'fixed'
  percentagePayment: number                      // for 'percentage'
  defaultInstallments: number   // used when a deferred RECURRING charge spawns a plan
  deferredPurchases: DeferredPurchase[]; recurringExpenses: RecurringExpense[]
  startDate: string   // ISO, labels rows only
}
export const MIN_CARD_MONTHS = 6; export const MAX_CARD_MONTHS = 120
export const VAT_RATE = 0.19; export const DUE_DATE_OFFSET_DAYS = 15

/** Per-instalment payment for a purchase (installmentFree/i=0: split evenly; else the standard annuity
 * payment so the principal components sum exactly back to the purchase amount). */
export function installmentPlan(amount: number, installments: number, monthlyRate: number, interestFree: boolean): number[]

export interface InstallmentCharge {
  planId: string; description: string; installment: number; installments: number
  amount: number; principal: number; interest: number; remainingPrincipal: number
}
export interface CardMonth {
  month: number; year: number; monthOfYear: number; cutoffDate: string; dueDate: string
  openingRevolving: number; interest: number
  revolvingPurchases: number   // non-deferred recurring charges landing this month
  fee: number
  installmentCharges: number; charges: InstallmentCharge[]
  payment: number; revolvingBalance: number
  totalBalance: number    // revolvingBalance + pendingInstallmentPrincipal
  pendingInstallmentPrincipal: number
  utilization: number    // totalBalance / creditLimit
}
export interface StrategyOutcome { strategy: PaymentStrategy; totalPaid: number; totalInterest: number; monthsToZero: number | null }
export interface CardTotals {
  monthlyRate: number; months: number; nextPayment: number; nextDueDate: string
  totalPaid: number; totalInterest: number; totalFees: number
  monthsToZero: number | null    // NEVER the horizon — null when the strategy never clears the balance
  finalUtilization: number; peakUtilization: number
  overLimitMonth: number | null
  exceedsUsury: boolean   // rateConvention === 'EA' && rate > usuryRate — display only
}

/** Interest accrues on the PRIOR revolving balance before that month's payment lands — the
 * conservative reading, and how issuers actually post it. */
export function simulateCard(params: CreditCardParams): CardMonth[] {
  // Per month t:
  //   interest[t] = openingRevolving[t] × i
  //   statementBalance[t] = openingRevolving[t] + interest[t] + revolvingPurchases[t] + fee
  //   installmentsDue[t] = sum of every active plan's payment this month
  //   payment[t] = resolvePayment(strategy, statementBalance, installmentsDue, interest, fee):
  //     full:        statementBalance + installmentsDue
  //     fixed:       min(fixedPayment, total)
  //     percentage:  min(max(total × percentagePayment, 0), total)
  //     minimum:     due = max(statementBalance×minimumRate + interest + fee, installmentsDue, minimumFloor);
  //                  min(due, total)
  //   revolvingBalance[t] = max(0, statementBalance[t] + installmentsDue[t] - payment[t])
  //   totalBalance[t] = revolvingBalance[t] + pendingInstallmentPrincipal[t]
  //   utilization[t] = totalBalance[t] / creditLimit
}
/** null — never the horizon — when the payment never covers interest + fee: the balance never falls. */
export function monthsToZero(rows: CardMonth[]): number | null
/** Runs the same purchases under minimum/fixed/full, for the comparison strip and chart. */
export function compareStrategies(params: CreditCardParams): Record<'minimum'|'fixed'|'full', StrategyOutcome>
export function summarizeCard(rows: CardMonth[], params: CreditCardParams): CardTotals
```

**Reference check**: 3,000,000 over 12 cuotas at 25% E.A. → **281,539/instalment**, **3,378,470** total,
checked against the closed form before the reference anchors.

**Trap detection is a first-class output, not an afterthought**: when the payment never covers interest
plus the fee, `monthsToZero` is `null` and the UI states this in red rather than showing a number that
looks like a real answer.

### Multi-card extension (build this as the credit-card feature's own second phase)

```ts
export type CardFranchise = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners'
export const CARD_FRANCHISES: readonly CardFranchise[] = ['visa','mastercard','amex','discover','diners']

export interface CardProfile {
  id: string; name: string; franchise: CardFranchise
  params: CreditCardParams   // this card's OWN, fully independent parameter set
}
export function createCardProfile(name: string, franchise: CardFranchise = 'visa'): CardProfile {
  return { id: nextId('card'), name, franchise, params: createCardParams() }
}
```
Add `MAX_CREDIT_CARDS = 8` to `limits.ts` (already listed in A.5).

**`useCreditCard()` becomes**: owns `{ cards: CardProfile[]; activeId: string }` (a single lazy
`useState` initializer, seeding one card named `'Tarjeta 1'` — a plain literal string, same convention
as the pre-existing seed purchase descriptions `'Portátil'`/`'Vuelo'`, i.e. sample/seed data is treated
as real user-like content, not translated UI chrome). Exposes, **in addition to** the standard
`params`/`update`/`reset`/`rows`/`totals`/`warnings` (now scoped to whichever card is active):
```ts
cards: CardProfile[]
activeCardId: string
selectCard: (id: string) => void
addCard: (name: string) => void        // name comes from the COMPONENT, so the hook stays language-agnostic
removeCard: (id: string) => void       // no-ops if only one card remains
renameCard: (id: string, name: string) => void
setFranchise: (id: string, franchise: CardFranchise) => void
```
**`addCard`'s name comes from the caller** (the component calls
`card.addCard(t.card.defaultCardName(card.cards.length + 1))`), exactly mirroring how
`debtConsolidation`'s `addOther(description)` already works — this is what keeps the hook itself never
calling `useT()`.

`CardSwitcher.tsx` (new component, rendered above `CardParametersPanel`): a `role="radiogroup"` row of
selectable pills — the same accessible single-select pattern the top bar's language toggle already uses,
not a new ARIA-tabs implementation — each pill showing the card's name with a delete `×` sibling
(**never nested inside** the radio button itself — invalid HTML and bad a11y), hidden while only one
card remains; a "+ Agregar tarjeta" button (disabled with an explanatory `title` at the 8-card cap); and,
for the active card, two `ParamField`s: **Nombre de la tarjeta** (`TextInput`) and **Franquicia**
(`Select`, 5 options).

Every other component in the feature (`CardParametersPanel`, `PurchasesPanel`, `CardSummary`,
`CardCharts`, `CardSchedule`) needs **zero changes** to become multi-card-aware — they only ever read
"the active card's" `params`/`rows`/`totals`, exactly as before.

CSV/PDF: lead with the active card's name and franchise as the first two rows; the CSV filename is
slugified from the card's own name so exporting two different cards never overwrites the same file.

## B.7 — Mi Presupuesto (Budget), including extensible categories

**Question answered**: once every income and expense is normalized to a monthly figure, how much is
actually left over to save? Unlike every other feature, this is almost entirely **unit conversion and
summation**, not compounding math.

**`src/lib/budget.ts`**:
```ts
export type PayFrequency = 'weekly' | 'biweekly' | 'semiMonthly' | 'monthly' | 'quarterly' | 'annual'
export const FREQUENCY_MULTIPLIER: Record<PayFrequency, number> = {
  weekly: 52/12, biweekly: 26/12, semiMonthly: 24/12, monthly: 1, quarterly: 4/12, annual: 1/12,
}
export const PAY_FREQUENCIES: PayFrequency[] = ['weekly','biweekly','semiMonthly','monthly','quarterly','annual']
export function toMonthly(amount: number, frequency: PayFrequency): number { return amount * FREQUENCY_MULTIPLIER[frequency] }

export interface EarnerIncome {
  grossAmount: number; frequency: PayFrequency
  federalWithholding: number; stateWithholding: number; localWithholding: number; otherTaxes: number
  fica: number; medicare: number; insuranceBenefits: number; retirementSavings: number
  otherIncome: number; otherIncomeFrequency: PayFrequency   // its OWN frequency — a bonus doesn't share the salary's cadence
}
export interface EarnerMonthly {
  grossMonthly: number
  federalWithholding: number; stateWithholding: number; localWithholding: number; otherTaxes: number
  fica: number; medicare: number; insuranceBenefits: number; retirementSavings: number
  totalDeductions: number; otherIncomeMonthly: number
  netMonthly: number   // = grossMonthly - totalDeductions + otherIncomeMonthly
}
export function evaluateEarner(earner: EarnerIncome): EarnerMonthly

/** One free-text row in an expense category's repeatable "Agregar partida" list — the SAME generic
 * shape used by every extensible category, up to MAX_BUDGET_OTHER_CATEGORIES (15) each. */
export interface CategoryItem { id: string; description: string; amount: number }

export interface MortgageDebt { housePayment: number; autoPayment: number; autoPayment2: number; creditCardPayments: number; otherDebtPayments: number; other: CategoryItem[] }
export interface Utilities { electric: number; gas: number; water: number; cable: number; phone: number; internet: number; other: CategoryItem[] }
export interface FoodExpenses { groceries: number; gasAndMaintenance: number; generalMerchandise: number; charitableDonations: number; religiousDonations: number; other: CategoryItem[] }
export interface InsuranceExpenses { autoInsurance: number; lifeInsurance: number; healthInsurance: number; homeInsurance: number; other: CategoryItem[] }
export interface MaintenanceExpenses { homeMaintenance: number; medical: number; childcare: number; clothing: number; entertainment: number; other: CategoryItem[] }
// Each has its own createX() factory returning all-zero fields + other: [].

export interface BudgetParams {
  primary: EarnerIncome; spouse: EarnerIncome
  mortgageDebt: MortgageDebt; utilities: Utilities; food: FoodExpenses; insurance: InsuranceExpenses; maintenance: MaintenanceExpenses
}

const otherItemsTotal = (items: CategoryItem[]): number => items.reduce((s, i) => s + i.amount, 0)
export const mortgageDebtTotal = (m: MortgageDebt): number => m.housePayment + m.autoPayment + m.autoPayment2 + m.creditCardPayments + m.otherDebtPayments + otherItemsTotal(m.other)
// ...utilitiesTotal / foodTotal / insuranceTotal / maintenanceTotal follow the identical pattern:
// sum of fixed fields + otherItemsTotal(category.other).

export interface CategoryTotals { mortgageDebt: number; utilities: number; food: number; insurance: number; maintenance: number }
export interface BudgetResult {
  primary: EarnerMonthly; spouse: EarnerMonthly
  totalNetIncome: number       // = primary.netMonthly + spouse.netMonthly — INCLUDES each earner's otherIncome
  categoryTotals: CategoryTotals; totalExpenses: number
  availableToSave: number      // totalNetIncome - totalExpenses — NEVER clamped, can be negative
}
export function evaluateBudget(params: BudgetParams): BudgetResult

export function safeShare(part: number, total: number): number { return total <= 0 ? 0 : part / total }
export interface ChartSlice { key: string; value: number }
/** One wedge per expense category + a final "available to save" wedge, FLOORED AT 0 for the chart
 * only when negative — the real signed figure still drives the headline sentence and the summary
 * card; this floor is display-only. */
export function buildExpenseChartSlices(result: BudgetResult): ChartSlice[]
/** One wedge per deduction type (FICA+Medicare combined into "ficaAndHealth") + a final "net income"
 * wedge based on COMBINED GROSS income from both earners. This wedge is a DELIBERATELY DIFFERENT
 * number from BudgetResult.totalNetIncome: it decomposes gross salary alone, so it EXCLUDES each
 * earner's otherIncome (a bonus was never part of the gross being sliced up). Two real,
 * differently-scoped quantities, not a rounding mismatch. */
export function buildIncomeChartSlices(result: BudgetResult): ChartSlice[]

export interface BudgetRow { section: string; field: string; monthlyAmount: number }
/** One row per NON-ZERO populated field, across both earners and all five categories — the
 * plain-language audit table / CSV. */
export function buildBudgetRows(params: BudgetParams, result: BudgetResult): BudgetRow[]
```

**No numeric reference figure** — the source screenshot's own numbers are effectively all-zero except
one stray $1 in Maintenance; reproduce that exactly (`totalExpenses === 1`, `totalNetIncome === 0`,
`availableToSave === -1`) as the test suite's reference check. This feature's correctness rests on the
frequency-conversion math and summation being right, not on matching a dollar figure.

**Extensible categories, exact behavior**: every one of the five expense categories gets the same
repeatable "Agregar partida" row (`{ etiqueta, monto }`), via a shared `OtherCategoryItems` component and
generic `addCategoryItem`/`updateCategoryItem`/`removeCategoryItem(category, ...)` hook functions. Each
row fully participates: summed into its category's subtotal, `totalExpenses`, and
`disponibleParaAhorrar`; grouped under its **parent category's** wedge in the expense donut (never a
separate slice); listed individually in the detail table and CSV; removing a row drops it from every
total immediately. Income's own "Otro ingreso" is a single field — **explicitly out of scope** for this
extensibility.

**Two different "net income" figures, on purpose** (repeated here because it is the single easiest thing
to "fix" incorrectly during a refactor): `totalNetIncome` (headline/summary card) includes
`otherIncome`; the income donut's own "net" wedge excludes it. Never make these the same number.

---

# PART C — CROSS-CUTTING FEATURES (build in this exact order)

## C.1 — Prompt 1: Global Infrastructure & Mock Authentication

**Goal**: a persistent top bar (language/currency/theme stubs — wired for real in C.2/C.3 — plus a real,
fully-built mock sign-in) visible on every screen, optional by default.

### `src/features/auth/auth.ts`
```ts
export interface AuthUser { uid: string; name: string; email: string; avatarUrl: string | null }
export interface AuthContextValue { user: AuthUser | null; login: (email: string, password: string) => boolean; logout: () => void }
export const AuthContext = createContext<AuthContextValue | null>(null)
export function useAuth(): AuthContextValue { /* throws outside provider */ }
```
Kept to exactly this shape — `{ uid, name, email, avatarUrl } | null` plus `login`/`logout` —
deliberately provider-agnostic, so a real identity provider later means rewriting `auth.ts` and
`AuthProvider.tsx` alone; every consumer only ever touches this shape.

### `src/features/auth/AuthProvider.tsx`
```ts
/** Two hardcoded demo accounts — NOT real credentials, so hardcoding them in client source is
 * expected here, the ONE deliberate exception to "never store a password" every other form in
 * this app follows. Kept to exactly this one comparison line: never logged, never repeated
 * anywhere else in this file or its comments. */
const MOCK_ACCOUNTS = [
  { email: 'diego@realcapital.pro', password: 'Password1!', name: 'Diego' },
  { email: 'andres@realcapital.pro', password: 'Password1!', name: 'Andres' },
]
```
`login(email, password)`: case-insensitive/trimmed email match + exact password match against
`MOCK_ACCOUNTS`; on match, `setUser({ uid: email, name, email, avatarUrl: null })`, returns `true`; else
returns `false`, no state change. `logout()`: `setUser(null)`.
(**Session persistence via `sessionStorage` is added later, in Part C.8 — build this first WITHOUT
persistence, exactly matching Prompt 1's original scope: "None, by design — signing in is in-memory
`useState`, so a reload signs back out."** C.8 revisits and supersedes this specific behavior.)

### `src/features/auth/LoginForm.tsx`
The **one** implementation of the credential check's UI — shared later (unchanged) by the optional
`/login` page and, in Part C.8, the access gate's overlay. Deliberately renders **no** escape-hatch link
itself — that's specific to the page wrapping it.
```tsx
interface LoginFormProps { onSuccess: () => void }
export function LoginForm({ onSuccess }: LoginFormProps) {
  // email/password TextInputs inside ParamFields, autofocus email on mount,
  // on submit: login(email, password) ? onSuccess() : show t.auth.loginError via role="alert",
  // refocus email so a screen reader announces the failure immediately.
}
```

### `src/features/auth/LoginScreen.tsx`
```tsx
export function LoginScreen({ onReturn }: { onReturn: () => void }) {
  // h1 = t.auth.loginTitle, p = t.auth.loginSubtitle, then <LoginForm onSuccess={onReturn} />,
  // then a Button variant="outlined" onClick={onReturn}>{t.auth.backToApp}</Button> — the
  // "Volver a la app sin iniciar sesión" escape hatch, EQUALLY PROMINENT as the submit button.
}
```
Reached at `#/login` (a **hash-routed** screen added to `ROUTE_IDS`, not a real path — this SPA has no
server to add a rewrite rule for `/login` on refresh, and the tab navigation is already hash-based).
On no match: **exactly one generic inline error** — never indicating which field was wrong. Either path
(success or the escape hatch) returns to **whichever tab was active before the button was clicked**
(`Shell`'s `lastRealTab`).

### `src/features/auth/AccountControl.tsx`
Signed out: a single "Iniciar sesión" button in the top bar. Signed in: becomes an avatar
(initial-letter circle, no real photo for a mock account) + name, opening a dropdown menu
(`role="menu"`, closes on outside click/Escape, returns focus to the trigger) showing **Nombre**,
**Correo**, and **Cerrar sesión**.

### Wire into `App.tsx`
Add `AuthProvider` around `Shell`; add `'login'` to `ROUTE_IDS` (not `TAB_IDS`); render `<LoginScreen
onReturn={() => setActive(lastRealTab)} />` when `active === 'login'`; the top bar's account control
calls `onRequestSignIn={() => setActive('login')}`.

## C.2 — Prompt 2: Internationalization (ES/EN) & Tooltips

**Goal**: retrofit every string in every feature built so far into the `es.ts`/`en.ts` dictionaries (if
Part A/B were followed correctly, there should be **nothing** to retrofit — this prompt is really "prove
it" by adding the enforcement). Add an accessible `(?)` popover to **every** input field across every
feature. Add the no-hardcoded-strings guard test (full implementation given in A.7 — write it now).

**Number formatting follows language, not currency** — this is the point at which `LocaleProvider`'s
`locale` becomes explicitly derived from `LANGUAGE_LOCALES[language]` (A.8) rather than from whatever
currency field a feature might still have (see C.3 — at this point some features may still have their
own per-feature currency/locale field; that gets removed in C.3, not here).

Every field gets **one** dictionary entry serving two lengths: `xHelp` (short, the popover) and
`xHelpLong` (a full paragraph — unused until Part C.6, but write it now so there is never a second copy
to keep in sync).

Add the guard test to `vite.config.ts`'s `test.include`. Verify: `npm test` fails if you deliberately add
a literal string to a `.tsx` file, then remove it and confirm it passes.

## C.3 — Prompt 3: Multi-Currency (USD, EUR, GBP, KYD, COP)

**Goal**: one global currency selector, replacing any per-feature "Moneda / locale" field.

```ts
// src/lib/format.ts
export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'KYD', 'COP'] as const
export type CurrencyCode = (typeof CURRENCY_CODES)[number]
```
Table (format locale is **not** user-facing — only used internally if ever needed; the UI's own number
formatting always follows the **language**, per C.2):

| Code | Currency | (historical) format locale |
| --- | --- | --- |
| USD | Dólar | en-US |
| EUR | Euro | de-DE |
| GBP | Libra | en-GB |
| KYD | Dólar Caimán | en-US |
| COP | Pesos | es-CO |

**`[assumption — confirm]`**: "Pesos" is ambiguous across Spanish-speaking countries (COP/MXN/ARS/CLP/
DOP). Default to **COP** (Colombian peso) — flag this explicitly to whoever is directing the build and
invite a one-line correction if a different peso was actually meant.

Build `CurrencySelector` in `App.tsx`'s top bar: a native `<select>` styled via `inputClass`-adjacent
pill classes, with **every `<option>` carrying explicit `className="bg-surface-container
text-on-surface"`** (A.4's dark-mode-dropdown fix — apply it from the start here, don't wait for a bug
report). Wire `useLocale().setCurrency`. **Remove** any per-feature currency field entirely — search
every `*ParametersPanel.tsx` for one and delete it, including now-unused imports.

Every currency-formatted value across all seven features, every chart tooltip/axis label, and every CSV
export must re-render live on a currency change — this falls out for free if every formatting call goes
through `useLocale()` rather than a locally-held currency prop, which it must by this point.

## C.4 — Prompt 4: Presupuesto — Extensible Categories

**Goal**: extend every expense category (not just Maintenance, if an earlier draft only had it there)
with the repeatable "Agregar partida" row. Fully specified already in B.7 — if Part B was built
following this spec, this prompt has nothing left to do; treat it as the verification pass: confirm
`other: CategoryItem[]` exists on all five category interfaces, confirm `OtherCategoryItems` is rendered
under all five, confirm removal drops a row's amount from every total immediately (write/run a test that
adds then removes an item and asserts the totals return to their pre-add values).

## C.5 — Prompt 5: Ver Reporte / PDF Export (build the FINAL version directly — see C.9's note)

**Goal**: a real "Ver reporte" button on all seven features, opening a shared on-screen report with a
"Descargar PDF" export, built **once** and reused, not duplicated per feature.

> **Build note**: an earlier version of this project built a naive single-canvas PDF capture here and
> only fixed it later, in a separate prompt (C.9), after finding two real bugs (chart-splitting across
> PDF pages, and layout overlap in the on-screen modal). **Since you have this whole spec in front of
> you, build the corrected version directly in this prompt** — Part C.9 explains *why* each piece is
> shaped the way it is, in case you want the full reasoning, but do not implement the broken
> intermediate version as a "first pass."

### `src/lib/report.ts` — final version

```ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'   // NOT plain html2canvas — see A.1

const PAGE_MARGIN_PT = 24
const BLOCK_GAP_PT = 12
const BLOCK_ATTR = 'data-pdf-block'

/**
 * Walks the capture root's direct children, one DOM element per report
 * section. A child containing further [data-pdf-block] descendants (the
 * charts grid, deliberately left unmarked itself) defers to those
 * descendants instead of being captured as one block — every feature's
 * chart Card already carries the marker (see A.4/B.0), so this gives every
 * individual chart its own page-break-safe boundary with NO per-feature
 * changes. A child with no markers anywhere inside it (a plain summary-card
 * grid, no <Card> wrapper) is captured whole — correct, since a row of
 * summary cards is always small enough to fit together.
 */
export function collectBlocks(root: HTMLElement): HTMLElement[] {
  const blocks: HTMLElement[] = []
  for (const child of Array.from(root.children)) {
    if (!(child instanceof HTMLElement)) continue
    const nested = child.querySelectorAll<HTMLElement>(`[${BLOCK_ATTR}]`)
    if (nested.length > 0) blocks.push(...Array.from(nested))
    else blocks.push(child)
  }
  return blocks
}

export interface PdfPlacement { blockIndex: number; page: number; y: number; sourceOffset: number; sliceHeight: number }

/**
 * Pure pagination planner — no DOM/canvas/jsPDF, unit-tested directly on
 * plain numbers. Charts and summary/parameter groups are NEVER split: a
 * block is placed whole on the current page if it fits, or whole on a fresh
 * page otherwise — check and placement happen together so nothing is cut
 * between them. The ONE exception: a block taller than a full page (an
 * unexpectedly long table) always starts fresh and slices across as many
 * following pages as needed.
 */
export function planPdfLayout(blockHeights: number[], pageHeight: number, gap: number = BLOCK_GAP_PT): PdfPlacement[] {
  const placements: PdfPlacement[] = []
  let page = 0, cursorY = 0
  blockHeights.forEach((height, blockIndex) => {
    if (height <= pageHeight) {
      if (cursorY > 0 && cursorY + height > pageHeight) { page += 1; cursorY = 0 }
      placements.push({ blockIndex, page, y: cursorY, sourceOffset: 0, sliceHeight: height })
      cursorY += height + gap
      return
    }
    if (cursorY > 0) { page += 1; cursorY = 0 }
    let remaining = height, sourceOffset = 0, lastSliceHeight = 0
    while (remaining > 0) {
      const sliceHeight = Math.min(remaining, pageHeight)
      placements.push({ blockIndex, page, y: 0, sourceOffset, sliceHeight })
      remaining -= sliceHeight; sourceOffset += sliceHeight; lastSliceHeight = sliceHeight
      if (remaining > 0) page += 1
    }
    cursorY = lastSliceHeight + gap
  })
  return placements
}

export async function generatePdf(element: HTMLElement, filename: string): Promise<void> {
  const blocks = collectBlocks(element)
  const captureTargets = blocks.length > 0 ? blocks : [element]
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth() - PAGE_MARGIN_PT * 2
  const pageHeight = pdf.internal.pageSize.getHeight() - PAGE_MARGIN_PT * 2

  const captures = await Promise.all(captureTargets.map(async (block) => {
    const canvas = await html2canvas(block, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    return { imgData: canvas.toDataURL('image/png'), height: (canvas.height * pageWidth) / canvas.width }
  }))

  const placements = planPdfLayout(captures.map((c) => c.height), pageHeight, BLOCK_GAP_PT)
  let currentPage = 0
  for (const placement of placements) {
    if (placement.page > currentPage) { pdf.addPage(); currentPage = placement.page }
    const capture = captures[placement.blockIndex]
    if (!capture || capture.height <= 0) continue
    // A spanning block's later slices place the SAME full image at a negative offset so only
    // the current slice falls within the page — same technique the old whole-report version used.
    const y = PAGE_MARGIN_PT + placement.y - placement.sourceOffset
    pdf.addImage(capture.imgData, 'PNG', PAGE_MARGIN_PT, y, pageWidth, capture.height)
  }
  pdf.save(filename)
}

export interface ReportParameter { label: string; value: string }
export interface ReportTableData { columns: string[]; rows: (string | number)[][] }
export const REPORT_PDF_ROW_CAP = 30
```

### `src/components/report/ReportTable.tsx`
Not the feature's real schedule component (`CollapsibleYearTable` is built for on-screen virtualized
interaction, not being snapshotted whole). A plain `<table>` fed the same row/column data as the
feature's own CSV export. `mode="full"` (on-screen) renders every row; `mode="capped"` (switched to only
for the instant `generatePdf` captures, then switched back) renders the first `REPORT_PDF_ROW_CAP` (30)
rows plus a caption pointing at the CSV for the rest.

### `src/components/report/ReportView.tsx`

```tsx
interface ReportViewProps {
  open: boolean; onClose: () => void
  featureTitle: string; parameters: ReportParameter[]
  summary: ReactNode; charts: ReactNode   // the feature's own already-built components, reused verbatim
  table: ReportTableData
}
```
Modal: `role="dialog" aria-modal="true" aria-labelledby={titleId}`, focus moves to the close button on
open and returns to whatever triggered it on close, Escape closes it. Dialog width: **`max-w-7xl`**,
matching `App.tsx`'s own `<main>` column — **not** a narrower, arbitrary width (see the rationale in
C.9; build it this way from the start rather than narrower-then-widened). Its own scrollable region:
`max-h-[75vh] overflow-y-auto`. Capture root: `flex flex-col gap-6` (explicit gaps between every
section — not relying on a parent's ambient spacing).

Structure of the capture root, **with `data-pdf-block` markers exactly here**:
```tsx
<div ref={captureRef} className="flex flex-col gap-6 bg-surface p-2">
  <div data-pdf-block="true">{/* app title, featureTitle, generatedOn timestamp */}</div>
  {parameters.length > 0 && <div data-pdf-block="true">{/* <dl> of every ReportParameter */}</div>}
  {/* Both wrappers below are deliberately UNMARKED: summary has no <Card> in any feature, so
      collectBlocks naturally captures it whole; charts DOES have one <Card> per chart, and Card
      itself carries the marker — leaving this wrapper unmarked is what lets collectBlocks
      descend into those and give each chart its own block. */}
  <div>{summary}</div>
  <div>{charts}</div>
  <div data-pdf-block="true">{/* <h3>{t.common.schedule}</h3><ReportTable data={table} mode={tableMode} /> */}</div>
</div>
```
`handleDownload`: set `tableMode` to `'capped'`, wait two `requestAnimationFrame`s (so the capped table
actually paints before capture), call `generatePdf(captureRef.current, filename)`, then set `tableMode`
back to `'full'` in a `finally`. Filename: `${featureTitle.toLowerCase().replace(/\s+/g,'-')}-reporte.pdf`.

The generation timestamp **must** use the active `dateLocale` from `useI18n()` — `new
Intl.DateTimeFormat(dateLocale, {...})` — never `undefined`, or the date silently renders in the wrong
language even when the rest of the report correctly follows the UI language.

## C.6 — Prompt 6: Ayuda (Help Section)

**Goal**: a searchable reference page reusing every field's `helpLong` text verbatim, reached from a `?`
icon in the top bar — **not** a tab in the main strip.

### `src/features/help/helpIndex.ts`
A registry, one entry per feature, listing **which fields exist** (not their prose):
```ts
interface FieldKey { key: string; namespace?: Namespace }   // namespace override for a field that
                                                              // reuses another feature's own key
                                                              // (Tarjeta reuses Crédito's "Tasa de interés")
export interface HelpField { id: string; label: string; helpLong: string }
export interface HelpFeatureGroup { id: string; title: string; fields: HelpField[] }

function toField(dict: Dictionary, featureNamespace: Namespace, spec: FieldKey): HelpField {
  const namespace = spec.namespace ?? featureNamespace
  const label = str(dict, namespace, spec.key)
  const helpLong = str(dict, namespace, `${spec.key}HelpLong`) || str(dict, namespace, `${spec.key}Help`)
  return { id: `${featureNamespace}.${spec.key}`, label, helpLong }
}
export function buildHelpIndex(t: Dictionary): HelpFeatureGroup[]
// one group per feature (7 total), fields mapped via each feature's own list of FieldKeys.
```
List every field of every feature here, including (once built) Tarjeta de Crédito's `cardName` and
`franchise` (from B.6's multi-card extension).

### `src/features/help/HelpFeature.tsx`
Two-pane layout: left index (grouped by feature, each expandable — plain `<button aria-expanded>`, not a
div driven by hand-rolled state logic beyond the boolean itself), a search `<input>` that filters by
label match and auto-expands any group with a match, a skip-to-content link; right content pane shows
the selected field's `helpLong` **verbatim** — no second copy of this prose anywhere.

**Two real bugs to get right the first time** (found live in a prior build of this exact feature — avoid
repeating them):
1. **Selected-field state must store an *id*, not the field object itself.** If `selected` holds
   `{ groupId, field: HelpField }` (the actual object, captured at selection time), switching the UI
   language leaves the content pane showing **stale text in the old language** — the dictionary changed
   but the captured object didn't. Store `{ groupId, fieldId }` and **derive** the current
   label/`helpLong` fresh from `buildHelpIndex(t)` (a `useMemo` keyed on `t`) on every render.
2. **The skip-to-content link cannot be a plain `<a href="#help-main-content">`.** This app's own tab
   navigation is hash-routed (`useHashTab`, A.6). Letting the browser actually follow that fragment href
   sets `location.hash` to `#help-main-content`, which `useHashTab` reads as an unrecognized route and
   normalizes back to the default tab — **silently kicking a keyboard user out of Ayuda entirely**
   instead of just moving focus. Fix: the skip link (and every field link) must `event.preventDefault()`
   and move focus **programmatically** via a `ref` on the content pane (`contentRef.current?.focus()`),
   never relying on the browser's native fragment-navigation behavior. Give the content pane
   `tabIndex={-1}` and a visible `focus-visible` outline (don't just remove the default outline without
   replacing it).

Wire `'ayuda'` into `ROUTE_IDS` (not `TAB_IDS`); add the `?` icon button to the top bar
(`onClick={() => setActive('ayuda')}`); it returns to `lastRealTab`, exactly like `/login`.

## C.7 — Multi-Card Credit Cards: Franchise & Personalized Name

Fully specified in **B.6**'s "Multi-card extension" subsection — if the calculators in Part B were built
with this extension included from the start, there is nothing left to do here. If Tarjeta de Crédito was
built as a single-card feature first, apply B.6's extension now, in this exact order:
1. Add `CardFranchise`/`CardProfile`/`createCardProfile` to `lib/creditCard.ts`; add `MAX_CREDIT_CARDS`
   to `limits.ts`.
2. Rewrite `useCreditCard()` to own the `{ cards, activeId }` list (see B.6 for the exact state-update
   functions).
3. Build `CardSwitcher.tsx`.
4. Verify **zero changes** were needed to `CardParametersPanel`, `PurchasesPanel`, `CardSummary`,
   `CardCharts`, `CardSchedule` — if any of them needed a change, something about the hook's returned
   shape drifted from B.0's contract; fix the hook, not the components.
5. Update the CSV export and `ReportView`'s `parameters` array in `CreditCardFeature.tsx` to lead with
   the active card's name and franchise.

## C.8 — Access Gate (`VITE_REQUIRE_LOGIN`) & three.js Background

**Goal**: a full-screen access gate in front of the entire app, controlled by a build-time env flag,
built directly on top of C.1's mock auth (same two accounts, same credential check) — nothing new to add
to the auth mechanism itself except session persistence.

### Environment flag
```
.env       → VITE_REQUIRE_LOGIN=true    (committed default — the gate is ON unless overridden)
.env.test  → VITE_REQUIRE_LOGIN=false   (keeps the whole existing test suite working unmodified)
```
Read **once**, at module scope, as a literal: `const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN
=== 'true'` — this is intentional (Vite inlines `VITE_`-prefixed vars at build time; the point of the
flag is that it's frozen per-build, not re-checked per-render). In Vercel, set the same variable under
**Project Settings → Environment Variables**, scoped per environment (Production/Preview) — a
platform-level value overrides `.env` at build time, so opening the app up publicly later is a redeploy
with one changed setting, not a code change.

### Session persistence (upgrade `AuthProvider` from C.1)
```ts
const SESSION_STORAGE_KEY = 'fs.auth.session'   // sessionStorage, NOT localStorage — clears when the
                                                  // tab closes, but survives a reload mid-session, which
                                                  // matters once the gate can block a reload entirely.

function readStoredEmail(): string | null { /* try/catch around sessionStorage.getItem + JSON.parse */ }
function restoreUser(): AuthUser | null {
  const email = readStoredEmail()
  const match = email && MOCK_ACCOUNTS.find((a) => a.email === email)
  return match ? { uid: match.email, name: match.name, email: match.email, avatarUrl: null } : null
}
// useState<AuthUser | null>(restoreUser)   ← lazy initializer, restores on mount
// login(): on success, ALSO sessionStorage.setItem(KEY, JSON.stringify({ email }))
// logout(): ALSO sessionStorage.removeItem(KEY)
```
Only the **email** is ever stored — never the password — and the full user is re-derived from
`MOCK_ACCOUNTS` on restore, exactly as `login()` derives it the first time. Wrap every `sessionStorage`
call in try/catch (private-browsing storage can throw); degrade to "the session just doesn't survive a
reload" rather than crashing.

### `src/features/auth/AccessGate.tsx`
```tsx
const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN === 'true'

export function AccessGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const t = useT()
  if (!REQUIRE_LOGIN || user) return <>{children}</>

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="access-gate-title" aria-describedby="access-gate-subtitle"
         className="fixed inset-0 z-50 overflow-y-auto bg-black">
      <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
      <AccessGateScene />
      <div className="relative flex min-h-full items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-surface-container/90 p-6 shadow-e3 backdrop-blur-md sm:p-8">
          <h2 id="access-gate-title" className="text-2xl font-normal text-on-surface">{t.auth.gateTitle}</h2>
          <p id="access-gate-subtitle" className="mt-2 text-sm text-on-surface-variant">{t.auth.gateSubtitle}</p>
          <div className="mt-8"><LoginForm onSuccess={() => {}} /></div>
        </div>
      </div>
    </div>
  )
}
```
**Critical design point**: the overlay renders **instead of** `children`, never on top of it — `Shell`
(and its whole router) never mounts while gated. This is what makes "traps focus" and "nothing behind it
is Tab-reachable" true **for free**: there is nothing else in the DOM to tab into, so no hand-rolled
focus-trap cycling logic is needed. No "continuar sin iniciar sesión" escape hatch here — `LoginForm`
never renders one itself, and this component doesn't add one; that stays exclusive to `/login` (C.1).

i18n: `t.auth.gateTitle` = "Acceso restringido" / "Restricted access"; `t.auth.gateSubtitle` = "Inicia
sesión con tu correo y contraseña para continuar." / "Sign in with your email and password to continue."

### `src/features/auth/AccessGateScene.tsx` — three.js background

A background hero image (any suitable dark, blue/gold-toned "futuristic finance" illustration — convert
to an optimized JPEG, ~85% quality, and import it from `src/assets/`) behind a dark scrim, with a light
`three.js` particle field drifting over it:

```tsx
const PARTICLE_COUNT = 220
// Random positions in a ~16×9×8 box; ~60% blue (#6ea8ff), ~40% gold (#ffc46b) tones, per-particle
// shade/size variance. THREE.Points + BufferGeometry (position/color/size attributes),
// PointsMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: AdditiveBlending,
// depthWrite: false }).

export function AccessGateScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }) }
    catch { return }   // fails SILENTLY wherever WebGL isn't available — the static image alone is a complete fallback

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 6
    const points = buildParticles()
    scene.add(points)

    const resize = () => { /* renderer.setSize + camera.aspect + updateProjectionMatrix, guarded against 0-size container */ }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    resize()

    let frameId = 0
    const start = performance.now()
    const renderFrame = (now: number) => {
      const elapsed = (now - start) / 1000
      points.rotation.y = elapsed * 0.02
      points.rotation.x = Math.sin(elapsed * 0.08) * 0.05
      renderer.render(scene, camera)
      if (!reducedMotion) frameId = requestAnimationFrame(renderFrame)   // renders exactly ONE static
    }                                                                     // frame under reduced motion,
    renderFrame(start)                                                   // never starts the RAF loop
    window.addEventListener('resize', resize)

    return () => {   // full cleanup on unmount/dependency change — this is a real WebGL context
      if (frameId) cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      points.geometry.dispose(); (points.material as THREE.Material).dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
    }
  }, [reducedMotion])

  return <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden [&>canvas]:h-full [&>canvas]:w-full" />
}
```
Purely decorative (`aria-hidden`, `pointer-events: none`, never focusable). Must render **something
sensible with no crash** in an environment with no real WebGL (this matters directly for testing this
component under jsdom, which has none).

### Wire into `App.tsx`
```
ThemeProvider > I18nProvider > LocaleProvider > AuthProvider > AccessGate > Shell
```
(`AccessGate` wraps `Shell`, inside `AuthProvider` — not above the context providers, only above the
router.)

### Testing this specifically

`vi.stubEnv` only affects a module **the next time it is evaluated** — since `REQUIRE_LOGIN` is bound to
a module-level constant, a test file that wants to exercise the "flag on" path must stub the env
**before** `App` is first imported in that file, which means a **dynamic** `import()` inside `beforeAll`
(after the stub), not a static top-of-file `import` (static imports are hoisted ahead of any other
top-level code, defeating the stub). Put this in its own dedicated file
(`src/features/auth/__tests__/AccessGate.test.tsx`) so it doesn't share a module registry with the rest
of the suite:
```ts
let App: typeof import('../../../App').default
beforeAll(async () => {
  vi.stubEnv('VITE_REQUIRE_LOGIN', 'true')
  // ...the same matchMedia/ResizeObserver/ElementInternals stand-ins as A.9's a11y suite...
  ;({ default: App } = await import('../../../App'))
})
afterEach(() => { cleanup(); sessionStorage.clear() })
```
Cover at least: (1) blocks behind a dialog with no session, exactly one button inside it (no escape
hatch), nothing from the app in the DOM; (2) rejects an unknown email/password with one generic error,
gate stays up; (3) reveals the app after a correct sign-in; (4) re-shows the gate immediately after
sign-out; (5) restores the session across a **fresh render** (simulating a reload) via `sessionStorage`,
not `localStorage`.

## C.9 — Report Modal Overlap & PDF Pagination Fix

**If C.5 was built directly from this spec's final version, this section is already satisfied — read it
anyway, since it records *why* each specific decision in C.5 is shaped the way it is**, in case a future
change to the report feature is tempted to "simplify" one of these points back to something that looks
more obvious but re-introduces the bug.

**Bug 1 — elements overlapping in the on-screen modal.** Root cause, confirmed by measurement, not
guesswork: every feature's chart/summary grid is built with **viewport-width** Tailwind breakpoints
(`lg:grid-cols-3`, `xl:grid-cols-6`) tuned against the app's real `<main>` column width
(`max-w-7xl`, ~1232px of usable width on a typical desktop viewport). A report modal narrower than that
(e.g. `max-w-4xl`, ~896px) still satisfies the `lg:`/`xl:` breakpoint (it's a media query on the
*viewport*, not the modal), so the grid keeps the same **column count** but each column gets far **less
width** — measured: a 3-column chart grid squeezed from ~390px to ~261px per column; a 6-column summary
grid from ~190px to ~126px. At the extreme this crowds chart legends/labels into a much smaller box than
they were designed for. **The fix is at the layout level**: make the modal **as wide as the app's own
main content column** (`max-w-7xl`), removing the mismatch at its source rather than patching every
feature's grid breakpoints individually. (Investigated and ruled out as the cause: `position: fixed`
tooltips/popovers — this app's `ChartTooltip` renders inside Recharts' own container-relative wrapper,
and `HelpPopover` positions `absolute` relative to its own wrapper; neither escapes to the viewport, and
`HelpPopover` isn't even rendered inside a report in the first place, since only `summary`/`charts` — not
a full parameters panel — are passed in.)

**Bug 2 — charts splitting across two PDF pages.** Root cause: a naive `generatePdf` snapshots the whole
report as **one continuous canvas** and slices it at fixed page-height intervals with no idea where a
chart's own boundary is — the slice can land anywhere, including mid-chart. **The fix**: capture and
paginate **per section**, exactly as specified in C.5's `report.ts` above:
- `collectBlocks` identifies each section as its own DOM element (header, parameter recap, whole summary
  section, each individual chart — via the `data-pdf-block` marker on the shared `Card` component, A.4 —
  and the detail table).
- `generatePdf` runs one `html2canvas()` call **per block**, not one call for the whole report.
- `planPdfLayout` (pure, DOM-free, unit-tested) tracks a running Y-cursor and the remaining space on the
  current page: a block that fits is placed there; a block that doesn't starts a fresh page — the check
  and the placement happen together, so nothing is split between them. Charts and summary-card groups
  are **never** split. Only a block genuinely taller than a full page (an unexpectedly long table) is
  the one allowed exception, and it always starts on its own fresh page before slicing.
- **Verification method that actually proves this, since eyeballing a screenshot doesn't**: intercept
  `URL.createObjectURL` in the browser (jsPDF's `saveAs` path calls it to build the download link),
  capture the resulting `Blob`, read its bytes as text, and regex-count `/Type/Page` (page count) versus
  `/Subtype/Image` (embedded image count) in the raw PDF structure. **If those two counts are ever
  unequal, some block was captured more than once or a block was force-split** — they must always be
  equal for a correctly-functioning per-block export (one image per section, whether or not it needed
  its own page).

**Verify across all seven features**, not just whichever one was originally reported broken — Consolidación de Deudas and Presupuesto for "a lot of content," Meta de Ahorro for "little content," and check a mobile viewport too.

## C.10 — Feature Intro Banners & Legal Disclaimer

**Goal**: fill the empty space every tab leaves between the tab strip and the parameters card, next to
"Ver reporte," with a short explanation of what that feature does; add a shared legal disclaimer at the
bottom of every tab.

### `src/components/ui/FeatureIntro.tsx`
```tsx
interface FeatureIntroProps { icon: ReactNode; title: string; description: string; className?: string }
export function FeatureIntro({ icon, title, description, className = '' }: FeatureIntroProps) {
  return (
    <div className={`flex items-start gap-3 rounded-md bg-primary-container p-4 ${className}`}>
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-on-primary-container/10 text-on-primary-container">{icon}</span>
      <div>
        <p className="text-sm leading-5 font-medium text-on-primary-container">{title}</p>
        <p className="mt-0.5 text-sm leading-5 text-on-primary-container/80">{description}</p>
      </div>
    </div>
  )
}
```
Same `bg-primary-container` filled-card language `SummaryCard`'s `accent` tone already uses — the tab's
opening banner and its eventual headline result read as one visual family. `title` = a bold one-line
hook; `description` = one or two explanatory sentences. Each feature supplies its own small file-local
icon (`<svg viewBox="0 0 24 24">`, same convention as `App.tsx`'s theme icons) — do not create a shared
"icon library" file, keep each icon local to its feature file.

### `src/components/ui/LegalDisclaimer.tsx`
```tsx
export function LegalDisclaimer() {
  const t = useT()
  return <p className="border-t border-outline-variant pt-4 text-xs leading-relaxed text-on-surface-variant">{t.common.legalDisclaimer}</p>
}
```
Small, muted, top-bordered — **not** styled as an alert. One component, rendered identically on all seven
tabs, never copy-pasted.

### Wire into every `*Feature.tsx`
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <FeatureIntro icon={<XIcon />} title={t.x.introTitle} description={t.x.introDescription} className="flex-1" />
  <Button variant="tonal" onClick={() => setShowReport(true)} className="shrink-0">{t.common.viewReport}</Button>
</div>
{/* ...ParametersPanel, Summary, Charts, Schedule... */}
<LegalDisclaimer />
{/* ...ReportView... */}
```
Stacks vertically on mobile (`flex-col`), sits side by side from `sm:` up, banner taking the remaining
width (`flex-1`).

### Exact copy — both languages go straight into the dictionaries, together, never stubbed

| Feature | `introTitle` (ES) | `introDescription` (ES) | `introTitle` (EN) | `introDescription` (EN) |
|---|---|---|---|---|
| Ahorro | Haz crecer un ahorro mes a mes. | Proyecta cómo un aporte mensual fijo crece con interés, después de la retención tributaria. | Watch a monthly contribution grow. | Project how a fixed monthly deposit compounds with interest, net of withholding tax. |
| Meta de ahorro | ¿Cuándo alcanzas tu meta? | Calcula cuánto tiempo tomará llegar a un monto objetivo — o cuánto deberías aportar cada mes para lograrlo a tiempo. | When will you hit your goal? | Find out how long it'll take to reach a target amount — or what monthly contribution gets you there on schedule. |
| Retiro | De tus ahorros a tu ingreso mensual. | Proyecta cómo los aportes de hoy se convierten en ingreso mensual al retirarte, después de impuestos e inflación. | From today's savings to tomorrow's income. | See how today's contributions become monthly income at retirement, after taxes and inflation. |
| Crédito | Entiende el costo real de un préstamo. | Modela el cronograma completo de amortización — cuota, interés y plazo — bajo distintos sistemas de pago. | Understand what a loan really costs. | Model the full amortization schedule — payment, interest, and payoff timeline — across different repayment systems. |
| Consolidación de deudas | ¿Consolidar tus deudas conviene? | Compara lo que pagas hoy en varias deudas contra un solo préstamo consolidado, en pago mensual y tiempo para pagar. | Is consolidating worth it? | Compare what you're paying today across several debts against one consolidated loan — monthly payment and payoff time, side by side. |
| Tarjeta de crédito | Lo que una tarjeta cuesta de verdad. | Simula compras, cuotas diferidas y saldo rotativo — y muestra qué pasa si solo pagas el mínimo. | What a credit card really costs. | Simulate purchases, installments, and revolving balance — and see what happens if you only ever pay the minimum. |
| Mi Presupuesto | ¿A dónde se va tu ingreso? | Registra el ingreso y los gastos del hogar mes a mes, y descubre cuánto queda realmente disponible para ahorrar. | Where does your income actually go? | Track household income and expenses month by month, and see what's genuinely left over to save. |

`common.legalDisclaimer`:

> **ES**: *"Esta herramienta es solo para fines educativos y de planeación personal. No constituye
> asesoría financiera, tributaria ni legal, y Simulador Financiero no es un asesor financiero ni una
> herramienta de asesoría financiera. Las cifras mostradas son estimaciones basadas únicamente en los
> supuestos que usted ingresa y pueden no reflejar resultados reales. Consulte a un profesional
> financiero certificado antes de tomar decisiones basadas en esta información."*
>
> **EN**: *"This tool is for educational and personal planning purposes only. It does not constitute
> financial, tax, or legal advice, and Financial Simulator is not a financial advisor or financial
> advisory tool. Figures shown are estimates based solely on the assumptions you enter and may not
> reflect actual results. Consult a licensed financial professional before making decisions based on
> this information."*

Icons used (simple geometric SVGs, `viewBox="0 0 24 24"`, `fill="currentColor"`, `aria-hidden="true"`):
Ahorro = 3-bar rising chart; Meta de ahorro = flag on a pole; Retiro = sun with rays (reuses `App.tsx`'s
own light-theme icon path); Crédito = bank/columns; Consolidación = converging merge arrows; Tarjeta de
crédito = card rectangle with a stripe; Presupuesto = pie/donut chart.

---

# PART D — DEPLOYMENT

## D.1 — Vercel

The production build is a fully static Vite bundle (`dist/`) — no server runtime, no SSR, no API routes.
Deploy it to Vercel as a static site:
- Build command: `npm run build`. Output directory: `dist`.
- No database, no serverless functions needed for anything in this spec.
- Two options to connect the repo: (a) a direct file-based deploy (no git needed), or (b) link a GitHub
  repository so every push to its production branch triggers a new deployment automatically — prefer (b)
  once the project has a remote.

## D.2 — Environment Variables

Set `VITE_REQUIRE_LOGIN` under **Project Settings → Environment Variables**, scoped per Vercel
environment:
- **Preview**: `true` while the app is still being built out / demoed internally.
- **Production**: `true` initially, flipped to `false` on a later redeploy once the app is ready to be
  opened up publicly — a config change, not a code change, which is the entire point of building the
  gate as an env flag rather than a hardcoded constant.

No other environment variables are required anywhere in this app.

---

# PART E — APPENDIX

## E.1 — Glossary

| Term | Definition |
| --- | --- |
| E.A. (Efectivo Anual) | Effective annual rate — the rate actually earned/charged over a year, accounting for compounding. |
| Nominal M.V. | Nominal monthly-compounded rate — divide by 12 directly, no effective-rate conversion. |
| Annuity-due | Payments at the **start** of each period — the convention for every accumulation phase in this app. |
| Ordinary annuity | Payments at the **end** of each period — used ONLY for Retiro's withdrawal/income phase. |
| Grace period | Loan months paying only interest (`interestOnly`) or capitalising it (`total`) before amortization begins. |
| Revolving balance | A credit card's balance that carries over month to month and accrues interest. |
| Minimum-payment trap | A payment defined as a % of balance that never exceeds the interest charged, so the balance never reaches zero. |
| Utilization | A credit card's total balance ÷ its credit limit. |
| CardProfile | One user-managed credit card: id, name, franchise, and its own independent `CreditCardParams`. |
| `helpLong` / tooltip | Two lengths of the same dictionary entry: a short popover and the same content's full paragraph, reused verbatim on Ayuda. |
| Hash routing | The app's entire client-side routing scheme — the active screen lives in `location.hash`. |

## E.2 — Full File/Folder Structure (final state)

```
src/
  lib/                    # pure, framework-free — no React imports anywhere
    simulate.ts  savingsGoal.ts  retirement.ts  amortize.ts  debtConsolidation.ts  creditCard.ts  budget.ts
    format.ts  dates.ts  limits.ts  csv.ts  report.ts
    __tests__/             # one file per model + report.test.ts
  i18n/
    es.ts  en.ts  i18n.ts  I18nProvider.tsx
    __tests__/noHardcodedStrings.test.ts
  theme/  ThemeProvider.tsx  theme.ts
  types/material-web.d.ts
  assets/access-gate-bg.jpg
  components/ui/
    Inputs.tsx  ParamField.tsx  fieldStyles.ts  Controls.tsx
    SliderWithNumber.tsx  SummaryCard.tsx  SegmentedControl.tsx  Card.tsx  CategoryCard.tsx
    CollapsibleYearTable.tsx  ExportCsvButton.tsx  ChartTooltip.tsx  HelpPopover.tsx
    ChartFrame.tsx  VisuallyHiddenTable.tsx  FeatureIntro.tsx  LegalDisclaimer.tsx  index.ts
  components/report/  ReportView.tsx  ReportTable.tsx
  context/  locale.ts  LocaleProvider.tsx
  hooks/  useHashTab.ts  usePrefersReducedMotion.ts
  features/
    shared/                 # WarningList
    auth/                   # auth.ts  AuthProvider.tsx  LoginForm.tsx  LoginScreen.tsx  AccountControl.tsx
                             # AccessGate.tsx  AccessGateScene.tsx  __tests__/AccessGate.test.tsx
    help/                   # helpIndex.ts  HelpFeature.tsx
    savings/  savingsGoal/  retirement/  loan/  debtConsolidation/  creditCard/  budget/
      use<Feature>.ts  <Feature>Feature.tsx  components/  (ParametersPanel, Summary, Charts, Schedule,
                                                            + creditCard's CardSwitcher/PurchasesPanel,
                                                            + budget's OtherCategoryItems/budgetLabels)
  App.tsx  main.tsx  index.css  a11y.test.tsx
.env  .env.test  vite.config.ts  tsconfig*.json  package.json
```

## E.3 — i18n Namespace Reference

Top-level dictionary keys: `common`, `auth`, `app`, `help`, `savings`, `savingsGoal`, `retirement`,
`loan`, `debtConsolidation`, `card`, `budget`. Every field-level key follows the `x` / `xHelp` /
`xHelpLong` triple (short label / popover / Ayuda paragraph); every feature namespace additionally
carries `introTitle`/`introDescription` (Part C.10); `card` additionally carries the five
`franchiseVisa`/`franchiseMastercard`/`franchiseAmex`/`franchiseDiscover`/`franchiseDiners` labels and
`cardName`/`franchise`/`cardsTitle`/`addCard`/`cardLimitReached`/`defaultCardName`; `auth` carries
`signIn`/`signOut`/`account`/`accountMenu`/`loginTitle`/`loginSubtitle`/`gateTitle`/`gateSubtitle`/
`email`/`password`/`loginError`/`backToApp`/`name`/`emailLabel`; `common` carries
`viewReport`/`downloadPdf`/`close`/`generatedOn`/`reportParameters`/`csvForFullDetail`/
`legalDisclaimer`/`helpFor`.

## E.4 — Known, Deliberate Deviations (do not "fix" these without re-deriving the reasoning first)

1. **Ahorro's reference figure does not reconcile.** At defaults with the tier table
   `[{month 1, 11%}, {month 14, 13%}]`, month-60 balance = **40,837,320** (what the model actually
   produces, pinned in tests). The brief this was checked against quotes **39,041,631**; no parameter
   combination reproduces that number. Pinned as an open, investigated discrepancy.
2. **"Capitalización mensual real" is lower, not higher, than the default** (202,518,437 vs. 211,687,038
   at defaults) — genuine monthly compounding of a fixed annual rate is mathematically less generous per
   month than dividing the annual figure by 12; this is correct, not a bug.
3. **Debt consolidation's 4%/no-floor minimum-payment default does not reproduce the reference's
   138-month figure** — a $15 floor does, and that's what the test suite's reference check actually uses
   as input, but the **shipped default** stays `floor = 0` to match the original spec.
4. **Retirement's tax branch is only verified at 0%/0%** — treat non-zero-tax output as directionally
   correct, not reference-grade, until checked against a real nonzero-tax worked example.
5. **CSV export is always Spanish**, regardless of the active UI language — deliberate, permanent,
   decided once and never revisited alongside every other user-facing string's i18n treatment.
6. **PDF detail table caps at 30 rows**; the on-screen report never caps. This is a deliberate scoping
   choice (file size/generation time), not an oversight.
7. **Currency and theme reset on every reload** (not persisted); only language and theme *mode*
   (light/dark/system, not the resolved value) persist to `localStorage`. Signed-in session persists via
   `sessionStorage` only (Part C.8) — clears when the tab closes.
8. **The production JS bundle exceeds Vite's 500 kB chunk-size warning threshold** (one chunk, ~2.1 MB
   raw / ~595 kB gzipped, largely from three.js + jsPDF + html2canvas-pro + Recharts + @material/web all
   loading eagerly). Acceptable for this app's current size; a candidate for `import()`-based
   code-splitting later, not addressed in this spec.

---

*End of specification. If you have executed Parts A through D in order and Part E's deviations are all
present and accounted for exactly as described (not "fixed"), the resulting application is a complete,
faithful replication of Financial Simulator.*
