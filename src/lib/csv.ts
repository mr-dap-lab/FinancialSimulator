import { toMonthlyRate } from './amortize'
import type { LoanParams, LoanRow } from './amortize'
import type { CardFranchise, CardMonth, CardTotals, CreditCardParams } from './creditCard'
import { normalizeTiers } from './simulate'
import type { SavingsParams, SavingsRow } from './simulate'
import type { GoalYearRow, SavingsGoalParams } from './savingsGoal'
import type { AccumulationYearRow, RetirementParams, RetirementYearRow } from './retirement'
import type { DebtRow } from './debtConsolidation'
import type { BudgetRow } from './budget'

/**
 * A cell whose text starts with `=`, `+`, `-`, or `@` is read as the start of
 * a formula by Excel and Google Sheets on open — the standard CSV formula
 * injection vector (CWE-1236). Prefixing it with a literal apostrophe forces
 * the cell to be read as plain text instead. This runs on every cell,
 * including a negative number (the withholding and extra-payment columns are
 * often negative): the apostrophe makes that column display as text rather
 * than a number in the spreadsheet, which is the deliberate trade-off for
 * making the export safe to open unconditionally, with no per-column
 * allowlist to keep in sync with the schedule shape.
 */
const FORMULA_PREFIX = /^[=+\-@]/

const sanitizeForSpreadsheet = (value: string): string =>
  FORMULA_PREFIX.test(value) ? `'${value}` : value

const escape = (value: string): string => {
  const safe = sanitizeForSpreadsheet(value)
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** Serialises one CSV line, quoting only the cells that need it. */
export const csvRow = (cells: (string | number)[]): string =>
  cells.map((cell) => escape(typeof cell === 'number' ? String(cell) : cell)).join(',')

/** Two decimals is enough for currency and keeps the file readable. */
export const round2 = (value: number): number => Math.round(value * 100) / 100

/**
 * Serialises the savings schedule, prefixed with the parameters that produced
 * it so an exported file can be traced back to its scenario.
 *
 * Numbers are written unformatted (dot decimal, no grouping) so the file opens
 * cleanly in any spreadsheet regardless of the display locale.
 */
export function savingsToCsv(rows: SavingsRow[], params: SavingsParams): string {
  const lines: string[] = [
    csvRow(['Parámetro', 'Valor']),
    csvRow(['Aporte mensual', params.monthlyContribution]),
    csvRow(['Interés anual (%)', round2(params.annualRate * 100)]),
    csvRow(['Años', params.years]),
    csvRow(['Retención (%)', round2(params.withholdingRate * 100)]),
    csvRow(['Crecimiento del aporte (% anual)', round2(params.contributionGrowth * 100)]),
    csvRow(['Capitalización mensual real', params.realMonthlyCompounding ? 'Sí' : 'No']),
    csvRow(['Tramos de tasa', params.tiersEnabled ? 'Sí' : 'No']),
  ]

  if (params.tiersEnabled && params.tiers.length > 1) {
    lines.push(csvRow(['Modo de tramos', params.tierMode === 'age' ? 'Por antigüedad' : 'Por saldo']))
    const label = params.tierMode === 'age' ? 'Desde el mes' : 'Saldo mínimo'
    for (const tier of normalizeTiers(params.tiers, params.tierMode)) {
      lines.push(
        csvRow([`Tramo — ${label}`, tier.from, 'Tasa anual (%)', round2(tier.annualRate * 100)]),
      )
    }
  }

  lines.push('')
  lines.push(
    csvRow([
      'Año',
      'Mes',
      'Mes del año',
      'Tasa anual (%)',
      'Aporte',
      'Interés anual',
      'Retención',
      'Interés neto',
      'Interés mensual',
      'Saldo',
    ]),
  )

  for (const row of rows) {
    lines.push(
      csvRow([
        row.year,
        row.month,
        row.monthOfYear,
        round2(row.annualRate * 100),
        round2(row.contribution),
        round2(row.grossAnnualInterest),
        round2(row.withholding),
        round2(row.netAnnualInterest),
        round2(row.monthlyInterest),
        round2(row.balance),
      ]),
    )
  }

  return lines.join('\n')
}

// --- Crédito ---------------------------------------------------------------

const SYSTEM_LABELS = {
  french: 'Cuota fija (francés)',
  german: 'Abono constante a capital (alemán)',
  bullet: 'Solo intereses + pago único (bullet)',
} as const

const CONVENTION_LABELS = {
  EA: 'E.A. (efectiva anual)',
  NOMINAL_MV: 'Nominal anual M.V.',
  MONTHLY: 'Mensual efectiva',
} as const

/** Serialises the loan schedule, prefixed with the parameters that produced it. */
export function loanToCsv(rows: LoanRow[], params: LoanParams): string {
  const lines: string[] = [
    csvRow(['Parámetro', 'Valor']),
    csvRow(['Monto del préstamo', params.principal]),
    csvRow(['Tasa', round2(params.rate * 100), CONVENTION_LABELS[params.rateConvention]]),
    csvRow([
      'Tasa mensual efectiva (%)',
      round2(toMonthlyRate(params.rate, params.rateConvention) * 100 * 10000) / 10000,
    ]),
    csvRow(['Plazo (meses)', params.months]),
    csvRow(['Sistema de amortización', SYSTEM_LABELS[params.system]]),
    csvRow(['Periodo de gracia (meses)', params.graceMonths]),
    csvRow([
      'Tipo de gracia',
      params.graceType === 'total' ? 'Total / capitaliza' : 'Solo intereses',
    ]),
    csvRow(['Seguro de vida (% mensual)', round2(params.lifeInsuranceRate * 100 * 1000) / 1000]),
    csvRow(['Seguro de bien (mensual)', params.assetInsurance]),
    csvRow(['Cuota de administración (mensual)', params.adminFee]),
    csvRow(['Fecha de desembolso', params.disbursementDate]),
  ]

  if (params.extraPayments.length > 0) {
    for (const extra of [...params.extraPayments].sort((a, b) => a.month - b.month)) {
      lines.push(
        csvRow([
          'Abono extraordinario — mes',
          extra.month,
          'Monto',
          extra.amount,
          'Efecto',
          extra.effect === 'reduceTerm' ? 'Reducir plazo' : 'Reducir cuota',
        ]),
      )
    }
  }

  lines.push('')
  lines.push(
    csvRow([
      'Año',
      'Mes',
      'Fecha',
      'Saldo inicial',
      'Cuota',
      'Interés',
      'Abono a capital',
      'Abono extra',
      'Seguro de vida',
      'Cargos fijos',
      'Seguros',
      'Cuota total',
      'Saldo',
    ]),
  )

  for (const row of rows) {
    lines.push(
      csvRow([
        row.year,
        row.month,
        row.date,
        round2(row.openingBalance),
        round2(row.payment),
        round2(row.interest),
        round2(row.principalPaid),
        round2(row.extraPayment),
        round2(row.lifeInsurance),
        round2(row.fixedCharges),
        round2(row.insurance),
        round2(row.totalPayment),
        round2(row.balance),
      ]),
    )
  }

  return lines.join('\n')
}

// --- Tarjeta de crédito ----------------------------------------------------

const STRATEGY_LABELS = {
  full: 'Pago total',
  minimum: 'Pago mínimo',
  fixed: 'Pago fijo',
  percentage: '% del saldo',
} as const

const FRANCHISE_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
} as const

