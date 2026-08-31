# Financial Simulator

Single-page app for projecting financial scenarios, with seven tabs — **Ahorro**,
**Meta de ahorro**, **Retiro**, **Crédito**, **Consolidación de deudas**, **Tarjeta de
crédito**, **Mi Presupuesto** — kept in the URL hash (`#/ahorro`) so a view can be linked and
shared, plus a top bar with language/currency/theme controls, sign-in, and a `?` link to
[Ayuda](#ayuda) that stay visible across every tab.

React + Vite + TypeScript + Tailwind + Recharts, styled with
[Material Design 3](https://m3.material.io/components). English and Spanish, light and dark,
five currencies. No backend for the app's own data — all parameters live in the browser. The
two exceptions are sign-in (see [Sign in (mock)](#sign-in-mock) and
[Access gate](#access-gate-vite_require_login) below) and the PDF export (see
[Ver reporte / PDF export](#ver-reporte--pdf-export)), both of which are themselves client-side
only, not calls to a server. [three.js](https://threejs.org/) powers one purely decorative
animation on the access gate's background — see below.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest — models, i18n/a11y guards, and structural a11y smoke tests
npm run build    # typecheck + tests + production bundle
```

## Layout

Parameters → Summary → Charts → Detail table, top to bottom. Every parameter change re-runs
the projection live; there is no Calculate button.

## The savings model

All math lives in one pure, UI-free function: [`simulate(params)`](src/lib/simulate.ts).
It imports nothing from React or the DOM, and it is the only place the arithmetic is
defined. For each month `t` from 1 to `años × 12`:

```
year[t]           = floor((t - 1) / 12) + 1
aporte[t]         = aporteBase × (1 + crecimiento) ^ (year[t] - 1)
rate[t]           = resolveRate(t, balance[t-1])
interesAnual[t]   = (t === 1 ? aporte[1] : balance[t-1]) × rate[t]
retencion[t]      = -interesAnual[t] × retencionRate
interesNeto[t]    = interesAnual[t] + retencion[t]
interesMensual[t] = interesNeto[t] / 12
balance[t]        = (balance[t-1] ?? 0) + aporte[t] + interesMensual[t]
```

**Month 1 seeds its interest off the contribution** rather than a zero prior balance,
because there is no prior balance yet. This is intentional and asserted in the tests.

The model divides the annual interest by 12 rather than compounding a monthly rate. That
matches the source spreadsheet, so it stays the default.

### Rate tiers

`Tramos de tasa` (collapsed by default) reveals an editable tier table in two modes:

- **Por antigüedad** — `{ desde el mes, tasa anual }`. The rate for month `t` is the tier
  with the largest `desdeElMes` ≤ `t`.
- **Por saldo** — `{ saldo mínimo, tasa anual }`, evaluated against the **prior** month's
  balance, so the rate steps up as the fund grows.

Tiers auto-sort ascending and the first one is pinned to month 1 / balance 0, which is what
makes the table total. `Interés anual` is always the source of truth for the base rate:
editing it rewrites tier 1, and editing tier 1 writes back to it. With the disclosure off or
a single tier, the projection just uses `Interés anual`.

## The savings reference figure, and two model decisions

**1. The reference figure does not reconcile.** The brief specifies that at defaults with
tiers `[{month 1, 11%}, {month 14, 13%}]`, the month-60 balance is `39,041,631`. The formula
above yields **`40,837,320`**. A scan over switch month, second rate, retention rate,
contribution growth, per-month rounding, and the interest base found no combination that
reproduces `39,041,631`; the closest natural reading — a flat 11 % over the same 60 months —
gives `38,961,827`. The test suite pins the value the specified model actually produces so a
future change to the math is caught, and records the quoted figure as an open discrepancy.
See `reference check against the source spreadsheet` in
[`src/lib/__tests__/simulate.test.ts`](src/lib/__tests__/simulate.test.ts).

**2. What "Capitalización mensual real" does.** The brief describes the toggle as using
`balance[t-1] × (rate / 12)`. Applying the same withholding to that expression reproduces
the default formula exactly — algebraically identical, so the toggle would be a no-op. It is
therefore implemented as genuine monthly compounding, `(1 + r)^(1/12) - 1`, which is what
the label means. Consequently the "real" mode comes out **lower** than the default
(202,518,437 vs. 211,687,038 at defaults), not higher; the comparison panel shows both
balances and the delta, so it reads correctly either way.

## Meta de ahorro

A different question than Ahorro: not "how much will a fixed contribution grow to," but
"how long until a fixed contribution reaches a target, and what contribution would hit the
target exactly on schedule." That is goal-seeking compound interest — the same shape as
solving a loan payment in reverse — so [`src/lib/savingsGoal.ts`](src/lib/savingsGoal.ts)
reuses `toMonthlyRate` from `amortize.ts` rather than a second rate-conversion helper, and
uses annuity-due contributions (paid at the *start* of each month), matching the reference
calculator's own stated assumption.

`monthsToGoal` searches for the smallest month at which the future-value formula clears the
goal (capped at 100 years — a longer answer is reported the same as never, since it isn't a
plan); `requiredContribution` is a closed-form solve for the exact contribution that lands on
the goal at a given month, not a second search. Reference check: 10,000,000 goal, 5 years,
200,000/month at 0.25% E.A. → reaches the goal in 50 months ("4 años y 2 meses") and requires
165,611/month to land exactly at the 5-year mark — both verified against the source
calculator's own worked example before being pinned as tests.

**The inflation field is display-only, by design.** The reference screenshot doesn't show
what its own inflation field actually feeds into, so here it only powers one summary line —
the goal's value in today's purchasing power, `meta ÷ (1+inflación)^años` — and does not
change `monthsToGoal` or `requiredContribution`, which are both always nominal. Adjusting the
goal itself for inflation before solving would be a materially different (and larger) model.

**The goal-amount slider is log-scaled**, not linear — ticks at $0/$1M/$10M/$100M, matching
the reference's own $0/$1k/$10k/$100k spacing scaled up by 1000 for COP defaults. A linear
track from $0 to $100M would put every realistic goal in the first few visible pixels. This
is a small, generic addition to the shared `SliderWithNumber` (`toPosition`/`fromPosition`
props, opt-in, every existing linear slider is unaffected), not a one-off component, since a
large-currency slider is a plausible need for a future feature too.

**One real bug this feature's `@material/web` usage surfaced and fixed:** passing a raw
JS boolean to `aria-expanded` on `<md-icon-button>` silently failed — React sets a non-string
value on a custom element as a JS property rather than an HTML attribute, and the component's
own ARIA reflection did not turn that back into the `"true"`/`"false"` string a screen reader
needs. `HelpPopover` passes the string explicitly instead. Every other `aria-expanded` in the
app is on a plain `<button>`/`<summary>`, where this never comes up — it is specific to
mixing React with a real custom element, which is exactly the kind of integration risk noted
before installing `@material/web` in the first place.

## Retiro

Projects an accumulation phase (working years, annual contributions) into a withdrawal phase
(retirement years, monthly income), and reports what that income is worth after tax and after
inflation. The model lives in [`src/lib/retirement.ts`](src/lib/retirement.ts).

**Two different annuity conventions, on purpose.** Accumulation uses annuity-due — the
contribution lands at the *start* of each year, same as `savingsGoal.ts` — via `accumulate`,
a future-value formula generalised to a variable contribution *schedule* rather than a flat
amount (needed to support inflation-growing contributions). Withdrawal uses an *ordinary*
annuity instead — income paid at the *end* of each month (`monthlyIncomeFromBalance`) — the one
place in this app that departs from "period start." That departure isn't a stylistic choice:
it's the only convention that reproduces the reference calculator's own numbers, verified
against a reference scenario (250,000 balance, 2,000/year, ages 45→65, 30 years retired, 7%/4%
returns, 0% taxes) before being pinned as a test — balance at retirement ≈ 1,055,151, monthly
income before tax ≈ 4,994, monthly income in today's money ≈ 2,765, all matched exactly.

**The tax branch is pseudocode, not reference-checked.** `resolveEffectiveRates` implements two
mutually exclusive tax treatments: tax-deferred (growth compounds untaxed; the withdrawal
itself is taxed via `monthlyIncomeAfterTax`) versus not deferred (the annual return is taxed
every year instead, and the withdrawal is not taxed again — otherwise the model would tax the
same money twice). The reference scenario used 0% for both tax rates, so this branch has never
been checked against a real nonzero-tax reference figure — only against internal consistency
(a 0% retirement tax leaves income unchanged; a higher retirement tax strictly lowers it). Treat
the after-tax numbers as directionally right, not reference-grade, until checked against a real
example with nonzero rates.

**The third chart (`buildRetirementDepletion`) is a value-add beyond the reference**, which
doesn't show a month-by-month depletion curve — it's included because the model already
produces the data for free and a chart of the balance actually reaching zero is informative on
its own terms, not because the reference asked for it.

## The loan model

`amortize(params)` in [`src/lib/amortize.ts`](src/lib/amortize.ts), with rate normalisation
exported separately as `toMonthlyRate(rate, convention)`:

```
E.A.         → i = (1 + tasa) ^ (1/12) - 1
Nominal M.V. → i = tasa / 12
Mensual      → i = tasa
```

Three systems: **francés** (level payment), **alemán** (constant principal, decreasing
instalment) and **bullet** (interest only, principal at the end). A grace period either pays
the interest or capitalises it. Extra payments either shorten the term or shrink the
instalment — in both cases the instalment is *recomputed* from the outstanding balance and
the remaining term rather than patched, and the final month absorbs any rounding residue so
the balance lands exactly on zero.

Reference: 50,000,000 at 18 % E.A. over 60 months, French → `1,233,670` per month and
`24,020,205` in interest, checked against the closed form first and then the quoted anchors.

**One deviation from the brief.** The brief defines `cuotaTotal = cuota + seguros + cargos`,
which excludes extra payments. An extra payment is money that leaves the account that month,
so excluding it would make "Total pagado" understate what the loan actually cost. `Cuota
total` therefore includes the extra, and the schedule keeps `Abono extra` as its own column
so both readings stay visible.

## Consolidación de deudas

Compares what you're currently paying across several debts (credit cards, auto loans, other
installment loans) against one new consolidated loan. The model lives in
[`src/lib/debtConsolidation.ts`](src/lib/debtConsolidation.ts), which reuses `amortize()`
directly for the consolidated loan rather than re-deriving the payment formula.

**This feature reads every rate as Nominal M.V., not E.A.** — the opposite of Loan's own
default convention. Verified against the reference's own consolidated-loan figure: $5,000 at
11% over 120 months → $68.88, which only comes out of `amortize()` under Nominal M.V., not
E.A. There is no convention selector anywhere in this feature (matching the reference's own
plain "interest rate" fields) — a real, deliberate difference from Crédito, not an
inconsistency to fix.

**Two payment models live side by side, genuinely, not by oversight.** A fixed-payment
installment debt (auto, other, or a credit card with the minimum-payment toggle off) uses the
closed-form payoff formula `monthsToPayoff` — the inverse of the standard annuity payment
formula, cross-checked in tests against `levelPayment` from `amortize.ts`. A credit card paying
its *minimum* is a different, harder problem: the payment is a percentage of the balance,
recomputed every month, so there is no closed form — `monthsToPayoffDeclining` simulates it
month by month.

**The minimum-payment default (4%, no floor) does not reproduce the reference's own 138-month
figure — this was checked, not assumed.** A pure percentage-of-balance payment decays
geometrically and technically never finishes: with no floor, the balance keeps shrinking by
~4%/month forever, and reaching even a tiny epsilon takes ~560 months at the reference's own
18.9% rate, not 138. The reference calculator's UI shows no floor field at all, but a small
hidden floor is almost certainly what it actually uses internally — a Nominal M.V. rate with a
$15 floor (on the $5,000 reference balance) reproduces 138 months almost exactly, and that
combination is what `debtConsolidation.test.ts`'s reference-check test actually passes as
input. The shipped default stays floor = 0 (matches the spec this was built against), so a
fresh install's numbers will *not* match the reference screenshot out of the box for a
minimum-payment card — only entering a floor will. Treat 4%/no-floor as a starting point, not a
verified issuer rule, before trusting the payoff-time number for anything beyond this one
reference case.

**"Ahorro total en intereses" is a value-add beyond the reference**, which doesn't show a
total-interest comparison at all — it's included because it's the number that actually answers
"should I consolidate," and the model already has every figure it needs (each debt's own payoff
simulation, and the consolidated loan's own interest total from `amortize()`).

## The credit card model

`simulateCard(params)` in [`src/lib/creditCard.ts`](src/lib/creditCard.ts), with
`installmentPlan(amount, installments, rate, interestFree)` exported separately. It reuses
`toMonthlyRate` from the loan model rather than duplicating the conventions.

Interest accrues on the prior revolving balance before the payment lands. Deferred purchases
each carry their own principal/interest split, so the table can break a month down per
purchase (`3/12`). Deferred recurring expenses spawn one plan per month.

**Trap detection is a first-class output.** When the payment never covers interest plus the
fee, `monthsToZero` is `null` — never the horizon — and the UI says so in red rather than
showing a number that looks like an answer. `compareStrategies` runs the same purchases under
mínimo / fijo / total so the summary strip and the comparison chart share one computation.

Reference: 3,000,000 over 12 cuotas at 25 % E.A. → `281,539` per instalment, `3,378,470`
total, again checked against the closed form before the anchors.

**More than one card.** `useCreditCard` owns a *list* of `CardProfile`s (id, `name`, `franchise`,
and its own independent `CreditCardParams`), not a single set of parameters — each card's
purchases, strategy, and limit are entirely its own. Only the active card is ever simulated:
`params`, `rows`, `totals`, `comparison`, and `warnings` all read as "the active card's," which
is why `CardParametersPanel`, `PurchasesPanel`, `CardSummary`, `CardCharts`, and `CardSchedule`
needed no changes at all to become multi-card aware — they always operated on that same slice
and still do. [`CardSwitcher`](src/features/creditCard/components/CardSwitcher.tsx) is the one
new piece: a row of selectable pills (one per card, `role="radiogroup"`/`role="radio"` — the
same accessible single-select pattern the top bar's own language toggle already uses, rather
than a new ARIA tabs implementation) plus a name field and a five-option franchise select
(Visa, Mastercard, American Express, Discover, Diners Club) for whichever card is active. At
least one card always exists — the delete control itself disappears rather than allowing the
last one to be removed, since an empty feature has nothing to show. A default name like
"Tarjeta 1" is seeded once and, for cards added afterward, generated by the *component*
(`t.card.defaultCardName(n)`) rather than the hook — `useCreditCard` never calls `useT()`,
keeping it as language-agnostic as every other feature hook in this app. The CSV export and the
PDF report both lead with the active card's name and franchise, and the CSV filename is
slugified from the card's own name so exporting two different cards never overwrites the same
file.

## Mi Presupuesto

How much is left over to save once every income and expense is normalised to a monthly
figure. The model lives in [`src/lib/budget.ts`](src/lib/budget.ts) and, unlike every other
feature in this app, is almost entirely unit conversion and summation rather than compounding
math — `toMonthly(amount, frequency)` scales a weekly/biweekly/semi-monthly/quarterly/annual
figure to its monthly equivalent, and everything downstream is addition.

Positioned as the last tab for now (after Tarjeta de crédito), appended rather than inserted —
though it's foundational enough (income and expenses) that it could arguably lead the tab
order instead; flagged for the next round rather than reordered unprompted.

**Two different "net income" figures exist on purpose**, documented at
`buildIncomeChartSlices`: the headline and summary card's `totalNetIncome` includes each
earner's `otherIncome` (a bonus is real take-home money), while the gross-income donut's net
remainder deliberately excludes it — that donut decomposes gross salary alone, and a bonus was
never part of the gross being sliced up. Same underlying data, two differently-scoped
aggregates, not a rounding mismatch between them.

**A donut can't show a negative wedge.** When `availableToSave` is negative, the expense
donut's own slice is floored to 0 for display only — the real signed figure still drives the
headline sentence (in red, via the app's existing negative-value convention) and the "Available
to save" summary card (switched to its `negative` tone), so the shortfall is never hidden, just
not asked to render as a wedge that doesn't exist.

**`CategoryCard`** (new, in `src/components/ui/`) is the shared grouped-input container this
feature needed and every prior feature didn't: a real `<fieldset>`/`<legend>` — so a screen
reader announces the section name for every field inside it — with a live subtotal in the
header and a collapse toggle that starts **open**, unlike `Disclosure`'s closed-by-default
(this is a data-entry form, not optional extras). Reusable for any future feature with grouped
inputs.

**No meaningful reference figure to check against.** The source screenshot's own numbers are
all-zero except one stray $1 in Maintenance — reproduced exactly as
`totalExpenses === 1, totalNetIncome === 0, availableToSave === -1` in
`budget.test.ts` — so this feature's correctness rests on the frequency-conversion math and the
summation being right, not on matching a specific dollar figure the way every other feature's
reference check does.

**Every expense category is extensible, not just Maintenance.** Hipoteca y deudas, Servicios
públicos, Alimentación y gastos generales, Seguros, and Mantenimiento/médico/cuidado infantil
all get the same repeatable "Agregar partida" row (`OtherCategoryItems`, shared) that only
Maintenance originally had. Each added `{ etiqueta, monto }` row fully participates in the
model via `otherItemsTotal()`: it's summed into that category's subtotal, `totalExpenses`, and
`disponibleParaAhorrar`; it's grouped under its parent category's wedge in the Composición del
gasto donut (never a separate slice — the donut still reads by category, not by every custom
row); it's listed individually in the detail table and the CSV export; and removing a row
drops it from every total immediately, since these rows live in the same `useBudget` state as
everything else rather than a side list. Income's own "Otro ingreso" stays a single field —
extensibility there was explicitly out of scope.

## Language, theme, and currency

Three settings, deliberately independent — and, since the i18n retrofit, independent in a
specific way that's easy to get wrong:

| Setting | Controls | Where it lives |
| --- | --- | --- |
| **Language** (`ES` / `EN`) | every UI string, month names, **and number formatting** (grouping/decimal separator) | `src/i18n/` |
| **Theme** (light / dark / system) | every colour | `src/theme/` |
| **Currency** (5 options) | which currency code/symbol every amount renders in | `src/context/` |

Language and theme persist in `localStorage` and are picked up on the next visit; the theme
also follows the OS while it is set to *system*. On a first visit the language is guessed
from `navigator.language`.

**Number formatting follows language, not currency.** `Intl.NumberFormat`'s `locale`
argument — which controls whether the grouping separator is a comma or a period, and where
it falls — comes from `LANGUAGE_LOCALES[language]` (`src/context/locale.ts`), never from the
selected currency. Reading the app in English while every amount is in Colombian pesos is a
normal thing to want (a US-based reviewer looking at COP figures, say), and the two settings
used to be bundled into one "Moneda / locale" field per feature before this split — that field
is gone; currency now only decides *which* currency, never how the digits are grouped.

`src/i18n/es.ts` is the reference dictionary and `en.ts` is typed against it — adding a key
to Spanish fails the build until English is filled in. Interpolated strings are functions
rather than templates with placeholders, so each language puts the arguments where its own
grammar needs them, and the argument types are checked:

```ts
lastPaymentSaved: (months: number, saved: number) => `${months} meses — ${saved} menos`
```

Feature hooks never build sentences. They return descriptors — `{ code: 'extraBeyondTerm',
months: 60 }` — and the component translates them, so no model or hook knows what language
the UI is in.

**No component may render a literal user-facing string.** Every string — button labels,
chart titles, headline sentences, validation and error text — goes through `t.<namespace>.key`
or `t.<namespace>.key(args)`. This is enforced, not just conventional:
[`src/i18n/__tests__/noHardcodedStrings.test.ts`](src/i18n/__tests__/noHardcodedStrings.test.ts)
parses every component with the TypeScript compiler API (not a regex/grep pass, which is too
easy to fool with JSX's nesting) and fails the build if it finds JSX text or a string-literal
value on a watched attribute (`aria-label`, `placeholder`, `title`, …) that didn't come from
the dictionary. It runs as part of `npm test` / `npm run build`, so a regression here is a
build failure, not a code-review nit.

## Field-level help: one paragraph, two lengths

Every input field across every feature has an accessible `?` popover
(`HelpPopover` — a real `<md-icon-button>` wired to `aria-describedby`, not a hover-only
`title`) that shows a short `tooltip`. Each field's dictionary entry also carries a longer
`helpLong` paragraph, unused by the popover itself — it exists so [Ayuda](#ayuda) can quote
the exact same explanation at full length. This is one dictionary entry serving two lengths,
not two copies of the same prose to keep in sync; if a field's explanation is wrong, there is
exactly one place to fix it.

## Multi-currency

The top bar's currency selector offers exactly five options — chosen deliberately narrow
rather than every ISO currency:

| Code | Currency | Format locale |
| --- | --- | --- |
| `USD` | Dólar | `en-US` |
| `EUR` | Euro | `de-DE` |
| `GBP` | Libra | `en-GB` |
| `KYD` | Dólar Caimán | `en-US` |
| `COP` | Pesos | `es-CO` |

**`[assumption]` "Pesos" defaults to COP (Colombian peso), not MXN/ARS/CLP/DOP** — the label
is genuinely ambiguous across Spanish-speaking countries, and COP was chosen because it's the
currency the rest of this app's reference figures and defaults were already built around.
This is confirmed, not merely assumed: asked directly, the answer was COP.

Every currency-formatted value across all seven features, every chart tooltip and axis label,
and every CSV export re-renders live on a currency change — there is no reload and nothing
goes stale, because they all read the active currency from the shared `useLocale()` context
rather than each feature holding its own copy. This selector fully replaced an earlier,
per-feature "Moneda / formato" field that had been duplicated across Ahorro, Crédito, and
Tarjeta de crédito (three features, not the one it was first assumed to be in) — that field is
gone from all three now that the top bar is the single source of truth.

## Material Design 3

Colour is the M3 baseline scheme, declared once per role for light and once for dark as CSS
custom properties, then mapped to Tailwind tokens with `@theme inline`. Because the tokens
resolve through `var()`, flipping `data-theme` on `<html>` recolours the whole app and there
is not a single `dark:` variant in any component.

Components follow the M3 specs: filled text fields, filled/tonal/text buttons with state
layers, segmented buttons, switches and checkboxes, a top app bar with primary tabs, filled
and elevated cards, and data tables. Shape and elevation come from the M3 scales.

One deliberate departure: **chart colours live in TypeScript**, not CSS. Recharts needs
literal colour strings for its SVG attributes, and reading them back with `getComputedStyle`
during render is a trap — the theme attribute is applied in an effect, so a render-time read
returns the *previous* theme's colours for one frame. `CHART_PALETTES` in
[`src/theme/theme.ts`](src/theme/theme.ts) is keyed by resolved theme instead.

Every parameter field renders through `ParamField` — label, a 44px control, a helper
line, three fixed-height slots so a row of fields always lines up (see the fix noted in the
Structure section's history — this replaced an earlier two-shape `Field` that mixed a
floated-inside label with a stacked-above one, which is what caused the misalignment).

**`@material/web`** — Google's actual Material Web Components (Lit-based custom elements) —
is installed and used for exactly one thing: `HelpPopover`'s `(?)` trigger button
(`<md-icon-button>`), Meta de ahorro's accessible field-help popover. Everything else in the
app is the hand-built Tailwind system described above. A full swap of every input/button/card
to real Web Components was considered and deliberately not done in the same pass that added
one new feature — see [Meta de ahorro](#meta-de-ahorro) below for why, and for the one rough
edge that single Web Component usage did surface.

## Ver reporte / PDF export

All seven features share one "Ver reporte" button and one `<ReportView>` component
([`src/components/report/ReportView.tsx`](src/components/report/ReportView.tsx)) rather than
each feature building its own report screen. It renders a parameter recap (every input as
entered), the summary cards, the charts (drawn normally, then captured), and the detail table
— honouring whichever language/currency is currently active — plus a generation timestamp
(`Intl.DateTimeFormat`, correctly locale-aware: it reads `dateLocale` from `useI18n()`, not
`undefined`, so the date itself is never silently in the wrong language even when the rest of
the report is) and the app header.

**"Descargar PDF" is client-side only, no backend** — the second deliberate exception in this
app alongside the mock login. [`src/lib/report.ts`](src/lib/report.ts)'s `generatePdf` captures
the report DOM with `html2canvas-pro` (not plain `html2canvas` — the plain package can't parse
the `oklab()`/`oklch()`/`color-mix()` functions Tailwind v4's `@theme` machinery emits, and
fails uncaught mid-capture; this was found live, by actually clicking the button, not by any
automated test, since jsdom doesn't exercise real canvas rendering) and slices the resulting
canvas across as many `pdf.addPage()` calls as it takes via `jspdf`.

**The PDF caps its detail table at the first ~30 rows** (`REPORT_PDF_ROW_CAP`), with a caption
pointing at the CSV export for the full schedule — a deliberate scoping choice to keep the PDF
small and fast rather than rendering hundreds of rows as an image. This cap is specific to the
PDF: the on-screen report view still shows everything. The PDF itself, being a visual
snapshot, carries no accessibility semantics of its own — an acknowledged limit of the format,
not something to work around; the on-screen report follows the same accessibility baseline as
the rest of the app.

## Ayuda

Reference material, not a calculator — reached from a `?` icon in the top bar (`/ayuda`, via
the same hash-based routing every tab already uses), deliberately not a tab in the main list.
[`HelpFeature`](src/features/help/HelpFeature.tsx) is a two-pane layout: a left index grouped
by feature (all seven), each expanding to every field in that feature; selecting a field jumps
the content pane to its explanation.

**That explanation is the exact same `helpLong` string the field's own tooltip already
reads** — see [Field-level help](#field-level-help-one-paragraph-two-lengths) above.
[`helpIndex.ts`](src/features/help/helpIndex.ts) only lists *which fields exist* per feature;
it holds no prose of its own, reading `helpLong` (falling back to the tooltip's own `Help`
key for the handful of fields that never needed a longer version) straight out of the same
dictionary entry.

The index has a simple client-side text filter (no server — the index is static bundled
data) that filters fields by label and auto-expands any group with a match. The index is
keyboard-navigable (plain `<button>`s for the expand/collapse groups, real `<a>`s for fields),
follows proper heading hierarchy per feature/field, and has a skip-to-content link.

**The skip link cannot be a plain `href="#help-main-content"` anchor** — this app's tab
navigation is itself hash-routed (`useHashTab`, `#/ahorro`, `#/ayuda`, …), so letting the
browser follow that fragment href would set `location.hash` to `#help-main-content`, which the
router reads as an unrecognised route and falls back to the default tab — silently kicking the
keyboard user out of Ayuda entirely instead of just moving focus. The skip link (and the
field links) `preventDefault()` and move focus programmatically via a ref instead. This is the
kind of collision that's easy to miss in review (the anchor *looks* like an ordinary
same-page fragment link) and was only caught by actually tabbing to the link and activating it
in a real browser, not by the unit/a11y test suite.

## Structure

```
src/
  lib/                    # pure, framework-free — no React imports anywhere
    simulate.ts           # Ahorro model + defaults
    savingsGoal.ts        # Meta de ahorro model — reuses toMonthlyRate from amortize.ts
    retirement.ts         # Retiro model — accumulation (annuity-due) + withdrawal (ordinary annuity)
    amortize.ts           # Crédito model + toMonthlyRate + defaults
    debtConsolidation.ts  # Consolidación de deudas model — reuses amortize() for the new loan
    creditCard.ts         # Tarjeta de crédito model + installmentPlan
    budget.ts             # Mi Presupuesto model — frequency conversion + summation, no compounding
    format.ts             # formatCurrency / formatAbbrev / parsing helpers
    dates.ts              # ISO date arithmetic
    limits.ts             # array-size caps (tiers, extra payments, purchases…)
    csv.ts                # schedule serialisation, one exporter per feature
    report.ts             # generatePdf() + shared report types — see Ver reporte / PDF export
    __tests__/            # one Vitest file per model
  i18n/                   # es.ts (reference), en.ts, provider + useT()
    __tests__/noHardcodedStrings.test.ts  # AST-based guard — fails the build on a stray literal string
  theme/                  # light/dark mode; theme.ts also holds CHART_PALETTES
  types/material-web.d.ts # JSX typing for the one @material/web tag in use
  assets/access-gate-bg.jpg  # background image for the access gate overlay
  components/ui/          # generic, feature-agnostic M3 primitives
    Inputs.tsx            # CurrencyInput, NumberInput, PercentInput, Select, Checkbox
    ParamField.tsx  fieldStyles.ts  Controls.tsx  # Button, IconButton, Switch, Disclosure
    SliderWithNumber.tsx  SummaryCard.tsx  SegmentedControl.tsx  Card.tsx
    CollapsibleYearTable.tsx  ExportCsvButton.tsx  ChartTooltip.tsx  CategoryCard.tsx
    HelpPopover.tsx        # the one real @material/web usage — see below
    ChartFrame.tsx  VisuallyHiddenTable.tsx  # chart accessibility fallback
  components/report/       # shared "Ver reporte" infrastructure, all 7 features
    ReportView.tsx  ReportTable.tsx
  context/                # global currency setting (locale for formatting comes from language — see above)
  hooks/                  # useHashTab (tab state in the URL hash), usePrefersReducedMotion
  features/
    shared/               # WarningList, shared across features
    auth/                 # mock sign-in + access gate — see below; nothing else depends on it
      LoginForm.tsx       # the one hardcoded-credential check, shared by /login and the gate
      AccessGate.tsx      # VITE_REQUIRE_LOGIN wall in front of the whole app
      AccessGateScene.tsx # three.js particle background for the gate overlay
      __tests__/AccessGate.test.tsx  # gate block/reveal/sign-out/persistence, flag forced on
    help/                 # Ayuda — HelpFeature.tsx + helpIndex.ts (see Ayuda below)
    savings/              # Ahorro — owns its params in useSavings
    savingsGoal/          # Meta de ahorro — useSavingsGoal
    retirement/           # Retiro — useRetirement
    loan/                 # Crédito — useLoan
    debtConsolidation/    # Consolidación de deudas — useDebtConsolidation
    creditCard/           # Tarjeta de crédito — useCreditCard
    budget/               # Mi Presupuesto — useBudget, budgetLabels.ts (shared with the schedule table)
  App.tsx                 # shell + top bar (language/currency/theme/help/auth) + #/login, #/ayuda routing
```

Naming: **Financial Simulator** is the product name and stays in English in both languages.
All code identifiers, files, types, and props are English regardless of the UI language.

Each feature owns its own parameter state; language, theme, and currency are the only
global settings. Adding a simulator means a model in `src/lib/`, a folder under
`src/features/`, dictionary entries in `es.ts` and `en.ts`, and one entry in `TAB_IDS` in
`App.tsx`.

## Sign in (mock)

Identifies who's using the app — name, email — for profile purposes only. By default it is
**additive, never a gate**: Ahorro, Crédito, and Tarjeta work exactly the same signed in or
out, and no feature reads `useAuth()` except the top bar's account control and `/login`
itself. `VITE_REQUIRE_LOGIN` (below) can turn that same sign-in into a hard requirement in
front of the whole app, without touching the sign-in mechanism itself.

**This is a mock, not a real auth system.** Two accounts are hardcoded in
[`AuthProvider.tsx`](src/features/auth/AuthProvider.tsx) — `diego@realcapital.pro` and
`andres@realcapital.pro`, both `Password1!` — checked in one `Array.find` comparison, nothing
persisted, nothing sent anywhere. This is the one deliberate exception to the app's own
"never store a password" baseline that every other form follows: these are demo credentials
supplied for this mock, not real user secrets, so hardcoding them in client source is the
expected, scoped trade-off — the password appears in exactly that one comparison line, never
logged, never repeated elsewhere.

`useAuth()`'s shape — `{ uid, name, email, avatarUrl } | null` plus `login`/`logout` — is
deliberately provider-agnostic: swapping this mock for a real system (Google via Firebase, or
anything else) later means rewriting `auth.ts` and `AuthProvider.tsx` alone. Every consumer
(`AccountControl`, `LoginScreen`) only ever touches that shape. (An earlier pass through this
project did wire up real Firebase/Google sign-in; it was removed in favour of this mock,
which is now the only auth path — the two were never meant to run side by side.)

**Flow.** The button navigates to `#/login` (a hash-routed screen, not a path — this SPA has
no server to add a rewrite rule for a real `/login` path on refresh, and the existing tab
navigation was already hash-based, so `/login` reuses that same mechanism rather than adding
a router dependency for one screen). The form asks for **Correo electrónico** and
**Contraseña**; a wrong combination shows one generic inline error — *"Correo o contraseña
incorrectos"* — never indicating which field was wrong. A **"Volver a la app sin iniciar
sesión"** link is equally prominent and always present. Either path returns to whichever tab
was active before the button was clicked.

The credential check itself lives in one place — [`LoginForm.tsx`](src/features/auth/LoginForm.tsx)
— shared by `/login` and the access gate below, rather than two copies that could drift.
`LoginForm` never renders the "Volver a la app" escape hatch itself; that stays specific to
`/login`, added around it by `LoginScreen.tsx`.

**Persistence.** A signed-in session is stored as `{ email }` in `sessionStorage` (not
`localStorage`), so it survives a reload but clears the moment the tab closes — the full
`{ name, email, avatarUrl }` shape is re-derived from that one persisted email against the
same two demo accounts on the next mount, exactly as `login()` derives it the first time.
Signing out clears it immediately.

**Account menu.** Signed in, the top bar's sign-in button becomes an avatar (an initial-letter
circle — there's no real photo for a mock account) and name; its dropdown shows **Nombre**,
**Correo**, and **Cerrar sesión** — identity only, nothing else, for now.

## Access gate (`VITE_REQUIRE_LOGIN`)

[`AccessGate.tsx`](src/features/auth/AccessGate.tsx) wraps the whole app, above `Shell` (and
therefore above the router), and reads one build-time flag:

```ts
const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN === 'true'
```

| Flag | Session | What renders |
| --- | --- | --- |
| `false` | any | `children` (`<Shell />`) immediately — auth stays exactly as optional as described above. |
| `true` | none | A full-screen overlay **instead of** `children` — `Shell` never mounts, so there is no route behind the gate (not `/ahorro`, not `/ayuda`) and nothing to reach by any means. |
| `true` | active | `children` normally, top bar and account menu intact. |

Because the overlay replaces `children` rather than layering on top of it, "traps focus" and
"nothing behind it is Tab-reachable" fall out for free — there is nothing else in the DOM to
tab into. The overlay itself is `role="dialog"` / `aria-modal="true"`, labelled by its own
heading and subtitle (`aria-labelledby`/`aria-describedby`) rather than by a redundant
`aria-label` repeating the same visible text. Unlike `/login`, this overlay never renders the
"Volver a la app" escape hatch — the whole point of a gate is that there isn't one.

**Background.** A cinematic hero image ([`src/assets/access-gate-bg.jpg`](src/assets/access-gate-bg.jpg))
sits behind a dark scrim for legibility, with a light [three.js](https://threejs.org/) particle
field ([`AccessGateScene.tsx`](src/features/auth/AccessGateScene.tsx)) drifting over it in the
image's own blue/gold palette — decorative only (`aria-hidden`, `pointer-events: none`), fails
silently with no crash wherever WebGL isn't available, disposes its renderer/geometry/material
on unmount, and freezes to a single static frame under `prefers-reduced-motion` via the
existing `usePrefersReducedMotion` hook.

**Setting the flag.** `.env` commits `VITE_REQUIRE_LOGIN=true` as the repo-wide default — the
gate is on unless something overrides it. `.env.test` overrides it to `false` for the Vitest
suite specifically, so the existing feature/a11y tests keep rendering `<App />` and finding
the tab strip directly rather than every test first needing to sign in; the gate's own
behaviour (block / reveal / sign-out / persistence) is covered separately in
[`AccessGate.test.tsx`](src/features/auth/__tests__/AccessGate.test.tsx). In Vercel, set
`VITE_REQUIRE_LOGIN` under **Project Settings → Environment Variables**, scoped per
environment (e.g. `true` for Preview while the app is still being built out, `false` for
Production once it's ready to open up) — a platform-level value there overrides `.env` at
build time, so flipping visibility later is a redeploy with one changed setting, not a code
change.

## Notes

- Currency and format are switchable (default `es-CO` / `COP`, thousands separators, no
  decimals). Decimal inputs accept either separator, so `11,5` and `11.5` both work.
- The detail table groups by year with collapsible subtotals (year 1 open by default), a
  sticky header, and fixed-height row virtualisation — 480 months stays at ~30 DOM rows.
- In a year subtotal row, `Interés anual` is the interest actually accrued that year (the sum
  of the monthly shares), not a sum of annualised figures, which would be meaningless.
- Export CSV writes the current parameters above the schedule so a file traces back to its
  scenario. Numbers are unformatted so it opens cleanly in any locale.
