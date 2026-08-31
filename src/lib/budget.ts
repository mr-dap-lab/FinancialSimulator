/**
 * Home budget model (feature: Mi Presupuesto).
 *
 * Pure and UI-free — no React, no DOM, no imports from `src/features`.
 *
 * Unlike every other feature in this app, there is almost no compounding math
 * here: this is unit normalisation (different pay frequencies → one monthly
 * figure) and summation. The one real subtlety is that two different
 * quantities are both, informally, "net income" — see the doc on
 * `buildIncomeChartSlices` for why they are not the same number.
 */

export type PayFrequency = 'weekly' | 'biweekly' | 'semiMonthly' | 'monthly' | 'quarterly' | 'annual'

/** How many times a year each frequency pays, divided by 12 to land on a monthly multiplier. */
export const FREQUENCY_MULTIPLIER: Record<PayFrequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semiMonthly: 24 / 12,
  monthly: 1,
  quarterly: 4 / 12,
  annual: 1 / 12,
}

export const PAY_FREQUENCIES: PayFrequency[] = [
  'weekly',
  'biweekly',
  'semiMonthly',
  'monthly',
  'quarterly',
  'annual',
]

export function toMonthly(amount: number, frequency: PayFrequency): number {
  return amount * FREQUENCY_MULTIPLIER[frequency]
}

export interface EarnerIncome {
  grossAmount: number
  frequency: PayFrequency
  federalWithholding: number
  stateWithholding: number
  localWithholding: number
  otherTaxes: number
  fica: number
  medicare: number
  insuranceBenefits: number
  retirementSavings: number
  /** Its own frequency — a bonus or side income often doesn't share the salary's cadence. */
  otherIncome: number
  otherIncomeFrequency: PayFrequency
}

export const createEarnerIncome = (): EarnerIncome => ({
  grossAmount: 0,
  frequency: 'monthly',
  federalWithholding: 0,
  stateWithholding: 0,
  localWithholding: 0,
  otherTaxes: 0,
  fica: 0,
  medicare: 0,
  insuranceBenefits: 0,
  retirementSavings: 0,
  otherIncome: 0,
  otherIncomeFrequency: 'monthly',
})

export interface EarnerMonthly {
  grossMonthly: number
  federalWithholding: number
  stateWithholding: number
  localWithholding: number
  otherTaxes: number
  fica: number
  medicare: number
  insuranceBenefits: number
  retirementSavings: number
  totalDeductions: number
  otherIncomeMonthly: number
  netMonthly: number
}

export function evaluateEarner(earner: EarnerIncome): EarnerMonthly {
  const grossMonthly = toMonthly(earner.grossAmount, earner.frequency)
  const federalWithholding = toMonthly(earner.federalWithholding, earner.frequency)
  const stateWithholding = toMonthly(earner.stateWithholding, earner.frequency)
  const localWithholding = toMonthly(earner.localWithholding, earner.frequency)
  const otherTaxes = toMonthly(earner.otherTaxes, earner.frequency)
  const fica = toMonthly(earner.fica, earner.frequency)
  const medicare = toMonthly(earner.medicare, earner.frequency)
  const insuranceBenefits = toMonthly(earner.insuranceBenefits, earner.frequency)
  const retirementSavings = toMonthly(earner.retirementSavings, earner.frequency)
  const otherIncomeMonthly = toMonthly(earner.otherIncome, earner.otherIncomeFrequency)

  const totalDeductions =
    federalWithholding +
    stateWithholding +
    localWithholding +
    otherTaxes +
    fica +
    medicare +
    insuranceBenefits +
    retirementSavings

  return {
    grossMonthly,
    federalWithholding,
    stateWithholding,
    localWithholding,
    otherTaxes,
    fica,
    medicare,
    insuranceBenefits,
    retirementSavings,
    totalDeductions,
    otherIncomeMonthly,
    netMonthly: grossMonthly - totalDeductions + otherIncomeMonthly,
  }
}

/**
 * One free-text row in an expense category's repeatable "Otros" list —
 * every category below has one, not just Maintenance, so this is generic
 * rather than named after any single category.
 */
