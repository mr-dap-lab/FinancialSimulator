/**
 * Turns bank movements into a proposed monthly budget (feature: "Importar
 * desde Bancolombia" in Mi Presupuesto).
 *
 * Pure and UI-free. The model is deliberately plain: only money OUT is
 * considered, each movement is assigned to ONE budget field (by keyword, then
 * editable by the user), and the proposal for a field is its total over the
 * window divided by the months the window spans.
 */
import type { BankTransaction, ImportChange } from './bankTypes'

/** The fixed expense fields an import can fill. Custom "Otros" rows are never touched. */
export const IMPORT_FIELDS = [
  'mortgageDebt.housePayment',
  'mortgageDebt.autoPayment',
  'mortgageDebt.autoPayment2',
  'mortgageDebt.creditCardPayments',
  'mortgageDebt.otherDebtPayments',
  'utilities.electric',
  'utilities.gas',
  'utilities.water',
  'utilities.cable',
  'utilities.phone',
  'utilities.internet',
  'food.groceries',
  'food.gasAndMaintenance',
  'food.generalMerchandise',
  'food.charitableDonations',
  'food.religiousDonations',
  'insurance.autoInsurance',
  'insurance.lifeInsurance',
  'insurance.healthInsurance',
  'insurance.homeInsurance',
  'maintenance.homeMaintenance',
  'maintenance.medical',
  'maintenance.childcare',
  'maintenance.clothing',
  'maintenance.entertainment',
] as const

export type ImportFieldId = (typeof IMPORT_FIELDS)[number]

export const isImportField = (value: string): value is ImportFieldId =>
  (IMPORT_FIELDS as readonly string[]).includes(value)

export function splitField(id: ImportFieldId): { section: string; field: string } {
  const [section, field] = id.split('.')
  return { section, field }
}

