import { describe, expect, it } from 'vitest'
import { IMPORT_FIELD_IDS } from '../../../api/_lib/importFields'
import {
  IMPORT_FIELDS,
  categorize,
  diffProposal,
  monthsBetween,
  proposeMonthly,
  toImportItems,
} from '../bankImport'
import type { ImportFieldId } from '../bankImport'

describe('server allowlist', () => {
  it('matches the fields the client can import, so nothing is silently rejected or accepted', () => {
    expect([...IMPORT_FIELD_IDS]).toEqual([...IMPORT_FIELDS])
  })
})

describe('categorize', () => {
  it.each<[string, ImportFieldId | null]>([
    ['COMPRA ALMACENES EXITO', 'food.groceries'],
    ['Compra Éxito Express', 'food.groceries'], // accents and case are ignored
    ['COMPRA D1 SUBA', 'food.groceries'],
    ['RAPPI DOMICILIOS', 'food.groceries'],
    ['PAGO ARRIENDO OCTUBRE', 'mortgageDebt.housePayment'],
    ['PAGO CODENSA ENERGIA', 'utilities.electric'],
    ['ACUEDUCTO DE BOGOTA', 'utilities.water'],
    ['CLARO MOVIL', 'utilities.phone'],
    ['NETFLIX.COM', 'maintenance.entertainment'],
    ['COMPRA DROGUERIA CRUZ VERDE', 'maintenance.medical'],
    ['TERPEL ESTACION 12', 'food.gasAndMaintenance'],
    ['SOAT SEGUROS BOLIVAR', 'insurance.autoInsurance'],
    ['SEGURO DE VIDA', 'insurance.lifeInsurance'],
    ['PAGO TARJETA DE CREDITO', 'mortgageDebt.creditCardPayments'],
    ['TRANSFERENCIA A JUAN', null],
    ['', null],
  ])('%s → %s', (description, expected) => {
    expect(categorize(description)).toBe(expected)
  })

  it('does not match a keyword inside a longer word', () => {
    expect(categorize('PARADA DE LA ARAUCANA')).toBeNull() // "ARA" is a supermarket, "ARAUCANA" is not
    expect(categorize('CLAROSCURO')).toBeNull()
  })

  it('prefers the specific rule over the broad one', () => {
    // "SEGURO DE VIDA" must not fall through to anything broader.
    expect(categorize('SEGURO DE VIDA FALABELLA')).toBe('insurance.lifeInsurance')
  })
})

describe('toImportItems', () => {
  it('keeps only money out, as positive amounts, with the keyword guess', () => {
    const items = toImportItems([
      { date: '2026-10-02', description: 'COMPRA EXITO', amount: -380000, direction: 'debit' },
      { date: '2026-10-25', description: 'PAGO NOMINA', amount: 6000000, direction: 'credit' },
      { date: '2026-10-26', description: 'TRANSFERENCIA A JUAN', amount: -200000, direction: 'debit' },
    ])
    expect(items).toEqual([
      { id: 0, date: '2026-10-02', description: 'COMPRA EXITO', amount: 380000, field: 'food.groceries' },
      { id: 2, date: '2026-10-26', description: 'TRANSFERENCIA A JUAN', amount: 200000, field: null },
    ])
  })
})

describe('monthsBetween', () => {
  it('counts the window inclusively, in average months', () => {
    expect(monthsBetween('2026-08-01', '2026-10-30')).toBeCloseTo(91 / 30.4375, 6)
  })

  it('never goes below one month, so a short window is not inflated', () => {
    expect(monthsBetween('2026-10-01', '2026-10-07')).toBe(1)
  })
})

describe('proposeMonthly', () => {
  const item = (id: number, field: ImportFieldId | null, amount: number) => ({
    id,
    date: '2026-10-01',
    description: 'x',
    amount,
    field,
  })

  it('divides each field total by the months and rounds to whole units', () => {
    const proposal = proposeMonthly(
      [item(0, 'food.groceries', 100000), item(1, 'food.groceries', 50000), item(2, 'utilities.electric', 100001)],
      3,
    )
    expect(proposal).toEqual({ 'food.groceries': 50000, 'utilities.electric': 33334 })
  })

  it('ignores unassigned movements entirely', () => {
    expect(proposeMonthly([item(0, null, 999999)], 1)).toEqual({})
  })
})

describe('diffProposal', () => {
  const current = Object.fromEntries(IMPORT_FIELDS.map((field) => [field, 0])) as Record<ImportFieldId, number>

  it('lists only fields that would change, in the app field order', () => {
    const changes = diffProposal(
      { 'utilities.electric': 140000, 'food.groceries': 500000, 'utilities.gas': 0 },
      { ...current, 'food.groceries': 500000 },
    )
    expect(changes).toEqual([{ field: 'utilities.electric', before: 0, after: 140000 }])
  })

  it('reports the previous value so the change can be audited and shown as before → after', () => {
    expect(diffProposal({ 'food.groceries': 300 }, { ...current, 'food.groceries': 100 })).toEqual([
      { field: 'food.groceries', before: 100, after: 300 },
    ])
  })
})