export interface CategoryItem {
  id: string
  description: string
  amount: number
}

let itemSeq = 0
export const nextCategoryItemId = (): string => 'category-item-' + ++itemSeq

export const makeCategoryItem = (description: string, amount: number): CategoryItem => ({
  id: nextCategoryItemId(),
  description,
  amount,
})

export interface MortgageDebt {
  housePayment: number
  autoPayment: number
  autoPayment2: number
  creditCardPayments: number
  otherDebtPayments: number
  other: CategoryItem[]
}

export const createMortgageDebt = (): MortgageDebt => ({
  housePayment: 0,
  autoPayment: 0,
  autoPayment2: 0,
  creditCardPayments: 0,
  otherDebtPayments: 0,
  other: [],
})

export interface Utilities {
  electric: number
  gas: number
  water: number
  cable: number
  phone: number
  internet: number
  other: CategoryItem[]
}

export const createUtilities = (): Utilities => ({
  electric: 0,
  gas: 0,
  water: 0,
  cable: 0,
  phone: 0,
  internet: 0,
  other: [],
})

export interface FoodExpenses {
  groceries: number
  gasAndMaintenance: number
  generalMerchandise: number
  charitableDonations: number
  religiousDonations: number
  other: CategoryItem[]
}

export const createFoodExpenses = (): FoodExpenses => ({
  groceries: 0,
  gasAndMaintenance: 0,
  generalMerchandise: 0,
  charitableDonations: 0,
  religiousDonations: 0,
  other: [],
})

export interface InsuranceExpenses {
  autoInsurance: number
  lifeInsurance: number
  healthInsurance: number
  homeInsurance: number
  other: CategoryItem[]
}

export const createInsuranceExpenses = (): InsuranceExpenses => ({
  autoInsurance: 0,
  lifeInsurance: 0,
  healthInsurance: 0,
  homeInsurance: 0,
  other: [],
})

export interface MaintenanceExpenses {
  homeMaintenance: number
  medical: number
  childcare: number
  clothing: number
  entertainment: number
  other: CategoryItem[]
}

export const createMaintenanceExpenses = (): MaintenanceExpenses => ({
  homeMaintenance: 0,
  medical: 0,
  childcare: 0,
  clothing: 0,
  entertainment: 0,
  other: [],
})

export interface BudgetParams {
  primary: EarnerIncome
  spouse: EarnerIncome
  mortgageDebt: MortgageDebt
  utilities: Utilities
  food: FoodExpenses
  insurance: InsuranceExpenses
  maintenance: MaintenanceExpenses
}

export const createBudgetParams = (): BudgetParams => ({
  primary: createEarnerIncome(),
  spouse: createEarnerIncome(),
  mortgageDebt: createMortgageDebt(),
  utilities: createUtilities(),
  food: createFoodExpenses(),
  insurance: createInsuranceExpenses(),
  maintenance: createMaintenanceExpenses(),
})

const otherItemsTotal = (items: CategoryItem[]): number =>
  items.reduce((sum, item) => sum + item.amount, 0)

export const mortgageDebtTotal = (m: MortgageDebt): number =>
  m.housePayment +
  m.autoPayment +
  m.autoPayment2 +
  m.creditCardPayments +
  m.otherDebtPayments +
  otherItemsTotal(m.other)

export const utilitiesTotal = (u: Utilities): number =>
  u.electric + u.gas + u.water + u.cable + u.phone + u.internet + otherItemsTotal(u.other)

export const foodTotal = (f: FoodExpenses): number =>
  f.groceries +
  f.gasAndMaintenance +
  f.generalMerchandise +
  f.charitableDonations +
  f.religiousDonations +
  otherItemsTotal(f.other)

export const insuranceTotal = (i: InsuranceExpenses): number =>
  i.autoInsurance + i.lifeInsurance + i.healthInsurance + i.homeInsurance + otherItemsTotal(i.other)

export const maintenanceTotal = (m: MaintenanceExpenses): number =>
  m.homeMaintenance +
  m.medical +
  m.childcare +
  m.clothing +
  m.entertainment +
  otherItemsTotal(m.other)

