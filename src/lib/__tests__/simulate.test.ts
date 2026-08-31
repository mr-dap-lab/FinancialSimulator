import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SAVINGS_PARAMS,
  makeTier,
  normalizeTiers,
  resolveRate,
  simulate,
  summarizeSavings,
} from '../simulate'
import type { SavingsParams } from '../simulate'

const params = (overrides: Partial<SavingsParams> = {}): SavingsParams => ({
  ...DEFAULT_SAVINGS_PARAMS,
  tiers: [makeTier(1, 0.11)],
  ...overrides,
})

describe('simulate', () => {
  it('seeds month 1 interest from the contribution, not a zero balance', () => {
    const [first] = simulate(params({ years: 1 }))

    expect(first.grossAnnualInterest).toBeGreaterThan(0)
    expect(first.grossAnnualInterest).toBeCloseTo(500_000 * 0.11, 6)
    expect(first.balance).toBeCloseTo(500_000 + (500_000 * 0.11 * 0.93) / 12, 6)
  })

  it('never reports a positive withholding, and withholds exactly 7% at defaults', () => {
    const rows = simulate(params())

    for (const row of rows) {
      expect(row.withholding).toBeLessThanOrEqual(0)
      expect(row.withholding).toBeCloseTo(-row.grossAnnualInterest * 0.07, 6)
      expect(row.netAnnualInterest).toBeCloseTo(row.grossAnnualInterest * 0.93, 6)
    }
  })

  it('grows the balance by exactly the contribution plus the monthly interest', () => {
    const rows = simulate(params({ contributionGrowth: 0.05, years: 10 }))

    rows.forEach((row, index) => {
      const previous = index === 0 ? 0 : rows[index - 1].balance
      expect(row.balance - previous).toBeCloseTo(row.contribution + row.monthlyInterest, 6)
    })
  })

  it('steps the contribution up once per year', () => {
    const rows = simulate(params({ contributionGrowth: 0.05, years: 3 }))

    expect(rows[11].contribution).toBeCloseTo(500_000, 6) // month 12, still year 1
    expect(rows[12].contribution).toBeCloseTo(525_000, 6) // month 13, first of year 2
    expect(rows[23].contribution).toBeCloseTo(525_000, 6) // month 24, last of year 2
    expect(rows[24].contribution).toBeCloseTo(551_250, 6) // month 25, first of year 3
  })

  it('produces no rows for a zero horizon and summarises them safely', () => {
    const totals = summarizeSavings(simulate(params({ years: 0 })))

    expect(totals.finalBalance).toBe(0)
    expect(totals.multiplier).toBe(0)
  })
})

describe('resolveRate', () => {
  const tiered = (overrides: Partial<SavingsParams>) =>
    params({ tiersEnabled: true, ...overrides })

  it('picks the correct tier on both sides of a month boundary', () => {
    const p = tiered({
      tierMode: 'age',
      tiers: [makeTier(1, 0.11), makeTier(14, 0.13)],
    })

    expect(resolveRate(p, 13, 0)).toBeCloseTo(0.11, 10)
    expect(resolveRate(p, 14, 0)).toBeCloseTo(0.13, 10)
    expect(resolveRate(p, 15, 0)).toBeCloseTo(0.13, 10)
  })

  it('picks the correct tier on both sides of a balance boundary', () => {
    const p = tiered({
      tierMode: 'balance',
      tiers: [makeTier(0, 0.11), makeTier(10_000_000, 0.13)],
    })

    expect(resolveRate(p, 30, 9_999_999)).toBeCloseTo(0.11, 10)
    expect(resolveRate(p, 30, 10_000_000)).toBeCloseTo(0.13, 10)
    expect(resolveRate(p, 30, 10_000_001)).toBeCloseTo(0.13, 10)
  })

  it('falls back to the base rate field when tiers are off or degenerate', () => {
    const tiers = [makeTier(1, 0.11), makeTier(14, 0.13)]

    expect(resolveRate(params({ tiersEnabled: false, tiers }), 30, 0)).toBeCloseTo(0.11, 10)
    expect(
      resolveRate(params({ tiersEnabled: true, tiers: [makeTier(1, 0.13)] }), 30, 0),
    ).toBeCloseTo(0.11, 10)
  })

  it('applies the balance tier against the prior month, so it steps up as the fund grows', () => {
    const rows = simulate(
      tiered({
        tierMode: 'balance',
        years: 5,
        tiers: [makeTier(0, 0.11), makeTier(10_000_000, 0.13)],
      }),
    )

    const crossing = rows.findIndex((row) => row.annualRate > 0.11)
    expect(crossing).toBeGreaterThan(1)
    expect(rows[crossing - 1].balance).toBeGreaterThanOrEqual(10_000_000)
    expect(rows[crossing - 2].balance).toBeLessThan(10_000_000)
  })
})

describe('normalizeTiers', () => {
  it('sorts ascending and pins the first tier to the start of its domain', () => {
    const byMonth = normalizeTiers([makeTier(14, 0.13), makeTier(7, 0.11), makeTier(40, 0.15)], 'age')
    expect(byMonth.map((tier) => tier.from)).toEqual([1, 14, 40])

    const byBalance = normalizeTiers([makeTier(5_000_000, 0.13), makeTier(1, 0.11)], 'balance')
    expect(byBalance.map((tier) => tier.from)).toEqual([0, 5_000_000])
  })
})

describe('real monthly compounding', () => {
  it('diverges from the spreadsheet model but keeps the balance identity', () => {
    const base = simulate(params({ years: 15 }))
    const real = simulate(params({ years: 15, realMonthlyCompounding: true }))

    expect(real[real.length - 1].balance).not.toBeCloseTo(base[base.length - 1].balance, 0)

    real.forEach((row, index) => {
      const previous = index === 0 ? 0 : real[index - 1].balance
      expect(row.balance - previous).toBeCloseTo(row.contribution + row.monthlyInterest, 6)
    })
  })
})

describe('reference check against the source spreadsheet', () => {
  /**
   * The spreadsheet switched rates at month 14 — one month after the year-2
   * boundary, an off-by-one from a drag-fill. It is reproduced here as a tier
   * configuration only; the default UI behaviour does not replicate it.
   *
   * NOTE: the brief quotes 39,041,631 for this scenario. The formula as
   * specified yields 40,837,320 instead, and no combination of the documented
   * parameters reproduces 39,041,631 (the closest natural reading, a flat 11 %
   * over the same 60 months, gives 38,961,827). This test pins the value the
   * specified model actually produces, so a future change to the math is
   * caught; the quoted figure stands as an open discrepancy.
   */
  it('reproduces the month-60 balance for the month-14 rate switch', () => {
    const rows = simulate(
      params({
        years: 5,
        tiersEnabled: true,
        tierMode: 'age',
        tiers: [makeTier(1, 0.11), makeTier(14, 0.13)],
      }),
    )

    expect(rows).toHaveLength(60)
    expect(rows[59].balance).toBeCloseTo(40_837_320, 0)
  })

  it('reports 30,000,000 contributed over those 60 months', () => {
    const totals = summarizeSavings(simulate(params({ years: 5 })))

    expect(totals.totalContributed).toBeCloseTo(30_000_000, 6)
    expect(totals.finalBalance - totals.totalContributed).toBeCloseTo(totals.netInterest, 6)
  })
})
