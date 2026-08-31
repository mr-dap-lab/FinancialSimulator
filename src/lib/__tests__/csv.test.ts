import { describe, expect, it } from 'vitest'
import { csvRow } from '../csv'

describe('csvRow — formula injection', () => {
  it('prefixes a cell starting with =, +, -, or @ with an apostrophe', () => {
    expect(csvRow(['=SUM(A1:A2)'])).toBe("'=SUM(A1:A2)")
    expect(csvRow(['+1234'])).toBe("'+1234")
    expect(csvRow(['@cmd'])).toBe("'@cmd")
  })

  it('also sanitises a plain negative number, since it is written as text', () => {
    expect(csvRow([-1234.5])).toBe("'-1234.5")
  })

  it('leaves an ordinary cell untouched', () => {
    expect(csvRow(['Aporte mensual', 500_000])).toBe('Aporte mensual,500000')
  })

  it('still quotes a cell containing a comma, after sanitising it', () => {
    expect(csvRow(['=1,2'])).toBe('"\'=1,2"')
  })
})
