import { useT } from '../../../i18n/i18n'
import type { MaintenanceExpenses } from '../../../lib/budget'
import { CurrencyFieldGrid } from './CurrencyFieldGrid'

export function MaintenanceCategory({
  maintenance,
  onChange,
}: {
  maintenance: MaintenanceExpenses
  onChange: (patch: Partial<Omit<MaintenanceExpenses, 'other'>>) => void
}) {
  const t = useT()

  return (
    <CurrencyFieldGrid
      fields={[
        { key: 'homeMaintenance', label: t.budget.homeMaintenance, help: t.budget.homeMaintenanceHelp },
        { key: 'medical', label: t.budget.medical, help: t.budget.medicalHelp },
        { key: 'childcare', label: t.budget.childcare, help: t.budget.childcareHelp },
        { key: 'clothing', label: t.budget.clothing, help: t.budget.clothingHelp },
        { key: 'entertainment', label: t.budget.entertainment, help: t.budget.entertainmentHelp },
      ]}
      values={maintenance}
      onChange={onChange}
    />
  )
}
