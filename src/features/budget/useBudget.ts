import { useCallback, useMemo, useState } from 'react'
import {
  buildBudgetRows,
  buildExpenseChartSlices,
  buildIncomeChartSlices,
  createBudgetParams,
  evaluateBudget,
  makeCategoryItem,
} from '../../lib/budget'
import type {
  BudgetParams,
  BudgetResult,
  BudgetRow,
  CategoryItem,
  ChartSlice,
  EarnerIncome,
  FoodExpenses,
  InsuranceExpenses,
  MaintenanceExpenses,
  MortgageDebt,
  Utilities,
} from '../../lib/budget'

/** Every expense category shares the same repeatable "Otros" shape. */
export type ExpenseCategoryKey = 'mortgageDebt' | 'utilities' | 'food' | 'insurance' | 'maintenance'

export interface BudgetController {
  params: BudgetParams
  reset: () => void
  result: BudgetResult
  rows: BudgetRow[]
  expenseSlices: ChartSlice[]
  incomeSlices: ChartSlice[]

  updatePrimary: (patch: Partial<EarnerIncome>) => void
  updateSpouse: (patch: Partial<EarnerIncome>) => void
  updateMortgageDebt: (patch: Partial<Omit<MortgageDebt, 'other'>>) => void
  updateUtilities: (patch: Partial<Omit<Utilities, 'other'>>) => void
  updateFood: (patch: Partial<Omit<FoodExpenses, 'other'>>) => void
  updateInsurance: (patch: Partial<Omit<InsuranceExpenses, 'other'>>) => void
  updateMaintenance: (patch: Partial<Omit<MaintenanceExpenses, 'other'>>) => void

  addCategoryItem: (category: ExpenseCategoryKey, description: string) => void
  updateCategoryItem: (category: ExpenseCategoryKey, id: string, patch: Partial<CategoryItem>) => void
  removeCategoryItem: (category: ExpenseCategoryKey, id: string) => void
}

export function useBudget(): BudgetController {
  const [params, setParams] = useState<BudgetParams>(createBudgetParams)

  const reset = useCallback(() => setParams(createBudgetParams()), [])

  const updatePrimary = useCallback((patch: Partial<EarnerIncome>) => {
    setParams((previous) => ({ ...previous, primary: { ...previous.primary, ...patch } }))
  }, [])

  const updateSpouse = useCallback((patch: Partial<EarnerIncome>) => {
    setParams((previous) => ({ ...previous, spouse: { ...previous.spouse, ...patch } }))
  }, [])

  const updateMortgageDebt = useCallback((patch: Partial<Omit<MortgageDebt, 'other'>>) => {
    setParams((previous) => ({ ...previous, mortgageDebt: { ...previous.mortgageDebt, ...patch } }))
  }, [])

  const updateUtilities = useCallback((patch: Partial<Omit<Utilities, 'other'>>) => {
    setParams((previous) => ({ ...previous, utilities: { ...previous.utilities, ...patch } }))
  }, [])

  const updateFood = useCallback((patch: Partial<Omit<FoodExpenses, 'other'>>) => {
    setParams((previous) => ({ ...previous, food: { ...previous.food, ...patch } }))
  }, [])

  const updateInsurance = useCallback((patch: Partial<Omit<InsuranceExpenses, 'other'>>) => {
    setParams((previous) => ({ ...previous, insurance: { ...previous.insurance, ...patch } }))
  }, [])

  const updateMaintenance = useCallback((patch: Partial<Omit<MaintenanceExpenses, 'other'>>) => {
    setParams((previous) => ({ ...previous, maintenance: { ...previous.maintenance, ...patch } }))
  }, [])

  const addCategoryItem = useCallback((category: ExpenseCategoryKey, description: string) => {
    setParams((previous) => ({
      ...previous,
      [category]: {
        ...previous[category],
        other: [...previous[category].other, makeCategoryItem(description, 0)],
      },
    }))
  }, [])

  const updateCategoryItem = useCallback(
    (category: ExpenseCategoryKey, id: string, patch: Partial<CategoryItem>) => {
      setParams((previous) => ({
        ...previous,
        [category]: {
          ...previous[category],
          other: previous[category].other.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        },
      }))
    },
    [],
  )

  const removeCategoryItem = useCallback((category: ExpenseCategoryKey, id: string) => {
    setParams((previous) => ({
      ...previous,
      [category]: {
        ...previous[category],
        other: previous[category].other.filter((item) => item.id !== id),
      },
    }))
  }, [])

  const result = useMemo(() => evaluateBudget(params), [params])
  const rows = useMemo(() => buildBudgetRows(params, result), [params, result])
  const expenseSlices = useMemo(() => buildExpenseChartSlices(result), [result])
  const incomeSlices = useMemo(() => buildIncomeChartSlices(result), [result])

  return {
    params,
    reset,
    result,
    rows,
    expenseSlices,
    incomeSlices,
    updatePrimary,
    updateSpouse,
    updateMortgageDebt,
    updateUtilities,
    updateFood,
    updateInsurance,
    updateMaintenance,
    addCategoryItem,
    updateCategoryItem,
    removeCategoryItem,
  }
}
