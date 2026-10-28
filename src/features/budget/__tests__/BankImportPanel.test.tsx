// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../../context/LocaleProvider'
import { I18nProvider } from '../../../i18n/I18nProvider'
import { en } from '../../../i18n/en'
import type { BankConnection, BankTransaction } from '../../../lib/bankTypes'
import { AuthContext } from '../../auth/auth'
import type { AuthContextValue } from '../../auth/auth'
import { BankImportPanel } from '../components/BankImportPanel'
import { useBudget } from '../useBudget'

const CONNECTION: BankConnection = {
  id: 'conn-1',
  displayName: 'D*** M***',
  status: 'active',
  createdAt: '2026-10-28T12:00:00.000Z',
  lastUsedAt: null,
  usage: null,
  availableAgainAt: null,
  stale: false,
}

const TRANSACTIONS: BankTransaction[] = [
  { date: '2026-10-02', description: 'COMPRA ALMACENES EXITO', amount: -380000, direction: 'debit' },
  { date: '2026-10-05', description: 'PAGO CODENSA ENERGIA', amount: -140000, direction: 'debit' },
  { date: '2026-10-18', description: 'TRANSFERENCIA A JUAN', amount: -200000, direction: 'debit' },
  { date: '2026-10-25', description: 'PAGO NOMINA EMPRESA', amount: 6000000, direction: 'credit' },
]

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

beforeEach(() => localStorage.setItem('fs.language', 'en'))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

function installFetch(overrides: Record<string, () => { status?: number; body: unknown }> = {}) {
  const calls: { key: string; url: URL; init: RequestInit }[] = []
  const routes: Record<string, () => { status?: number; body: unknown }> = {
    'GET /api/bank/connections': () => ({ body: { connections: [CONNECTION] } }),
    'GET /api/bank/accounts': () => ({
      body: {
        accounts: [
          { numberMasked: '••••8901', type: 'savings', name: 'Mi ahorro', currency: 'COP', availableBalance: 1, status: 'ACTIVO' },
        ],
      },
    }),
    'GET /api/bank/transactions': () => ({ body: { transactions: TRANSACTIONS } }),
    'POST /api/bank/imports': () => ({ body: { ok: true } }),
    ...overrides,
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const url = new URL(String(input), 'http://localhost')
      const key = `${init.method ?? 'GET'} ${url.pathname}`
      calls.push({ key, url, init })
      const handler = routes[key]
      if (!handler) return new Response('{}', { status: 404 })
      const { status = 200, body } = handler()
      return new Response(JSON.stringify(body), { status })
    }),
  )
  return calls
}

const auth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  user: { uid: 'u', name: 'Diego', email: 'd@x.co', avatarUrl: null },
  loading: false,
  provider: 'supabase',
  login: async () => true,
  logout: () => {},
  getAccessToken: async () => 'token',
  ...overrides,
})

/** The panel next to a live budget, so the test can see what an import actually changes. */
function Harness() {
  const budget = useBudget()
  return (
    <>
      <BankImportPanel budget={budget} />
      <output data-testid="groceries">{budget.params.food.groceries}</output>
      <output data-testid="electric">{budget.params.utilities.electric}</output>
      <output data-testid="gas">{budget.params.utilities.gas}</output>
    </>
  )
}

function renderPanel(value = auth()) {
  return render(
    <I18nProvider>
      <LocaleProvider>
        <AuthContext.Provider value={value}>
          <Harness />
        </AuthContext.Provider>
      </LocaleProvider>
    </I18nProvider>,
  )
}

async function reachReview() {
  fireEvent.click(await screen.findByRole('button', { name: en.bankImport.open }))
  fireEvent.click(await screen.findByRole('button', { name: en.bankImport.fetch }))
  return screen.findByRole('table')
}

