/**
 * Hard caps on every array the user grows one row at a time (rate tiers,
 * extra payments, deferred purchases, recurring expenses).
 *
 * None of today's UI lets someone paste in hundreds of rows at once, but
 * these caps exist regardless of how a row gets added: without one, a script,
 * a future bulk-import feature, or just a lot of clicking could grow one of
 * these arrays large enough to noticeably slow the render (every row re-runs
 * `simulate`/`amortize`/`simulateCard`, and renders its own set of inputs).
 * Each value is generous for any real scenario and small enough to stay fast.
 */
export const MAX_RATE_TIERS = 12
export const MAX_EXTRA_PAYMENTS = 24
export const MAX_DEFERRED_PURCHASES = 30
export const MAX_RECURRING_EXPENSES = 20
export const MAX_CREDIT_CARD_DEBTS = 10
export const MAX_CREDIT_CARDS = 8
export const MAX_AUTO_LOAN_DEBTS = 10
export const MAX_OTHER_LOAN_DEBTS = 10
export const MAX_BUDGET_OTHER_CATEGORIES = 15
