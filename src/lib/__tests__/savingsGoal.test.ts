import { describe, expect, it } from 'vitest'
import { toMonthlyRate } from '../amortize'
import {
  DEFAULT_SAVINGS_GOAL_PARAMS,
  evaluateSavingsGoal,
  fv,
  monthsToGoal,
  requiredContribution,
} from '../savingsGoal'

describe('fv', () => {
  it('returns the starting balance at month 0, for any contribution or rate', () => {
    expect(fv(0, 500_000, 1_234_567, 0.01)).toBe(1_234_567)
    expect(fv(0, 0, 1_234_567, 0)).toBe(1_234_567)
  })

  it('matches simple linear accumulation when the rate is zero', () => {
    expect(fv(12, 100_000, 50_000, 0)).toBeCloseTo(50_000 + 100_000 * 12, 6)
  })

  it('compounds an annuity-due contribution when the rate is positive', () => {
    const i = 0.01
    const months = 6
    const growth = Math.pow(1 + i, months)
    const expected = 1_000_000 * growth + 50_000 * ((growth - 1) / i) * (1 + i)
    expect(fv(months, 50_000, 1_000_000, i)).toBeCloseTo(expected, 6)
  })
})

describe('requiredContribution', () => {
  it('round-trips through fv within 0.01, at i === 0', () => {
    const required = requiredContribution(10_000_000, 1_000_000, 0, 36)
    expect(fv(36, required, 1_000_000, 0)).toBeCloseTo(10_000_000, 2)
  })

  it('round-trips through fv within 0.01, at i > 0', () => {
    const i = toMonthlyRate(0.08, 'EA')
    const required = requiredContribution(10_000_000, 500_000, i, 48)
    expect(fv(48, required, 500_000, i)).toBeCloseTo(10_000_000, 2)
  })

  it('clamps to 0 when the starting balance alone already clears the goal', () => {
    const i = toMonthlyRate(0.08, 'EA')
    expect(requiredContribution(1_000_000, 50_000_000, i, 12)).toBe(0)
  })
})

describe('monthsToGoal', () => {
  it('is monotonically non-increasing as the contribution increases', () => {
    const i = toMonthlyRate(0.05, 'EA')
    const results = [100_000, 200_000, 300_000, 500_000].map(
      (c) => monthsToGoal(20_000_000, c, 0, i)!,
    )
    for (let index = 1; index < results.length; index++) {
      expect(results[index]).toBeLessThanOrEqual(results[index - 1])
    }
  })

  it('returns null when the goal is mathematically unreachable', () => {
    expect(monthsToGoal(10_000_000, 0, 0, 0)).toBeNull()
    expect(monthsToGoal(10_000_000, -50_000, 500_000, 0)).toBeNull()
  })

  it('returns 0 when the current savings already meet the goal', () => {
    expect(monthsToGoal(1_000_000, 100_000, 1_000_000, 0.01)).toBe(0)
  })
})

describe('reference check — 10,000,000 goal, 5 years, 200,000/month at 0.25% E.A.', () => {
  const params = { ...DEFAULT_SAVINGS_GOAL_PARAMS }
  const i = toMonthlyRate(params.expectedReturn, 'EA')

  it('reaches the goal in about 50 months — "4 años, 2 meses"', () => {
    const months = monthsToGoal(params.goal, params.monthlyContribution, params.currentSavings, i)
    expect(months).not.toBeNull()
    expect(months!).toBeGreaterThanOrEqual(49)
    expect(months!).toBeLessThanOrEqual(51)
  })

  it('requires about 165,610/month to land on the goal at the 5-year horizon', () => {
    const required = requiredContribution(params.goal, params.currentSavings, i, params.years * 12)
    expect(required).toBeGreaterThan(165_610 - 100)
    expect(required).toBeLessThan(165_610 + 100)
  })

  it('evaluateSavingsGoal agrees with the two figures above', () => {
    const result = evaluateSavingsGoal(params)
    expect(result.monthsToGoal).toBeGreaterThanOrEqual(49)
    expect(result.monthsToGoal).toBeLessThanOrEqual(51)
    expect(result.requiredContribution).toBeGreaterThan(165_610 - 100)
    expect(result.requiredContribution).toBeLessThan(165_610 + 100)
  })
})
