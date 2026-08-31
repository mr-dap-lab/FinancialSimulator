import { Button, CategoryCard } from '../../../components/ui'
import { useLocale } from '../../../context/locale'
import { useT } from '../../../i18n/i18n'
import {
  foodTotal,
  insuranceTotal,
  maintenanceTotal,
  mortgageDebtTotal,
  utilitiesTotal,
} from '../../../lib/budget'
import type { BudgetController } from '../useBudget'
import { CurrencyFieldGrid } from './CurrencyFieldGrid'
import { EarnerIncomeForm } from './EarnerIncomeForm'
import { MaintenanceCategory } from './MaintenanceCategory'
import { OtherCategoryItems } from './OtherCategoryItems'

export function BudgetParametersPanel({ budget }: { budget: BudgetController }) {
  const { params } = budget
  const { formatCurrency } = useLocale()
  const t = useT()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="text" onClick={budget.reset}>
          {t.common.reset}
        </Button>
      </div>

      <CategoryCard title={t.budget.primaryIncomeTitle} subtotal={formatCurrency(budget.result.primary.netMonthly)}>
        <EarnerIncomeForm earner={params.primary} onChange={budget.updatePrimary} />
      </CategoryCard>

      <CategoryCard title={t.budget.spouseIncomeTitle} subtotal={formatCurrency(budget.result.spouse.netMonthly)}>
        <EarnerIncomeForm earner={params.spouse} onChange={budget.updateSpouse} />
      </CategoryCard>

      <CategoryCard title={t.budget.mortgageDebtTitle} subtotal={formatCurrency(mortgageDebtTotal(params.mortgageDebt))}>
        <div className="space-y-4">
          <CurrencyFieldGrid
            fields={[
              { key: 'housePayment', label: t.budget.housePayment, help: t.budget.housePaymentHelp },
              { key: 'autoPayment', label: t.budget.autoPayment, help: t.budget.autoPaymentHelp },
              { key: 'autoPayment2', label: t.budget.autoPayment2, help: t.budget.autoPayment2Help },
              {
                key: 'creditCardPayments',
                label: t.budget.creditCardPayments,
                help: t.budget.creditCardPaymentsHelp,
              },
              {
                key: 'otherDebtPayments',
                label: t.budget.otherDebtPayments,
                help: t.budget.otherDebtPaymentsHelp,
              },
            ]}
            values={params.mortgageDebt}
            onChange={budget.updateMortgageDebt}
          />
          <OtherCategoryItems
            category="mortgageDebt"
            items={params.mortgageDebt.other}
            onAdd={budget.addCategoryItem}
            onUpdate={budget.updateCategoryItem}
            onRemove={budget.removeCategoryItem}
          />
        </div>
      </CategoryCard>

      <CategoryCard title={t.budget.utilitiesTitle} subtotal={formatCurrency(utilitiesTotal(params.utilities))}>
        <div className="space-y-4">
          <CurrencyFieldGrid
            fields={[
              { key: 'electric', label: t.budget.electric, help: t.budget.electricHelp },
              { key: 'gas', label: t.budget.gas, help: t.budget.gasHelp },
              { key: 'water', label: t.budget.water, help: t.budget.waterHelp },
              { key: 'cable', label: t.budget.cable, help: t.budget.cableHelp },
              { key: 'phone', label: t.budget.phone, help: t.budget.phoneHelp },
              { key: 'internet', label: t.budget.internet, help: t.budget.internetHelp },
            ]}
            values={params.utilities}
            onChange={budget.updateUtilities}
          />
          <OtherCategoryItems
            category="utilities"
            items={params.utilities.other}
            onAdd={budget.addCategoryItem}
            onUpdate={budget.updateCategoryItem}
            onRemove={budget.removeCategoryItem}
          />
        </div>
      </CategoryCard>

      <CategoryCard title={t.budget.foodTitle} subtotal={formatCurrency(foodTotal(params.food))}>
        <div className="space-y-4">
          <CurrencyFieldGrid
            fields={[
              { key: 'groceries', label: t.budget.groceries, help: t.budget.groceriesHelp },
              {
                key: 'gasAndMaintenance',
                label: t.budget.gasAndMaintenance,
                help: t.budget.gasAndMaintenanceHelp,
              },
              {
                key: 'generalMerchandise',
                label: t.budget.generalMerchandise,
                help: t.budget.generalMerchandiseHelp,
              },
              {
                key: 'charitableDonations',
                label: t.budget.charitableDonations,
                help: t.budget.charitableDonationsHelp,
              },
              {
                key: 'religiousDonations',
                label: t.budget.religiousDonations,
                help: t.budget.religiousDonationsHelp,
              },
            ]}
            values={params.food}
            onChange={budget.updateFood}
          />
          <OtherCategoryItems
            category="food"
            items={params.food.other}
            onAdd={budget.addCategoryItem}
            onUpdate={budget.updateCategoryItem}
            onRemove={budget.removeCategoryItem}
          />
        </div>
      </CategoryCard>

      <CategoryCard title={t.budget.insuranceTitle} subtotal={formatCurrency(insuranceTotal(params.insurance))}>
        <div className="space-y-4">
          <CurrencyFieldGrid
            fields={[
              { key: 'autoInsurance', label: t.budget.autoInsurance, help: t.budget.autoInsuranceHelp },
              { key: 'lifeInsurance', label: t.budget.lifeInsurance, help: t.budget.lifeInsuranceHelp },
              {
                key: 'healthInsurance',
                label: t.budget.healthInsurance,
                help: t.budget.healthInsuranceHelp,
              },
              { key: 'homeInsurance', label: t.budget.homeInsurance, help: t.budget.homeInsuranceHelp },
            ]}
            values={params.insurance}
            onChange={budget.updateInsurance}
          />
          <OtherCategoryItems
            category="insurance"
            items={params.insurance.other}
            onAdd={budget.addCategoryItem}
            onUpdate={budget.updateCategoryItem}
            onRemove={budget.removeCategoryItem}
          />
        </div>
      </CategoryCard>

      <CategoryCard
        title={t.budget.maintenanceTitle}
        subtotal={formatCurrency(maintenanceTotal(params.maintenance))}
      >
        <div className="space-y-4">
          <MaintenanceCategory maintenance={params.maintenance} onChange={budget.updateMaintenance} />
          <OtherCategoryItems
            category="maintenance"
            items={params.maintenance.other}
            onAdd={budget.addCategoryItem}
            onUpdate={budget.updateCategoryItem}
            onRemove={budget.removeCategoryItem}
          />
        </div>
      </CategoryCard>
    </div>
  )
}
