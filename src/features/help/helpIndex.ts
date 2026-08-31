import type { Dictionary } from '../../i18n/es'

/**
 * The Ayuda index — every field's explanation here is `helpLong` (or, for the
 * handful of fields that only ever needed a short tooltip, its `xHelp`
 * fallback) read directly out of the same dictionary entry each field's `(?)`
 * popover already uses. There is deliberately no second copy of this prose
 * anywhere in this file — only the *list of which fields exist*, per feature.
 */

type Namespace = keyof Dictionary

/** Most fields' `helpLong`/`Help` companions live under the feature's own
 * namespace and share its base key exactly — `key` is enough. The few that
 * don't (Tarjeta reuses Crédito's own "Tasa de interés" field) say so via
 * `namespace`. */
interface FieldKey {
  key: string
  namespace?: Namespace
}

export interface HelpField {
  id: string
  label: string
  helpLong: string
}

export interface HelpFeatureGroup {
  id: string
  title: string
  fields: HelpField[]
}

function field(key: string, namespace?: Namespace): FieldKey {
  return { key, namespace }
}

const SAVINGS_KEYS = [
  field('monthlyContribution'),
  field('annualRate'),
  field('withholding'),
  field('years'),
  field('growth'),
]

const SAVINGS_GOAL_KEYS = [
  field('goal'),
  field('years'),
  field('currentSavings'),
  field('monthlyContribution'),
  field('expectedReturn'),
  field('expectedInflation'),
]

const RETIREMENT_KEYS = [
  field('startingBalance'),
  field('annualContribution'),
  field('currentAge'),
  field('retirementAge'),
  field('retirementYears'),
  field('growWithInflation'),
  field('taxDeferred'),
  field('returnBefore'),
  field('returnDuring'),
  field('currentTaxRate'),
  field('retirementTaxRate'),
  field('inflation'),
]

const LOAN_KEYS = [
  field('principal'),
  field('rate'),
  field('term'),
  field('disbursementDate'),
  field('system'),
  field('graceMonths'),
  field('graceType'),
  field('lifeInsurance'),
  field('assetInsurance'),
  field('adminFee'),
]

const DEBT_CONSOLIDATION_KEYS = [
  field('balance'),
  field('rate'),
  field('useMinimumPayment'),
  field('minimumPct'),
  field('minimumFloor'),
  field('payment'),
  field('description'),
  field('consolidatedBalance'),
  field('consolidatedRate'),
  field('consolidatedTerm'),
]

const CARD_KEYS = [
  field('cardName'),
  field('franchise'),
  field('creditLimit'),
  field('openingBalance'),
  field('rate', 'loan'),
  field('usuryRate'),
  field('monthlyFee'),
  field('cutoffDay'),
  field('horizon'),
  field('strategy'),
  field('minimumRate'),
  field('minimumFloor'),
  field('fixedAmount'),
  field('percentageAmount'),
]

const BUDGET_KEYS = [
  field('grossAmount'),
  field('frequency'),
  field('federalWithholding'),
  field('stateWithholding'),
  field('localWithholding'),
  field('otherTaxes'),
  field('fica'),
  field('medicare'),
  field('insuranceBenefits'),
  field('retirementSavings'),
  field('otherIncome'),
  field('otherIncomeFrequency'),
  field('housePayment'),
  field('autoPayment'),
  field('autoPayment2'),
  field('creditCardPayments'),
  field('otherDebtPayments'),
  field('electric'),
  field('gas'),
  field('water'),
  field('cable'),
  field('phone'),
  field('internet'),
  field('groceries'),
  field('gasAndMaintenance'),
  field('generalMerchandise'),
  field('charitableDonations'),
  field('religiousDonations'),
  field('autoInsurance'),
  field('lifeInsurance'),
  field('healthInsurance'),
  field('homeInsurance'),
  field('homeMaintenance'),
  field('medical'),
  field('childcare'),
  field('clothing'),
  field('entertainment'),
  field('otherDescription'),
  field('otherAmount'),
]

/** Reads `dict[key]` as a plain string — safe here because every key this file
 * lists was written as a literal string, never as an interpolated function. */
function str(dict: Dictionary, namespace: Namespace, key: string): string {
  const value = (dict[namespace] as unknown as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

function toField(dict: Dictionary, featureNamespace: Namespace, spec: FieldKey): HelpField {
  const namespace = spec.namespace ?? featureNamespace
  const label = str(dict, namespace, spec.key)
  const helpLong = str(dict, namespace, `${spec.key}HelpLong`) || str(dict, namespace, `${spec.key}Help`)
  return { id: `${featureNamespace}.${spec.key}`, label, helpLong }
}

export function buildHelpIndex(t: Dictionary): HelpFeatureGroup[] {
  return [
    { id: 'savings', title: t.app.tabs.savings, fields: SAVINGS_KEYS.map((k) => toField(t, 'savings', k)) },
    {
      id: 'savingsGoal',
      title: t.app.tabs.savingsGoal,
      fields: SAVINGS_GOAL_KEYS.map((k) => toField(t, 'savingsGoal', k)),
    },
    {
      id: 'retirement',
      title: t.app.tabs.retirement,
      fields: RETIREMENT_KEYS.map((k) => toField(t, 'retirement', k)),
    },
    { id: 'loan', title: t.app.tabs.loan, fields: LOAN_KEYS.map((k) => toField(t, 'loan', k)) },
    {
      id: 'debtConsolidation',
      title: t.app.tabs.debtConsolidation,
      fields: DEBT_CONSOLIDATION_KEYS.map((k) => toField(t, 'debtConsolidation', k)),
    },
    { id: 'card', title: t.app.tabs.card, fields: CARD_KEYS.map((k) => toField(t, 'card', k)) },
    { id: 'budget', title: t.app.tabs.budget, fields: BUDGET_KEYS.map((k) => toField(t, 'budget', k)) },
  ]
}
