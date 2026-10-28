/**
 * The budget fields an import may report changing. Server-side allowlist for
 * `POST /api/bank/imports`: nothing outside it can be written into the audit
 * log's `changes`, so a client cannot smuggle arbitrary text into the trail.
 *
 * Mirrors `IMPORT_FIELDS` in `src/lib/bankImport.ts` (kept as a separate copy
 * so the function bundle imports nothing from `src/`); a unit test fails if
 * the two ever differ.
 */
export const IMPORT_FIELD_IDS: readonly string[] = [
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
]
