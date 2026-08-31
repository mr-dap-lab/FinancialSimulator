import { describe, expect, it } from 'vitest'
import { clamp, parseDecimal, parseInteger } from '../format'

describe('clamp', () => {
  it('bounds a value to the given range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(50, 0, 10)).toBe(10)
  })

  it('falls back to min for NaN or Infinity rather than propagating them', () => {
    expect(clamp(NaN, 1, 40)).toBe(1)
    expect(clamp(Infinity, 1, 40)).toBe(1)
    expect(clamp(-Infinity, 1, 40)).toBe(1)
  })
})

describe('parseInteger', () => {
  it('strips everything but digits', () => {
    expect(parseInteger('1.234.567')).toBe(1234567)
    expect(parseInteger('abc')).toBe(0)
  })

  it('never returns a non-finite result, even from a pathologically long paste', () => {
    const huge = '9'.repeat(400)
    expect(Number.isFinite(parseInteger(huge))).toBe(true)
  })
})

describe('parseDecimal', () => {
  it('rejects non-finite input', () => {
    expect(parseDecimal('1e999')).toBeNull()
    expect(parseDecimal('')).toBeNull()
  })

  it('accepts either decimal separator', () => {
    expect(parseDecimal('11,5')).toBeCloseTo(11.5, 6)
    expect(parseDecimal('11.5')).toBeCloseTo(11.5, 6)
  })
})
