/**
 * Savings goal model (feature: Meta de ahorro).
 *
 * Pure and UI-free — no React, no DOM, no imports from `src/features`.
 *
 * This answers a different question than `simulate.ts`: not "how much will a
 * fixed contribution grow to," but "how long until a fixed contribution
 * reaches a target, and what contribution would hit it exactly on schedule."
 * That's goal-seeking compound interest, the same shape as a loan payment
 * calculation run in reverse — which is why this reuses `toMonthlyRate` from
 * `amortize.ts` rather than a second rate-conversion helper.
 */
import { toMonthlyRate } from './amortize'

export interface SavingsGoalParams {
  /** The target balance. */
  goal: number
  /** Horizon used for the chart/table and for `requiredContribution`. */
  years: number
  /** Balance already on hand before the first contribution. */
  currentSavings: number
  /** What gets compared against the required contribution, not solved for. */
  monthlyContribution: number
  /** A fraction, always read as effective annual (no convention selector). */
  expectedReturn: number
  /** Display-only — see `todaysPurchasingPower`. */
  expectedInflation: number
}

export const MIN_GOAL_YEARS = 1
export const MAX_GOAL_YEARS = 40

export const DEFAULT_SAVINGS_GOAL_PARAMS: SavingsGoalParams = {
  goal: 10_000_000,
  years: 5,
  currentSavings: 0,
  monthlyContribution: 200_000,
  expectedReturn: 0.0025,
  expectedInflation: 0.03,
}

export const createSavingsGoalParams = (): SavingsGoalParams => ({
  ...DEFAULT_SAVINGS_GOAL_PARAMS,
})

/** Hard stop: a goal that would take longer than this is reported as unreachable. */
const MAX_MONTHS_SEARCHED = 12 * 100

/**
 * The future value after `months` of an annuity-due contribution `c` — paid
 * at the *start* of each month, not the end, matching the source
 * calculator's own stated assumption. At `i === 0` the compounding term
 * divides by zero, so that case is simple linear accumulation instead.
 */
export function fv(months: number, contribution: number, startingBalance: number, i: number): number {
  if (months <= 0) return startingBalance
  if (i === 0) return startingBalance + contribution * months
  const growth = Math.pow(1 + i, months)
  return startingBalance * growth + contribution * ((growth - 1) / i) * (1 + i)
}

/**
 * The smallest number of months for which `fv(...) >= goal`, or `null` in
 * either of two cases: the guaranteed-never case, where a non-positive
 * contribution needs the rate alone to close the gap and a non-positive rate
 * never will (checked up front rather than searching to confirm it); or the
 * practical-never case, where the goal is not reached within
 * `MAX_MONTHS_SEARCHED` (100 years) — mathematically it might still arrive
 * given enough centuries, but that is not a plan, so it is reported the same
 * way as truly unreachable.
 */
export function monthsToGoal(
  goal: number,
  contribution: number,
  currentSavings: number,
  i: number,
): number | null {
  if (currentSavings >= goal) return 0
  if (contribution <= 0 && i <= 0) return null

  for (let months = 1; months <= MAX_MONTHS_SEARCHED; months++) {
    if (fv(months, contribution, currentSavings, i) >= goal) return months
  }
  return null
}

/**
 * The contribution that lands exactly on `goal` at month `n` — a closed-form
 * solve of `fv(n, c, p0, i) = goal` for `c`, not a search. A result below zero
 * means `currentSavings` alone already clears the goal by month `n` on
 * interest alone; that's clamped to 0 rather than returned negative, since a
 * "required contribution" of less than nothing isn't a meaningful figure —
 * the caller is expected to treat exactly-0 as "already on track without
 * saving anything more."
 */
export function requiredContribution(
  goal: number,
  currentSavings: number,
  i: number,
  months: number,
): number {
  if (months <= 0) return 0
  if (i === 0) return Math.max(0, (goal - currentSavings) / months)

  const growth = Math.pow(1 + i, months)
  const raw = ((goal - currentSavings * growth) * i) / ((growth - 1) * (1 + i))
  return Math.max(0, raw)
}

/**
 * The goal's value in today's purchasing power, discounting it back by the
 * expected inflation over the horizon. Display-only: this does not feed into
 * `monthsToGoal` or `requiredContribution`, which both work in nominal terms
 * — see the README for why that split is deliberate rather than an
 * oversight.
 */
export function todaysPurchasingPower(goal: number, inflation: number, years: number): number {
  return goal / Math.pow(1 + inflation, years)
}

export interface SavingsGoalResult {
  monthlyRate: number
  /** Null when the entered contribution mathematically never reaches the goal. */
  monthsToGoal: number | null
  /** Solved over `years × 12` months — the horizon, not `monthsToGoal`. */
  requiredContribution: number
  purchasingPowerToday: number
}

export function evaluateSavingsGoal(params: SavingsGoalParams): SavingsGoalResult {
  const i = toMonthlyRate(params.expectedReturn, 'EA')
  const horizonMonths = Math.max(0, Math.round(params.years * 12))

  return {
    monthlyRate: i,
    monthsToGoal: monthsToGoal(params.goal, params.monthlyContribution, params.currentSavings, i),
    requiredContribution: requiredContribution(params.goal, params.currentSavings, i, horizonMonths),
    purchasingPowerToday: todaysPurchasingPower(params.goal, params.expectedInflation, params.years),
  }
}

export interface GoalYearRow {
  year: number
  /** Balance projected at `monthlyContribution`. */
  balanceAtContribution: number
  /** Balance projected at the horizon's `requiredContribution`. */
  balanceAtRequired: number
  /** `balanceAtContribution - goal`; negative (shown in parentheses) means short. */
  differenceVsGoal: number
}

/**
 * Year-by-year schedule for the chart and detail table — this feature's
 * horizon is short enough, and the reference itself reports by year, that a
 * month-by-month table would be more granularity than the question needs.
 */
export function buildGoalSchedule(params: SavingsGoalParams): GoalYearRow[] {
  const i = toMonthlyRate(params.expectedReturn, 'EA')
  const horizonMonths = Math.max(0, Math.round(params.years * 12))
  const required = requiredContribution(params.goal, params.currentSavings, i, horizonMonths)

  const rows: GoalYearRow[] = []
  for (let year = 0; year <= params.years; year++) {
    const months = year * 12
    const balanceAtContribution = fv(months, params.monthlyContribution, params.currentSavings, i)
    rows.push({
      year,
      balanceAtContribution,
      balanceAtRequired: fv(months, required, params.currentSavings, i),
      differenceVsGoal: balanceAtContribution - params.goal,
    })
  }
  return rows
}