/**
 * Serialises the card projection as two sections in one file: the monthly
 * schedule, then the per-purchase instalment breakdown. `identity` is
 * optional only so existing call sites/tests that predate multi-card support
 * still compile — every real call site now has a card to name.
 */
export function cardToCsv(
  rows: CardMonth[],
  params: CreditCardParams,
  totals: CardTotals,
  identity?: { name: string; franchise: CardFranchise },
): string {
  const lines: string[] = [
    csvRow(['Parámetro', 'Valor']),
    ...(identity
      ? [
          csvRow(['Nombre de la tarjeta', identity.name]),
          csvRow(['Franquicia', FRANCHISE_LABELS[identity.franchise]]),
        ]
      : []),
    csvRow(['Cupo total', params.creditLimit]),
    csvRow(['Saldo rotativo inicial', params.openingBalance]),
    csvRow(['Tasa', round2(params.rate * 100), CONVENTION_LABELS[params.rateConvention]]),
    csvRow(['Tasa mensual efectiva (%)', Math.round(totals.monthlyRate * 1e6) / 1e4]),
    csvRow(['Tasa de usura (% E.A.)', round2(params.usuryRate * 100)]),
    csvRow(['Supera la usura', totals.exceedsUsury ? 'Sí' : 'No']),
    csvRow(['Cuota de manejo', params.monthlyFee]),
    csvRow(['IVA sobre la cuota de manejo', params.feeIncludesVat ? 'Sí (19%)' : 'No']),
    csvRow(['Día de corte', params.cutoffDay]),
    csvRow(['Horizonte (meses)', params.months]),
    csvRow(['Estrategia de pago', STRATEGY_LABELS[params.strategy]]),
    csvRow(['Meses hasta saldo cero', totals.monthsToZero ?? 'Nunca']),
  ]

  lines.push('')
  lines.push(csvRow(['SECCIÓN', 'Cronograma mensual']))
  lines.push(
    csvRow([
      'Año',
      'Mes',
      'Fecha de corte',
      'Fecha límite de pago',
      'Compras del mes',
      'Cuotas diferidas',
      'Interés',
      'Cuota de manejo',
      'Pago',
      'Saldo rotativo',
      'Saldo total',
      'Cupo usado (%)',
    ]),
  )

  for (const row of rows) {
    lines.push(
      csvRow([
        row.year,
        row.month,
        row.cutoffDate,
        row.dueDate,
        round2(row.revolvingPurchases),
        round2(row.installmentCharges),
        round2(row.interest),
        round2(row.fee),
        round2(row.payment),
        round2(row.revolvingBalance),
        round2(row.totalBalance),
        round2(row.utilization * 100),
      ]),
    )
  }

  lines.push('')
  lines.push(csvRow(['SECCIÓN', 'Detalle por compra diferida']))
  lines.push(
    csvRow([
      'Mes',
      'Compra',
      'Cuota',
      'Total cuotas',
      'Valor de la cuota',
      'Capital',
      'Interés',
      'Capital pendiente',
    ]),
  )

  for (const row of rows) {
    for (const charge of row.charges) {
      lines.push(
        csvRow([
          row.month,
          charge.description,
          charge.installment,
          charge.installments,
          round2(charge.amount),
          round2(charge.principal),
          round2(charge.interest),
          round2(charge.remainingPrincipal),
        ]),
      )
    }
  }

  return lines.join('\n')
}