/** Uppercase, accent-free, single-spaced: what the keyword rules match against. */
function normalize(description: string): string {
  return description
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * First match wins, so the specific rules (a mortgage, an insurance policy)
 * come before the broad ones (a supermarket). Colombian merchants and the
 * wording Bancolombia uses. Anything unmatched stays unassigned for the user.
 */
const RULES: readonly (readonly [ImportFieldId, RegExp])[] = [
  ['mortgageDebt.housePayment', /\b(ARRIENDO|HIPOTECA|CREDITO HIPOTECARIO|LEASING HABITACIONAL|ADMINISTRACION (CONJUNTO|EDIFICIO))\b/],
  ['mortgageDebt.autoPayment', /\b(CREDITO (DE )?VEHICULO|LEASING VEHICULO|CREDITO AUTO)\b/],
  ['mortgageDebt.creditCardPayments', /\b(PAGO TARJETA|ABONO TARJETA|PAGO TC|PAGO TARJETA DE CREDITO)\b/],
  ['mortgageDebt.otherDebtPayments', /\b(PAGO CREDITO|CUOTA PRESTAMO|CREDITO LIBRE INVERSION|PAGO PRESTAMO)\b/],

  ['insurance.autoInsurance', /\b(SOAT|SEGURO (DE )?(VEHICULO|AUTO))\b/],
  ['insurance.lifeInsurance', /\bSEGURO (DE )?VIDA\b/],
  ['insurance.homeInsurance', /\bSEGURO (DE )?(HOGAR|VIVIENDA)\b/],
  ['insurance.healthInsurance', /\b(COLSANITAS|MEDPLUS|MEDICINA PREPAGADA|POLIZA SALUD|COOMEVA)\b/],

  ['utilities.electric', /\b(CODENSA|ENEL|CELSIA|AIR-?E|ENERGIA)\b/],
  ['utilities.gas', /\b(VANTI|GAS NATURAL|GASES DE)\b/],
  ['utilities.water', /\b(ACUEDUCTO|AGUAS DE|EAAB)\b/],
  ['utilities.cable', /\b(DIRECTV|CABLE|CLARO TV)\b/],
  ['utilities.internet', /\b(INTERNET|FIBRA|ETB)\b/],
  ['utilities.phone', /\b(CLARO|MOVISTAR|TIGO|WOM|ETB MOVIL)\b/],

  ['maintenance.entertainment', /\b(NETFLIX|SPOTIFY|DISNEY|HBO|PRIME VIDEO|AMAZON PRIME|YOUTUBE|CINEMARK|CINE COLOMBIA|CINECOLOMBIA|STEAM|TEATRO)\b/],
  ['maintenance.medical', /\b(DROGUERIA|FARMACIA|CRUZ VERDE|LOCATEL|FARMATODO|CLINICA|HOSPITAL|LABORATORIO|CONSULTORIO)\b/],
  ['maintenance.childcare', /\b(JARDIN INFANTIL|GUARDERIA|COLEGIO|NINERA)\b/],
  ['maintenance.clothing', /\b(ZARA|ARTURO CALLE|KOAJ|BOSI|ADIDAS|NIKE|CALZADO|ROPA)\b/],
  ['maintenance.homeMaintenance', /\b(HOMECENTER|SODIMAC|EASY|FERRETERIA)\b/],

  ['food.gasAndMaintenance', /\b(TERPEL|PRIMAX|BIOMAX|ESSO|GASOLINA|PARQUEADERO|PEAJE)\b/],
  ['food.charitableDonations', /\b(DONACION|FUNDACION)\b/],
  ['food.religiousDonations', /\b(IGLESIA|DIEZMO|PARROQUIA)\b/],
  [
    'food.groceries',
    /\b(EXITO|CARULLA|JUMBO|OLIMPICA|D1|ARA|PRICESMART|MAKRO|SURTIMAX|RAPPI|DOMICILIOS?|IFOOD|RESTAURANTE|MCDONALD'?S?|KFC|FRISBY|STARBUCKS|JUAN VALDEZ|PIZZA|PANADERIA)\b/,
  ],
  ['food.generalMerchandise', /\b(MERCADO ?LIBRE|AMAZON|ALKOSTO|FALABELLA|PANAMERICANA)\b/],
]

export function categorize(description: string): ImportFieldId | null {
  const text = normalize(description)
  for (const [field, pattern] of RULES) {
    if (pattern.test(text)) return field
  }
  return null
}

export interface ImportItem {
  /** Stable within one import: its index in the fetched list. */
  id: number
  date: string
  description: string
  /** Always positive: how much left the account. */
  amount: number
  /** What the user (or the keyword rules) assigned it to; null = left out of the import. */
  field: ImportFieldId | null
}

/** Only money out becomes a budget proposal; each movement starts with its keyword guess. */
export function toImportItems(transactions: BankTransaction[]): ImportItem[] {
  const items: ImportItem[] = []
  transactions.forEach((transaction, index) => {
    if (transaction.direction !== 'debit') return
    items.push({
      id: index,
      date: transaction.date,
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      field: categorize(transaction.description),
    })
  })
  return items
}

const DAY_MS = 24 * 60 * 60 * 1000
const AVERAGE_MONTH_DAYS = 30.4375

/** Months spanned by an inclusive `yyyy-mm-dd` window — never below one, so a short window is not inflated. */
export function monthsBetween(from: string, to: string): number {
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1
  return Math.max(1, days / AVERAGE_MONTH_DAYS)
}

/** Monthly amount per field: total over the window ÷ months, rounded to whole currency units. */
export function proposeMonthly(items: ImportItem[], months: number): Partial<Record<ImportFieldId, number>> {
  const totals: Partial<Record<ImportFieldId, number>> = {}
  for (const item of items) {
    if (item.field) totals[item.field] = (totals[item.field] ?? 0) + item.amount
  }
  const proposal: Partial<Record<ImportFieldId, number>> = {}
  for (const field of IMPORT_FIELDS) {
    const total = totals[field]
    if (total !== undefined) proposal[field] = Math.round(total / months)
  }
  return proposal
}

/** Only the fields whose value would actually change, in the app's own field order. */
export function diffProposal(
  proposal: Partial<Record<ImportFieldId, number>>,
  current: Record<ImportFieldId, number>,
): ImportChange[] {
  const changes: ImportChange[] = []
  for (const field of IMPORT_FIELDS) {
    const after = proposal[field]
    if (after !== undefined && after !== current[field]) {
      changes.push({ field, before: current[field], after })
    }
  }
  return changes
}
