import { Button, CurrencyInput, IconButton, ParamField, TextInput } from '../../../components/ui'
import { useT } from '../../../i18n/i18n'
import { MAX_BUDGET_OTHER_CATEGORIES } from '../../../lib/limits'
import type { CategoryItem } from '../../../lib/budget'
import type { ExpenseCategoryKey } from '../useBudget'

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      fill="currentColor"
      d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  </svg>
)

interface OtherCategoryItemsProps {
  category: ExpenseCategoryKey
  items: CategoryItem[]
  onAdd: (category: ExpenseCategoryKey, description: string) => void
  onUpdate: (category: ExpenseCategoryKey, id: string, patch: Partial<CategoryItem>) => void
  onRemove: (category: ExpenseCategoryKey, id: string) => void
}

/**
 * The repeatable "Otros" row every expense category shares — one free-text
 * description plus an amount, fully participating in that category's
 * subtotal, `totalExpenses`, the donut (grouped under the parent wedge, not
 * a slice of its own), and the CSV. Extracted once so all five categories
 * (Hipoteca y deudas, Servicios públicos, Alimentación, Seguros,
 * Mantenimiento) reuse the same rows instead of five near-copies.
 */
export function OtherCategoryItems({ category, items, onAdd, onUpdate, onRemove }: OtherCategoryItemsProps) {
  const t = useT()
  const atLimit = items.length >= MAX_BUDGET_OTHER_CATEGORIES

  return (
    <div className="space-y-3 border-t border-outline-variant pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium text-on-surface">{t.budget.otherCategories}</h3>
        <Button
          variant="tonal"
          className="ml-auto"
          disabled={atLimit}
          title={atLimit ? t.budget.otherCategoryLimitReached(MAX_BUDGET_OTHER_CATEGORIES) : undefined}
          onClick={() => onAdd(category, t.budget.defaultOtherDescription)}
        >
          + {t.budget.addOtherCategory}
        </Button>
      </div>

      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <ParamField label={t.budget.otherDescription} help={t.budget.otherDescriptionHelp}>
            {(id) => (
              <TextInput
                id={id}
                value={item.description}
                onChange={(value) => onUpdate(category, item.id, { description: value })}
              />
            )}
          </ParamField>
          <ParamField label={t.budget.otherAmount} help={t.budget.otherAmountHelp}>
            {(id) => (
              <CurrencyInput
                id={id}
                value={item.amount}
                onChange={(value) => onUpdate(category, item.id, { amount: value })}
              />
            )}
          </ParamField>
          <div className="flex items-start justify-end sm:pt-6">
            <IconButton
              variant="danger"
              aria-label={`${t.common.delete} ${t.budget.otherCategories} ${index + 1}`}
              onClick={() => onRemove(category, item.id)}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  )
}