// --- Meta de ahorro ---------------------------------------------------------

/** Serialises the savings-goal schedule, prefixed with the parameters that produced it. */
export function savingsGoalToCsv(rows: GoalYearRow[], params: SavingsGoalParams): string {
  const lines: string[] = [
    csvRow(['Parámetro', 'Valor']),
    csvRow(['Meta de ahorro', params.goal]),
    csvRow(['Años objetivo', params.years]),
    csvRow(['Ahorrado actualmente', params.currentSavings]),
    csvRow(['Aporte mensual', params.monthlyContribution]),
    csvRow(['Rentabilidad esperada (% anual, E.A.)', round2(params.expectedReturn * 100)]),
    csvRow(['Inflación esperada (% anual)', round2(params.expectedInflation * 100)]),
  ]

  lines.push('')
  lines.push(
    csvRow([
      'Año',
      'Saldo con tu aporte',
      'Saldo con aporte requerido',
      'Diferencia vs. meta',
    ]),
  )

  for (const row of rows) {
    lines.push(
      csvRow([
        row.year,
        round2(row.balanceAtContribution),
        round2(row.balanceAtRequired),
        round2(row.differenceVsGoal),
      ]),
    )
  }

  return lines.join('\n')
}

// --- Retiro ------------------------------------------------------------

/**
 * Serialises both retirement phases in one file: accumulation (working
 * years, one row per year) followed by the withdrawal schedule (retirement
 * years, one row per year) — the same two sections shown in the UI.
 */
export function retirementToCsv(
  accumulation: AccumulationYearRow[],
  withdrawal: RetirementYearRow[],
  params: RetirementParams,
): string {
  const lines: string[] = [
    csvRow(['Parámetro', 'Valor']),
    csvRow(['Saldo inicial', params.startingBalance]),
    csvRow(['Aporte anual', params.annualContribution]),
    csvRow(['Edad actual', params.currentAge]),
    csvRow(['Edad de retiro', params.retirementAge]),
    csvRow(['Años de retiro', params.retirementYears]),
    csvRow(['Incrementar aportes con la inflación', params.growContributionsWithInflation ? 'Sí' : 'No']),
    csvRow(['Ahorro con impuesto diferido', params.taxDeferred ? 'Sí' : 'No']),
    csvRow(['Rentabilidad antes del retiro (%)', round2(params.returnBeforeRetirement * 100)]),
    csvRow(['Rentabilidad durante el retiro (%)', round2(params.returnDuringRetirement * 100)]),
    csvRow(['Tasa de impuesto actual (%)', round2(params.currentTaxRate * 100)]),
    csvRow(['Tasa de impuesto en el retiro (%)', round2(params.retirementTaxRate * 100)]),
    csvRow(['Inflación esperada (%)', round2(params.inflation * 100)]),
  ]

  lines.push('')
  lines.push(csvRow(['SECCIÓN', 'Acumulación']))
  lines.push(csvRow(['Año', 'Edad', 'Aporte', 'Saldo']))
  for (const row of accumulation) {
    lines.push(csvRow([row.year, row.age, round2(row.contribution), round2(row.balance)]))
  }

  lines.push('')
  lines.push(csvRow(['SECCIÓN', 'Retiro']))
  lines.push(csvRow(['Año', 'Edad', 'Ingreso del mes', 'Saldo restante']))
  for (const row of withdrawal) {
    lines.push(
      csvRow([row.year, row.age, round2(row.monthlyIncome), round2(row.remainingBalance)]),
    )
  }

  return lines.join('\n')
}

