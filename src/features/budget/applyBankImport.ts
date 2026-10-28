import type { BudgetParams } from '../../lib/budget'
import { IMPORT_FIELDS, splitField } from '../../lib/bankImport'
import type { ImportFieldId } from '../../lib/bankImport'
import type { ImportChange } from '../../lib/bankTypes'
import type { BudgetController } from './useBudget'

/** The current monthly value of every importable field, for the before/after diff. */
export function currentImportValues(params: BudgetParams): Record<ImportFieldId, number> {
  const values = {} as Record<ImportFieldId, number>
  for (const id of IMPORT_FIELDS) {
    const { section, field } = splitField(id)
    values[id] = (params[section as keyof BudgetParams] as unknown as Record<string, number>)[field]
  }
  return values
}

/**
 * Writes the accepted changes into the budget: one patch per section, using the
 * same updaters the form fields use, so an import is indistinguishable from the
 * user typing the figures. Custom "Otros" rows are never touched.
 */
export function applyImportChanges(budget: BudgetController, changes: ImportChange[]): void {
  const patches: Record<string, Record<string, number>> = {}
  for (const change of changes) {
    const { section, field } = splitField(change.field as ImportFieldId)
    ;(patches[section] ??= {})[field] = change.after
  }

  if (patches.mortgageDebt) budget.updateMortgageDebt(patches.mortgageDebt)
  if (patches.utilities) budget.updateUtilities(patches.utilities)
  if (patches.food) budget.updateFood(patches.food)
  if (patches.insurance) budget.updateInsurance(patches.insurance)
  if (patches.maintenance) budget.updateMaintenance(patches.maintenance)
}
