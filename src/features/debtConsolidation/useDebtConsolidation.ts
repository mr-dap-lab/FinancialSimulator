import { useCallback, useMemo, useState } from 'react'
import type { LoanRow } from '../../lib/amortize'
import {
  buildDebtRows,
  consolidatedLoanRows,
  consolidatedPayment,
  consolidatedTotalInterest,
  createDebtConsolidationParams,
  currentMonthsToPayoff,
  currentTotalInterest,
  currentTotalPayment,
  makeCreditCardDebt,
  makeInstallmentDebt,
  makeOtherDebt,
  totalDebtBalance,
} from '../../lib/debtConsolidation'
import type {
  CreditCardDebt,
  DebtConsolidationParams,
  DebtRow,
  InstallmentDebt,
  OtherDebt,
} from '../../lib/debtConsolidation'

export interface DebtConsolidationController {
  params: DebtConsolidationParams
  update: (patch: Partial<DebtConsolidationParams>) => void
  reset: () => void
  rows: DebtRow[]
  consolidatedRows: LoanRow[]
  currentPayment: number
  consolidatedMonthlyPayment: number
  currentMonths: number | null
  totalInterestSavings: number | null

  updateCard: (id: string, patch: Partial<CreditCardDebt>) => void
  addCard: () => void
  removeCard: (id: string) => void
  updateAuto: (id: string, patch: Partial<InstallmentDebt>) => void
  addAuto: () => void
  removeAuto: (id: string) => void
  updateOther: (id: string, patch: Partial<OtherDebt>) => void
  addOther: (description: string) => void
  removeOther: (id: string) => void
}

export function useDebtConsolidation(): DebtConsolidationController {
  const [params, setParams] = useState<DebtConsolidationParams>(createDebtConsolidationParams)

  const update = useCallback((patch: Partial<DebtConsolidationParams>) => {
    setParams((previous) => ({ ...previous, ...patch }))
  }, [])

  const reset = useCallback(() => setParams(createDebtConsolidationParams()), [])

  const updateCard = useCallback((id: string, patch: Partial<CreditCardDebt>) => {
    setParams((previous) => ({
      ...previous,
      creditCards: previous.creditCards.map((debt) => (debt.id === id ? { ...debt, ...patch } : debt)),
    }))
  }, [])

  const addCard = useCallback(() => {
    setParams((previous) => ({
      ...previous,
      creditCards: [...previous.creditCards, makeCreditCardDebt(0, 0.189, true)],
    }))
  }, [])

  const removeCard = useCallback((id: string) => {
    setParams((previous) => ({
      ...previous,
      creditCards: previous.creditCards.filter((debt) => debt.id !== id),
    }))
  }, [])

  const updateAuto = useCallback((id: string, patch: Partial<InstallmentDebt>) => {
    setParams((previous) => ({
      ...previous,
      autoLoans: previous.autoLoans.map((debt) => (debt.id === id ? { ...debt, ...patch } : debt)),
    }))
  }, [])

  const addAuto = useCallback(() => {
    setParams((previous) => ({
      ...previous,
      autoLoans: [...previous.autoLoans, makeInstallmentDebt(0, 0, 0)],
    }))
  }, [])

  const removeAuto = useCallback((id: string) => {
    setParams((previous) => ({
      ...previous,
      autoLoans: previous.autoLoans.filter((debt) => debt.id !== id),
    }))
  }, [])

  const updateOther = useCallback((id: string, patch: Partial<OtherDebt>) => {
    setParams((previous) => ({
      ...previous,
      otherLoans: previous.otherLoans.map((debt) => (debt.id === id ? { ...debt, ...patch } : debt)),
    }))
  }, [])

  const addOther = useCallback((description: string) => {
    setParams((previous) => ({
      ...previous,
      otherLoans: [...previous.otherLoans, makeOtherDebt(description, 0, 0, 0)],
    }))
  }, [])

  const removeOther = useCallback((id: string) => {
    setParams((previous) => ({
      ...previous,
      otherLoans: previous.otherLoans.filter((debt) => debt.id !== id),
    }))
  }, [])

  const rows = useMemo(() => buildDebtRows(params), [params])
  const consolidatedRows = useMemo(() => consolidatedLoanRows(params.consolidated), [params.consolidated])

  const currentPayment = useMemo(() => currentTotalPayment(rows), [rows])
  const consolidatedMonthlyPayment = useMemo(
    () => consolidatedPayment(consolidatedRows),
    [consolidatedRows],
  )
  const currentMonths = useMemo(() => currentMonthsToPayoff(rows), [rows])

  const totalInterestSavings = useMemo(() => {
    const current = currentTotalInterest(rows)
    if (current === null) return null
    return current - consolidatedTotalInterest(consolidatedRows)
  }, [rows, consolidatedRows])

  return {
    params,
    update,
    reset,
    rows,
    consolidatedRows,
    currentPayment,
    consolidatedMonthlyPayment,
    currentMonths,
    totalInterestSavings,
    updateCard,
    addCard,
    removeCard,
    updateAuto,
    addAuto,
    removeAuto,
    updateOther,
    addOther,
    removeOther,
  }
}

export const liveDebtTotal = totalDebtBalance