// --- Consolidación de deudas -------------------------------------------

const DEBT_TYPE_LABELS = { card: 'Tarjeta', auto: 'Auto', other: 'Otro' } as const

/**
 * Serialises the current-debt list, then the consolidated loan's own
 * amortization schedule — the same two sections shown in the UI.
 */
export function debtConsolidationToCsv(
  debts: DebtRow[],
  consolidatedRows: LoanRow[],
  consolidated: { balance: number; rate: number; months: number },
): string {
  const lines: string[] = [
    csvRow(['SECCIÓN', 'Deudas actuales']),
    csvRow(['Tipo', 'Descripción', 'Saldo', 'Tasa (%)', 'Pago', 'Meses para pagar']),
  ]

  for (const debt of debts) {
    lines.push(
      csvRow([
        DEBT_TYPE_LABELS[debt.type],
        debt.description,
        round2(debt.balance),
        round2(debt.rate * 100),
        round2(debt.payment),
        debt.months ?? 'Nunca',
      ]),
    )
  }

  lines.push('')
  lines.push(csvRow(['SECCIÓN', 'Préstamo consolidado']))
  lines.push(csvRow(['Saldo del préstamo', consolidated.balance]))
  lines.push(csvRow(['Tasa de interés (% Nominal M.V.)', round2(consolidated.rate * 100)]))
  lines.push(csvRow(['Plazo (meses)', consolidated.months]))
  lines.push('')
  lines.push(csvRow(['Año', 'Mes', 'Cuota', 'Interés', 'Abono a capital', 'Saldo']))

  for (const row of consolidatedRows) {
    lines.push(
      csvRow([
        row.year,
        row.month,
        round2(row.payment),
        round2(row.interest),
        round2(row.principalPaid),
        round2(row.balance),
      ]),
    )
  }

  return lines.join('\n')
}

// --- Mi Presupuesto ------------------------------------------------------

const BUDGET_SECTION_LABELS: Record<string, string> = {
  primaryIncome: 'Tu ingreso mensual neto',
  spouseIncome: 'Ingreso neto del cónyuge',
  mortgageDebt: 'Hipoteca y deudas',
  utilities: 'Servicios públicos',
  food: 'Alimentación y gastos generales',
  insurance: 'Seguros',
  maintenance: 'Mantenimiento, médico, cuidado infantil, etc.',
}

const BUDGET_FIELD_LABELS: Record<string, string> = {
  grossAmount: 'Monto bruto',
  federalWithholding: 'Retención de impuesto federal',
  stateWithholding: 'Retención de impuesto estatal/departamental',
  localWithholding: 'Retención de impuesto local/municipal',
  otherTaxes: 'Otros impuestos y retenciones',
  fica: 'FICA / seguridad social',
  medicare: 'Salud (Medicare-equivalente)',
  insuranceBenefits: 'Seguros y beneficios',
  retirementSavings: 'Ahorro para el retiro de la empresa',
  otherIncome: 'Otro ingreso',
  housePayment: 'Pago de vivienda',
  autoPayment: 'Pago de auto',
  autoPayment2: 'Pago de auto 2',
  creditCardPayments: 'Pagos de tarjeta de crédito',
  otherDebtPayments: 'Otros pagos de deuda',
  electric: 'Electricidad',
  gas: 'Gas',
  water: 'Acueducto y alcantarillado',
  cable: 'Cable',
  phone: 'Teléfono',
  internet: 'Internet',
  groceries: 'Alimentación',
  gasAndMaintenance: 'Gasolina y mantenimiento del auto',
  generalMerchandise: 'Mercancía general',
  charitableDonations: 'Donaciones caritativas',
  religiousDonations: 'Donaciones religiosas',
  autoInsurance: 'Seguro de auto',
  lifeInsurance: 'Seguro de vida',
  healthInsurance: 'Seguro de salud',
  homeInsurance: 'Seguro de vivienda',
  homeMaintenance: 'Mantenimiento del hogar',
  medical: 'Médico',
  childcare: 'Cuidado infantil',
  clothing: 'Ropa',
  entertainment: 'Entretenimiento',
}

/** One row per non-zero input field, grouped by section — the same list shown in the UI's detail table. */
export function budgetToCsv(rows: BudgetRow[]): string {
  const lines: string[] = [csvRow(['Sección', 'Concepto', 'Monto mensual'])]

  for (const row of rows) {
    lines.push(
      csvRow([
        BUDGET_SECTION_LABELS[row.section] ?? row.section,
        BUDGET_FIELD_LABELS[row.field] ?? row.field,
        round2(row.monthlyAmount),
      ]),
    )
  }

  return lines.join('\n')
}
