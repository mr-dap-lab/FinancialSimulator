import { useCallback, useMemo, useState } from 'react'
import { toMonthlyRate } from '../../lib/amortize'
import { MAX_CREDIT_CARDS } from '../../lib/limits'
import {
  compareStrategies,
  createCardParams,
  createCardProfile,
  simulateCard,
  summarizeCard,
} from '../../lib/creditCard'
import type {
  CardFranchise,
  CardMonth,
  CardProfile,
  CardTotals,
  CreditCardParams,
  StrategyOutcome,
} from '../../lib/creditCard'

export interface CreditCardController {
  /** Every card the user has added, for the card switcher. */
  cards: CardProfile[]
  activeCardId: string
  selectCard: (id: string) => void
  /** `name` comes from the component so this hook never builds a sentence. */
  addCard: (name: string) => void
  removeCard: (id: string) => void
  renameCard: (id: string, name: string) => void
  setFranchise: (id: string, franchise: CardFranchise) => void

  /** The active card's own slice — same shape this hook always returned, so
   * every consumer below (parameters, purchases, summary, charts, schedule)
   * needed no changes to become multi-card aware. */
  params: CreditCardParams
  update: (patch: Partial<CreditCardParams>) => void
  reset: () => void
  rows: CardMonth[]
  totals: CardTotals
  monthlyRate: number
  comparison: Record<'minimum' | 'fixed' | 'full', StrategyOutcome>
  warnings: CardWarning[]
}

/** Translatable descriptors — the hook stays language-agnostic. */
export type CardWarning =
  | { code: 'purchasesBeyondHorizon'; months: number }
  | { code: 'invertedRange' }
  | { code: 'overLimit'; month: number }

function validate(params: CreditCardParams, rows: CardMonth[]): CardWarning[] {
  const warnings: CardWarning[] = []

  const late = params.deferredPurchases.filter((purchase) => purchase.purchaseMonth > params.months)
  if (late.length > 0) {
    warnings.push({ code: 'purchasesBeyondHorizon', months: params.months })
  }

  const inverted = params.recurringExpenses.filter(
    (expense) => expense.endMonth < expense.startMonth,
  )
  if (inverted.length > 0) {
    warnings.push({ code: 'invertedRange' })
  }

  const overLimit = rows.find((row) => row.utilization > 1)
  if (overLimit) {
    warnings.push({ code: 'overLimit', month: overLimit.month })
  }

  return warnings
}

interface CardsState {
  cards: CardProfile[]
  activeId: string
}

// Seeded so the app is never empty on first load — same convention as the
// seed purchases in `createCardParams`, kept as plain text rather than
// translated: a default name is just as editable as a user-typed one.
function createInitialState(): CardsState {
  const first = createCardProfile('Tarjeta 1')
  return { cards: [first], activeId: first.id }
}

/**
 * Tarjeta de crédito owns a *list* of cards, each with its own independent
 * `CreditCardParams` — a second card's purchases, strategy, and limit never
 * affect the first. Only the active card is simulated: every downstream
 * consumer (parameters panel, purchases, summary, charts, schedule) reads
 * `params`/`rows`/`totals`/etc. exactly as it did before this file supported
 * more than one card, scoped to whichever card is currently selected.
 */
export function useCreditCard(): CreditCardController {
  const [state, setState] = useState<CardsState>(createInitialState)

  const selectCard = useCallback((id: string) => {
    setState((previous) =>
      previous.cards.some((card) => card.id === id) ? { ...previous, activeId: id } : previous,
    )
  }, [])

  const addCard = useCallback((name: string) => {
    setState((previous) => {
      if (previous.cards.length >= MAX_CREDIT_CARDS) return previous
      const created = createCardProfile(name)
      return { cards: [...previous.cards, created], activeId: created.id }
    })
  }, [])

  const removeCard = useCallback((id: string) => {
    setState((previous) => {
      if (previous.cards.length <= 1) return previous
      const remaining = previous.cards.filter((card) => card.id !== id)
      const activeId = previous.activeId === id ? remaining[0].id : previous.activeId
      return { cards: remaining, activeId }
    })
  }, [])

  const renameCard = useCallback((id: string, name: string) => {
    setState((previous) => ({
      ...previous,
      cards: previous.cards.map((card) => (card.id === id ? { ...card, name } : card)),
    }))
  }, [])

  const setFranchise = useCallback((id: string, franchise: CardFranchise) => {
    setState((previous) => ({
      ...previous,
      cards: previous.cards.map((card) => (card.id === id ? { ...card, franchise } : card)),
    }))
  }, [])

  const update = useCallback((patch: Partial<CreditCardParams>) => {
    setState((previous) => ({
      ...previous,
      cards: previous.cards.map((card) =>
        card.id === previous.activeId ? { ...card, params: { ...card.params, ...patch } } : card,
      ),
    }))
  }, [])

  const reset = useCallback(() => {
    setState((previous) => ({
      ...previous,
      cards: previous.cards.map((card) =>
        card.id === previous.activeId ? { ...card, params: createCardParams() } : card,
      ),
    }))
  }, [])

  const activeCard = state.cards.find((card) => card.id === state.activeId) ?? state.cards[0]
  const params = activeCard.params

  const rows = useMemo(() => simulateCard(params), [params])
  const totals = useMemo(() => summarizeCard(rows, params), [rows, params])

  // Computed in the model so the summary and charts share one source.
  const comparison = useMemo(() => compareStrategies(params), [params])

  const monthlyRate = useMemo(
    () => toMonthlyRate(params.rate, params.rateConvention),
    [params.rate, params.rateConvention],
  )

  const warnings = useMemo(() => validate(params, rows), [params, rows])

  return {
    cards: state.cards,
    activeCardId: activeCard.id,
    selectCard,
    addCard,
    removeCard,
    renameCard,
    setFranchise,
    params,
    update,
    reset,
    rows,
    totals,
    monthlyRate,
    comparison,
    warnings,
  }
}