export interface CategoryTotals {
  mortgageDebt: number
  utilities: number
  food: number
  insurance: number
  maintenance: number
}

export interface BudgetResult {
  primary: EarnerMonthly
  spouse: EarnerMonthly
  totalNetIncome: number
  categoryTotals: CategoryTotals
  totalExpenses: number
  /** Can be negative — never clamped, unlike a typical "remaining budget" figure. */
  availableToSave: number
}

export function evaluateBudget(params: BudgetParams): BudgetResult {
  const primary = evaluateEarner(params.primary)
  const spouse = evaluateEarner(params.spouse)
  const totalNetIncome = primary.netMonthly + spouse.netMonthly

  const categoryTotals: CategoryTotals = {
    mortgageDebt: mortgageDebtTotal(params.mortgageDebt),
    utilities: utilitiesTotal(params.utilities),
    food: foodTotal(params.food),
    insurance: insuranceTotal(params.insurance),
    maintenance: maintenanceTotal(params.maintenance),
  }

  const totalExpenses =
    categoryTotals.mortgageDebt +
    categoryTotals.utilities +
    categoryTotals.food +
    categoryTotals.insurance +
    categoryTotals.maintenance

  return {
    primary,
    spouse,
    totalNetIncome,
    categoryTotals,
    totalExpenses,
    availableToSave: totalNetIncome - totalExpenses,
  }
}

/** `0` rather than `NaN` when `total` is zero or negative — a chart slice with nothing to divide by. */
export function safeShare(part: number, total: number): number {
  if (total <= 0) return 0
  return part / total
}

export interface ChartSlice {
  key: string
  value: number
}

/**
 * One wedge per expense category, plus a final "available to save" wedge.
 * A donut cannot show a negative wedge, so a negative `availableToSave` is
 * floored to 0 here for the chart only — the real signed figure still drives
 * the headline sentence and the summary card, this floor is display-only.
 */
export function buildExpenseChartSlices(result: BudgetResult): ChartSlice[] {
  return [
    { key: 'mortgageDebt', value: result.categoryTotals.mortgageDebt },
    { key: 'utilities', value: result.categoryTotals.utilities },
    { key: 'food', value: result.categoryTotals.food },
    { key: 'insurance', value: result.categoryTotals.insurance },
    { key: 'maintenance', value: result.categoryTotals.maintenance },
    { key: 'availableToSave', value: Math.max(0, result.availableToSave) },
  ]
}

/**
 * One wedge per deduction type, combining FICA and Medicare into one
 * "ficaAndHealth" wedge (matching the reference), plus a final "net income"
 * wedge — based on *combined gross income from both earners*.
 *
 * This "net income" is deliberately a different number from
 * `BudgetResult.totalNetIncome`: this donut decomposes gross salary alone, so
 * its remainder excludes each earner's `otherIncome` (a bonus was never part
 * of the gross being sliced up). `totalNetIncome` — the headline and summary
 * card figure — includes it. Two real, differently-scoped quantities, not a
 * rounding mismatch between them.
 */
export function buildIncomeChartSlices(result: BudgetResult): ChartSlice[] {
  const combined = (pick: (earner: EarnerMonthly) => number) =>
    pick(result.primary) + pick(result.spouse)

  const combinedGross = combined((earner) => earner.grossMonthly)
  const federal = combined((earner) => earner.federalWithholding)
  const state = combined((earner) => earner.stateWithholding)
  const local = combined((earner) => earner.localWithholding)
  const otherTaxes = combined((earner) => earner.otherTaxes)
  const ficaAndHealth = combined((earner) => earner.fica + earner.medicare)
  const insuranceBenefits = combined((earner) => earner.insuranceBenefits)
  const retirementSavings = combined((earner) => earner.retirementSavings)

  const netRemainder = Math.max(
    0,
    combinedGross - federal - state - local - otherTaxes - ficaAndHealth - insuranceBenefits - retirementSavings,
  )

  return [
    { key: 'federal', value: federal },
    { key: 'state', value: state },
    { key: 'local', value: local },
    { key: 'otherTaxes', value: otherTaxes },
    { key: 'ficaAndHealth', value: ficaAndHealth },
    { key: 'insuranceBenefits', value: insuranceBenefits },
    { key: 'retirementSavings', value: retirementSavings },
    { key: 'netIncome', value: netRemainder },
  ]
}