describe('availability', () => {
  it('renders nothing for the mock provider or a signed-out user, and calls nothing', () => {
    const calls = installFetch()
    const { container, rerender } = renderPanel(auth({ provider: 'mock' }))
    expect(container.querySelector('section')).toBeNull()

    rerender(
      <I18nProvider>
        <LocaleProvider>
          <AuthContext.Provider value={auth({ user: null })}>
            <Harness />
          </AuthContext.Provider>
        </LocaleProvider>
      </I18nProvider>,
    )
    expect(container.querySelector('section')).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('points to the connection page when there is no connected account', async () => {
    installFetch({ 'GET /api/bank/connections': () => ({ body: { connections: [] } }) })
    renderPanel()

    fireEvent.click(await screen.findByRole('button', { name: en.bankImport.open }))
    expect(await screen.findByText(en.bankImport.noConnection)).toBeTruthy()
    expect(screen.getByRole('link', { name: en.bankImport.goToConnection }).getAttribute('href')).toBe('#/conexiones')
  })

  it('asks the user to reconnect when the connection is no longer valid', async () => {
    installFetch({ 'GET /api/bank/connections': () => ({ body: { connections: [{ ...CONNECTION, status: 'invalid' }] } }) })
    renderPanel()

    fireEvent.click(await screen.findByRole('button', { name: en.bankImport.open }))
    expect(await screen.findByText(en.bankImport.invalidConnection)).toBeTruthy()
  })
})

describe('review and apply', () => {
  it('requests the chosen account and window, and lists only the expenses with suggested categories', async () => {
    const calls = installFetch()
    renderPanel()
    const table = await reachReview()

    const request = calls.find((call) => call.key === 'GET /api/bank/transactions')!
    expect(request.url.searchParams.get('account')).toBe('••••8901')
    expect(request.url.searchParams.get('connectionId')).toBe('conn-1')
    expect(request.url.searchParams.get('from')).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3) // the salary credit is not an expense
    expect(within(table).queryByText('PAGO NOMINA EMPRESA')).toBeNull()

    const category = (description: string) =>
      (screen.getByLabelText(en.bankImport.categoryOf(description)) as HTMLSelectElement).value
    expect(category('COMPRA ALMACENES EXITO')).toBe('food.groceries')
    expect(category('PAGO CODENSA ENERGIA')).toBe('utilities.electric')
    expect(category('TRANSFERENCIA A JUAN')).toBe('') // unrecognised: left for the user
  })

  it('records the import BEFORE changing the budget, then applies the proposed monthly figures', async () => {
    const calls = installFetch()
    renderPanel()
    await reachReview()

    expect(screen.getByTestId('groceries').textContent).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: en.bankImport.apply }))
    await waitFor(() => expect(screen.getByText(en.bankImport.applied(2))).toBeTruthy())

    const post = calls.find((call) => call.key === 'POST /api/bank/imports')!
    const body = JSON.parse(String(post.init.body))
    expect(body).toMatchObject({ connectionId: 'conn-1', action: 'applied' })
    expect(body.changes.map((change: { field: string }) => change.field)).toEqual([
      'utilities.electric',
      'food.groceries',
    ])

    const groceries = body.changes.find((change: { field: string }) => change.field === 'food.groceries')
    expect(groceries.before).toBe(0)
    expect(screen.getByTestId('groceries').textContent).toBe(String(groceries.after))
    expect(Number(screen.getByTestId('electric').textContent)).toBeGreaterThan(0)
  })

  it('leaves the budget untouched when the trail cannot be written', async () => {
    installFetch({
      'POST /api/bank/imports': () => ({
        status: 503,
        body: { error: { code: 'audit_unavailable', message: 'x' } },
      }),
    })
    renderPanel()
    await reachReview()

    fireEvent.click(screen.getByRole('button', { name: en.bankImport.apply }))

    expect((await screen.findByRole('alert')).textContent).toBe(en.bank.errors.audit_unavailable)
    expect(screen.getByTestId('groceries').textContent).toBe('0')
    expect(screen.getByTestId('electric').textContent).toBe('0')
  })

  it('lets the user re-categorise a movement, and the proposal follows', async () => {
    const calls = installFetch()
    renderPanel()
    await reachReview()

    fireEvent.change(screen.getByLabelText(en.bankImport.categoryOf('TRANSFERENCIA A JUAN')), {
      target: { value: 'utilities.gas' },
    })
    fireEvent.change(screen.getByLabelText(en.bankImport.categoryOf('COMPRA ALMACENES EXITO')), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: en.bankImport.apply }))
    await waitFor(() => expect(calls.some((call) => call.key === 'POST /api/bank/imports')).toBe(true))

    const body = JSON.parse(String(calls.find((call) => call.key === 'POST /api/bank/imports')!.init.body))
    expect(body.changes.map((change: { field: string }) => change.field)).toEqual(['utilities.electric', 'utilities.gas'])
    await waitFor(() => expect(screen.getByTestId('gas').textContent).not.toBe('0'))
    expect(screen.getByTestId('groceries').textContent).toBe('0') // excluded, so untouched
  })

  it('records a discard, and changes nothing, when the user cancels the review', async () => {
    const calls = installFetch()
    renderPanel()
    await reachReview()

    fireEvent.click(screen.getByRole('button', { name: en.bankImport.cancel }))

    await waitFor(() => expect(calls.some((call) => call.key === 'POST /api/bank/imports')).toBe(true))
    const body = JSON.parse(String(calls.find((call) => call.key === 'POST /api/bank/imports')!.init.body))
    expect(body).toMatchObject({ action: 'discarded', changes: [] })
    expect(screen.getByTestId('groceries').textContent).toBe('0')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('keeps the apply button disabled when nothing would change', async () => {
    installFetch({ 'GET /api/bank/transactions': () => ({ body: { transactions: [] } }) })
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: en.bankImport.open }))
    fireEvent.click(await screen.findByRole('button', { name: en.bankImport.fetch }))

    expect(await screen.findByText(en.bankImport.noExpenses)).toBeTruthy()
    expect((screen.getByRole('button', { name: en.bankImport.apply }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows a translated message when the bank rejects the saved credentials', async () => {
    installFetch({
      'GET /api/bank/transactions': () => ({
        status: 422,
        body: { error: { code: 'connection_rejected', message: 'x' } },
      }),
    })
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: en.bankImport.open }))
    fireEvent.click(await screen.findByRole('button', { name: en.bankImport.fetch }))

    expect((await screen.findByRole('alert')).textContent).toBe(en.bank.errors.connection_rejected)
  })
})

describe('accessibility (structural, jsdom)', () => {
  it('the review table has no axe violations', async () => {
    installFetch()
    const { container } = renderPanel()
    await reachReview()
    expect((await axe.run(container)).violations).toEqual([])
  })
})
