import type { Dictionary } from '../../i18n/es'

/**
 * Translates a `BudgetRow`'s raw `section`/`field` keys back to display
 * text — shared by the on-screen detail table and the report, so the two
 * don't drift into separate copies of the same ~35-entry lookup.
 */
export function budgetSectionLabel(t: Dictionary): Record<string, string> {
  return {
    primaryIncome: t.budget.primaryIncomeTitle,
    spouseIncome: t.budget.spouseIncomeTitle,
    mortgageDebt: t.budget.mortgageDebtTitle,
    utilities: t.budget.utilitiesTitle,
    food: t.budget.foodTitle,
    insurance: t.budget.insuranceTitle,
    maintenance: t.budget.maintenanceTitle,
  }
}

export function budgetFieldLabel(t: Dictionary): Record<string, string> {
  return {
    grossAmount: t.budget.grossAmount,
    federalWithholding: t.budget.federalWithholding,
    stateWithholding: t.budget.stateWithholding,
    localWithholding: t.budget.localWithholding,
    otherTaxes: t.budget.otherTaxes,
    fica: t.budget.fica,
    medicare: t.budget.medicare,
    insuranceBenefits: t.budget.insuranceBenefits,
    retirementSavings: t.budget.retirementSavings,
    otherIncome: t.budget.otherIncome,
    housePayment: t.budget.housePayment,
    autoPayment: t.budget.autoPayment,
    autoPayment2: t.budget.autoPayment2,
    creditCardPayments: t.budget.creditCardPayments,
    otherDebtPayments: t.budget.otherDebtPayments,
    electric: t.budget.electric,
    gas: t.budget.gas,
    water: t.budget.water,
    cable: t.budget.cable,
    phone: t.budget.phone,
    internet: t.budget.internet,
    groceries: t.budget.groceries,
    gasAndMaintenance: t.budget.gasAndMaintenance,
    generalMerchandise: t.budget.generalMerchandise,
    charitableDonations: t.budget.charitableDonations,
    religiousDonations: t.budget.religiousDonations,
    autoInsurance: t.budget.autoInsurance,
    lifeInsurance: t.budget.lifeInsurance,
    healthInsurance: t.budget.healthInsurance,
    homeInsurance: t.budget.homeInsurance,
    homeMaintenance: t.budget.homeMaintenance,
    medical: t.budget.medical,
    childcare: t.budget.childcare,
    clothing: t.budget.clothing,
    entertainment: t.budget.entertainment,
  }
}