/** One row per non-zero input field, grouped by section — a plain-language audit of the totals above. */
export interface BudgetRow {
  section: string
  field: string
  monthlyAmount: number
}

function earnerRows(section: string, monthly: EarnerMonthly): BudgetRow[] {
  const rows: BudgetRow[] = []
  const push = (field: string, amount: number) => {
    if (amount !== 0) rows.push({ section, field, monthlyAmount: amount })
  }
  push('grossAmount', monthly.grossMonthly)
  push('federalWithholding', monthly.federalWithholding)
  push('stateWithholding', monthly.stateWithholding)
  push('localWithholding', monthly.localWithholding)
  push('otherTaxes', monthly.otherTaxes)
  push('fica', monthly.fica)
  push('medicare', monthly.medicare)
  push('insuranceBenefits', monthly.insuranceBenefits)
  push('retirementSavings', monthly.retirementSavings)
  push('otherIncome', monthly.otherIncomeMonthly)
  return rows
}

export function buildBudgetRows(params: BudgetParams, result: BudgetResult): BudgetRow[] {
  const rows: BudgetRow[] = [
    ...earnerRows('primaryIncome', result.primary),
    ...earnerRows('spouseIncome', result.spouse),
  ]

  const push = (section: string, field: string, amount: number) => {
    if (amount !== 0) rows.push({ section, field, monthlyAmount: amount })
  }

  const pushOtherItems = (section: string, items: CategoryItem[]) => {
    for (const item of items) {
      if (item.amount !== 0) {
        rows.push({ section, field: item.description || item.id, monthlyAmount: item.amount })
      }
    }
  }

  push('mortgageDebt', 'housePayment', params.mortgageDebt.housePayment)
  push('mortgageDebt', 'autoPayment', params.mortgageDebt.autoPayment)
  push('mortgageDebt', 'autoPayment2', params.mortgageDebt.autoPayment2)
  push('mortgageDebt', 'creditCardPayments', params.mortgageDebt.creditCardPayments)
  push('mortgageDebt', 'otherDebtPayments', params.mortgageDebt.otherDebtPayments)
  pushOtherItems('mortgageDebt', params.mortgageDebt.other)

  push('utilities', 'electric', params.utilities.electric)
  push('utilities', 'gas', params.utilities.gas)
  push('utilities', 'water', params.utilities.water)
  push('utilities', 'cable', params.utilities.cable)
  push('utilities', 'phone', params.utilities.phone)
  push('utilities', 'internet', params.utilities.internet)
  pushOtherItems('utilities', params.utilities.other)

  push('food', 'groceries', params.food.groceries)
  push('food', 'gasAndMaintenance', params.food.gasAndMaintenance)
  push('food', 'generalMerchandise', params.food.generalMerchandise)
  push('food', 'charitableDonations', params.food.charitableDonations)
  push('food', 'religiousDonations', params.food.religiousDonations)
  pushOtherItems('food', params.food.other)

  push('insurance', 'autoInsurance', params.insurance.autoInsurance)
  push('insurance', 'lifeInsurance', params.insurance.lifeInsurance)
  push('insurance', 'healthInsurance', params.insurance.healthInsurance)
  push('insurance', 'homeInsurance', params.insurance.homeInsurance)
  pushOtherItems('insurance', params.insurance.other)

  push('maintenance', 'homeMaintenance', params.maintenance.homeMaintenance)
  push('maintenance', 'medical', params.maintenance.medical)
  push('maintenance', 'childcare', params.maintenance.childcare)
  push('maintenance', 'clothing', params.maintenance.clothing)
  push('maintenance', 'entertainment', params.maintenance.entertainment)
  pushOtherItems('maintenance', params.maintenance.other)

  return rows
}
