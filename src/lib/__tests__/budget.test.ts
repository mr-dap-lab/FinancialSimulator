import { describe, expect, it } from 'vitest'
import {
  buildBudgetRows,
  createBudgetParams,
  evaluateBudget,
  evaluateEarner,
  foodTotal,
  makeCategoryItem,
  safeShare,
  toMonthly,
} from '../budget'

describe('toMonthly', () => {
  it('weekly: 1000 → ≈4,333.33', () => {
    expect(toMonthly(1000, 'weekly')).toBeCloseTo(4333.33, 2)
  })

  it('annual: 1000 → ≈83.33', () => {
    expect(toMonthly(1000, 'annual')).toBeCloseTo(83.33, 2)
  })

  it('semiMonthly: 1000 → 2000 exactly', () => {
    expect(toMonthly(1000, 'semiMonthly')).toBe(2000)
  })
})

describe('evaluateEarner', () => {
  it('with every deduction at 0, netMonthly equals grossMonthly + otherIncomeMonthly', () => {
    const earner = {
      grossAmount: 5000,
      frequency: 'monthly' as const,
      federalWithholding: 0,
      stateWithholding: 0,
      localWithholding: 0,
      otherTaxes: 0,
      fica: 0,
      medicare: 0,
      insuranceBenefits: 0,
      retirementSavings: 0,
      otherIncome: 300,
      otherIncomeFrequency: 'monthly' as const,
    }
    const result = evaluateEarner(earner)
    expect(result.netMonthly).toBeCloseTo(result.grossMonthly + result.otherIncomeMonthly, 6)
    expect(result.netMonthly).toBeCloseTo(5300, 6)
  })
})

describe('evaluateBudget', () => {
  it('availableToSave is negative and unclamped when expenses exceed income', () => {
    const params = createBudgetParams()
    params.primary.grossAmount = 1000
    params.mortgageDebt.housePayment = 5000
    const result = evaluateBudget(params)
    expect(result.availableToSave).toBeLessThan(0)
    expect(result.availableToSave).toBeCloseTo(1000 - 5000, 6)
  })

  it('reference check: every field at 0 except one expense field at 1', () => {
    const params = createBudgetParams()
    params.utilities.electric = 1
    const result = evaluateBudget(params)
    expect(result.totalExpenses).toBe(1)
    expect(result.totalNetIncome).toBe(0)
    expect(result.availableToSave).toBe(-1)
  })
})

describe('extensible expense categories (Prompt 4)', () => {
  it('a custom "Otros" item is included in its category total, totalExpenses, and availableToSave', () => {
    const params = createBudgetParams()
    params.primary.grossAmount = 1000
    params.food.other = [makeCategoryItem('Café', 50)]

    const result = evaluateBudget(params)
    expect(foodTotal(params.food)).toBe(50)
    expect(result.categoryTotals.food).toBe(50)
    expect(result.totalExpenses).toBe(50)
    expect(result.availableToSave).toBeCloseTo(1000 - 50, 6)
  })

  it('a removed custom item disappears from every total immediately', () => {
    const params = createBudgetParams()
    params.food.other = [makeCategoryItem('Café', 50)]
    const withItem = evaluateBudget(params)
    expect(withItem.totalExpenses).toBe(50)

    params.food.other = []
    const withoutItem = evaluateBudget(params)
    expect(withoutItem.totalExpenses).toBe(0)
  })

  it('custom items across every expense category all reach buildBudgetRows', () => {
    const params = createBudgetParams()
    params.mortgageDebt.other = [makeCategoryItem('HOA fee', 10)]
    params.utilities.other = [makeCategoryItem('Propane', 20)]
    params.food.other = [makeCategoryItem('Café', 30)]
    params.insurance.other = [makeCategoryItem('Umbrella policy', 40)]
    params.maintenance.other = [makeCategoryItem('Pool service', 50)]

    const result = evaluateBudget(params)
    const rows = buildBudgetRows(params, result)
    const descriptions = rows.map((row) => row.field)

    expect(descriptions).toEqual(
      expect.arrayContaining(['HOA fee', 'Propane', 'Café', 'Umbrella policy', 'Pool service']),
    )
    expect(result.totalExpenses).toBe(10 + 20 + 30 + 40 + 50)
  })
})

describe('safeShare', () => {
  it('returns 0, not NaN, when the total is 0', () => {
    expect(safeShare(0, 0)).toBe(0)
    expect(safeShare(100, 0)).toBe(0)
    expect(safeShare(-5, 0)).toBe(0)
  })

  it('returns 0, not a negative share, when the total is negative', () => {
    expect(safeShare(100, -50)).toBe(0)
  })

  it('divides normally for a positive total', () => {
    expect(safeShare(25, 100)).toBeCloseTo(0.25, 6)
  })
})
