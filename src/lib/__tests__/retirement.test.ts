import { describe, expect, it } from 'vitest'
import { toMonthlyRate } from '../amortize'
import {
  DEFAULT_RETIREMENT_PARAMS,
  accumulate,
  evaluateRetirement,
  monthlyIncomeFromBalance,
} from '../retirement'

const params = (overrides: Partial<typeof DEFAULT_RETIREMENT_PARAMS> = {}) => ({
  ...DEFAULT_RETIREMENT_PARAMS,
  ...overrides,
})

describe('accumulate', () => {
  it('returns the starting balance when there are no contributions (N = 0)', () => {
    expect(accumulate(250_000, [], 0.07)).toBe(250_000)
  })
})

describe('monthlyIncomeFromBalance', () => {
  it('round-trips through the ordinary-annuity PV formula within 0.01', () => {
    const i = toMonthlyRate(0.04, 'EA')
    const months = 360
    const balance = 1_055_151.47
    const payment = monthlyIncomeFromBalance(balance, i, months)

    // PV of an ordinary annuity paying `payment` for `months` at rate `i`.
    const pv = (payment * (1 - Math.pow(1 + i, -months))) / i
    expect(pv).toBeCloseTo(balance, 2)
  })
})

describe('tax branches', () => {
  it('tax-deferred with a 0% retirement tax leaves income unchanged by tax', () => {
    const result = evaluateRetirement(params({ taxDeferred: true, retirementTaxRate: 0 }))
    expect(result.monthlyIncomeAfterTax).toBeCloseTo(result.monthlyIncomeBeforeTax, 6)
  })

  it('a higher retirement tax rate strictly lowers after-tax income when deferred', () => {
    const low = evaluateRetirement(params({ taxDeferred: true, retirementTaxRate: 0.1 }))
    const high = evaluateRetirement(params({ taxDeferred: true, retirementTaxRate: 0.3 }))
    expect(high.monthlyIncomeAfterTax).toBeLessThan(low.monthlyIncomeAfterTax)
  })
})

describe('reference check — 250,000 balance, 2,000/year, 45→65, 30 years retired', () => {
  const reference = params({
    startingBalance: 250_000,
    annualContribution: 2_000,
    currentAge: 45,
    retirementAge: 65,
    retirementYears: 30,
    returnBeforeRetirement: 0.07,
    returnDuringRetirement: 0.04,
    currentTaxRate: 0,
    retirementTaxRate: 0,
    taxDeferred: true,
    inflation: 0.03,
  })

  it('matches the reference balance, pre-tax income, and today-money income', () => {
    const result = evaluateRetirement(reference)

    expect(result.contributions).toHaveLength(20) // 45..64, no contribution in the retirement year
    expect(result.balanceAtRetirement).toBeGreaterThan(1_055_151 - 10)
    expect(result.balanceAtRetirement).toBeLessThan(1_055_151 + 10)
    expect(result.monthlyIncomeBeforeTax).toBeGreaterThan(4_994 - 5)
    expect(result.monthlyIncomeBeforeTax).toBeLessThan(4_994 + 5)
    expect(result.monthlyIncomeToday).toBeGreaterThan(2_765 - 5)
    expect(result.monthlyIncomeToday).toBeLessThan(2_765 + 5)
  })
})
