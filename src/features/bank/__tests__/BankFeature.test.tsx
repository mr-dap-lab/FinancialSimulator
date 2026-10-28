// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import axe from 'axe-core'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../../i18n/I18nProvider'
import { en } from '../../../i18n/en'
import type { AuditEvent, BankConnection } from '../../../lib/bankTypes'
import { AuthContext } from '../../auth/auth'
import type { AuthContextValue } from '../../auth/auth'
import { BankFeature } from '../BankFeature'

const PASSWORD = 'S3cret-bank-pass!'
const ITEMS = ['ownership', 'responsibility', 'thirdParty', 'dataProcessing'].map((id) => ({
  id,
  text: `Consent text for ${id}`,
}))

const CONNECTION: BankConnection = {
  id: 'conn-uuid-1',
  displayName: 'J*** P*** G***',
  status: 'active',
  createdAt: '2026-10-28T12:00:00.000Z',
  lastUsedAt: '2026-10-28T12:00:00.000Z',
  usage: { signInsToday: 1, dailyLimit: null, resetsAt: null },
  availableAgainAt: null,
  stale: false,
}

beforeAll(() => {
  // Same jsdom stand-ins the other component tests need to mount at all.
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

/** A scriptable `fetch`: one handler per "METHOD /path", recording every call. */
function installFetch(routes: Record<string, (init: RequestInit) => { status?: number; body: unknown }>) {
  const calls: { key: string; init: RequestInit }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const url = new URL(String(input), 'http://localhost')
      const key = `${init.method ?? 'GET'} ${url.pathname}`
      calls.push({ key, init })
      const handler = routes[key]
      if (!handler) return new Response(JSON.stringify({ error: { code: 'not_found', message: key } }), { status: 404 })
      const { status = 200, body } = handler(init)
      return new Response(JSON.stringify(body), { status })
    }),
  )
  return calls
}

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: { uid: 'u1', name: 'Diego', email: 'diego@example.com', avatarUrl: null },
    loading: false,
    provider: 'supabase',
    login: async () => true,
    logout: () => {},
    getAccessToken: async () => 'token-123',
    ...overrides,
  }
}

function renderPage(value: AuthContextValue = auth(), children: ReactNode = <BankFeature onRequestSignIn={() => {}} />) {
  return render(
    <I18nProvider>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </I18nProvider>,
  )
}

const noEvents: AuditEvent[] = []

beforeEach(() => {
  localStorage.setItem('fs.language', 'en')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
})

async function reachCredentials() {
  fireEvent.click(await screen.findByRole('button', { name: en.bank.start }))
  for (const item of ITEMS) fireEvent.click(await screen.findByLabelText(item.text))
  fireEvent.click(screen.getByRole('button', { name: en.bank.continue }))
  return screen.findByLabelText(en.bank.username)
}

const baseRoutes = {
  'GET /api/bank/connections': () => ({ body: { connections: [] } }),
  'GET /api/bank/audit': () => ({ body: { events: noEvents } }),
  'GET /api/bank/consent': () => ({ body: { version: 'v1', locale: 'en', items: ITEMS, hash: 'h' } }),
}

describe('availability', () => {
  it('explains, and calls nothing, when the mock auth provider is active', async () => {
    const calls = installFetch(baseRoutes)
    renderPage(auth({ provider: 'mock' }))

    expect(await screen.findByText(en.bank.unavailable)).toBeTruthy()
    expect(calls).toHaveLength(0)
  })

  it('asks a signed-out visitor to sign in', async () => {
    const calls = installFetch(baseRoutes)
    const onRequestSignIn = vi.fn()
    renderPage(auth({ user: null }), <BankFeature onRequestSignIn={onRequestSignIn} />)

    fireEvent.click(await screen.findByRole('button', { name: en.auth.signIn }))
    expect(onRequestSignIn).toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })
})

describe('connecting an account', () => {
  it('shows the intro, then requires every consent item before continuing', async () => {
    installFetch(baseRoutes)
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: en.bank.start }))
    const continueButton = (await screen.findByRole('button', { name: en.bank.continue })) as HTMLButtonElement
    expect(continueButton.disabled).toBe(true)

    for (const item of ITEMS.slice(0, 3)) fireEvent.click(await screen.findByLabelText(item.text))
    expect(continueButton.disabled).toBe(true) // one short

    fireEvent.click(await screen.findByLabelText(ITEMS[3].text))
    expect(continueButton.disabled).toBe(false)
  })

  it('sends the consent version and every accepted item with the credentials, then clears the password', async () => {
    const calls = installFetch({
      ...baseRoutes,
      'POST /api/bank/connections': () => ({ status: 201, body: { connection: CONNECTION } }),
    })
    renderPage()

    const username = await reachCredentials()
    fireEvent.change(username, { target: { value: 'jperez' } })
    const password = screen.getByLabelText(en.bank.bankPassword) as HTMLInputElement
    fireEvent.change(password, { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: en.bank.connect }))

    expect(await screen.findByText('J*** P*** G***')).toBeTruthy()

    const post = calls.find((call) => call.key === 'POST /api/bank/connections')!
    expect(JSON.parse(String(post.init.body))).toEqual({
      username: 'jperez',
      password: PASSWORD,
      locale: 'en',
      consent: { version: 'v1', accepted: ITEMS.map((item) => item.id) },
    })
    expect((post.init.headers as Record<string, string>).authorization).toBe('Bearer token-123')

    // The password lived in component state only: never in web storage.
    expect(JSON.stringify({ ...localStorage })).not.toContain(PASSWORD)
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(PASSWORD)
  })

  it('shows the bank-rejected message, keeps the username and clears the password', async () => {
    installFetch({
      ...baseRoutes,
      'POST /api/bank/connections': () => ({
        status: 422,
        body: { error: { code: 'connection_rejected', message: 'internal wording that must not be shown' } },
      }),
    })
    renderPage()

    const username = (await reachCredentials()) as HTMLInputElement
    fireEvent.change(username, { target: { value: 'jperez' } })
    fireEvent.change(screen.getByLabelText(en.bank.bankPassword), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: en.bank.connect }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(en.bank.errors.connection_rejected)
    expect(document.body.textContent).not.toContain('internal wording')
    expect(username.value).toBe('jperez')
    expect((screen.getByLabelText(en.bank.bankPassword) as HTMLInputElement).value).toBe('')
  })

  it('turns a Retry-After into minutes for a busy service', async () => {
    installFetch({
      ...baseRoutes,
      'POST /api/bank/connections': () => ({
        status: 429,
        body: { error: { code: 'service_busy', message: 'x', retryAfter: 120 } },
      }),
    })
    renderPage()

    fireEvent.change(await reachCredentials(), { target: { value: 'jperez' } })
    fireEvent.change(screen.getByLabelText(en.bank.bankPassword), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: en.bank.connect }))

    expect((await screen.findByRole('alert')).textContent).toBe(en.bank.errors.service_busy(2))
  })

  it('refuses to continue when the consent text cannot be loaded', async () => {
    installFetch({ ...baseRoutes, 'GET /api/bank/consent': () => ({ status: 500, body: {} }) })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: en.bank.start }))
    expect((await screen.findByRole('alert')).textContent).toBe(en.bank.consentLoadError)
    expect((screen.getByRole('button', { name: en.bank.continue }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('masks the credential fields from session recordings and password managers', async () => {
    installFetch(baseRoutes)
    renderPage()

    const username = await reachCredentials()
    const password = screen.getByLabelText(en.bank.bankPassword)
    for (const field of [username, password]) {
      expect(field.getAttribute('data-clarity-mask')).toBe('true')
      expect(field.getAttribute('autocomplete')).toBe('off')
    }
  })
})

describe('a connected account', () => {
  const routes = {
    ...baseRoutes,
    'GET /api/bank/connections': () => ({ body: { connections: [CONNECTION] } }),
  }

  it('lists accounts only when asked, with masked numbers', async () => {
    const calls = installFetch({
      ...routes,
      'GET /api/bank/accounts': () => ({
        body: {
          accounts: [
            { numberMasked: '••••8901', type: 'savings', name: 'Mi ahorro', currency: 'COP', availableBalance: 4200000, status: 'ACTIVO' },
          ],
        },
      }),
    })
    renderPage()

    await screen.findByText('J*** P*** G***')
    expect(calls.some((call) => call.key === 'GET /api/bank/accounts')).toBe(false) // never automatic

    fireEvent.click(screen.getByRole('button', { name: en.bank.showAccounts }))
    expect(await screen.findByText(/••••8901/)).toBeTruthy()
    expect(screen.getByText(/Mi ahorro/)).toBeTruthy()
  })

  it('asks for confirmation, then disconnects and offers to connect again', async () => {
    const calls = installFetch({
      ...routes,
      'DELETE /api/bank/connections': () => ({ body: { ok: true } }),
    })
    renderPage()

    await screen.findByText('J*** P*** G***')
    fireEvent.click(screen.getByRole('button', { name: en.bank.disconnect }))
    expect(calls.some((call) => call.key === 'DELETE /api/bank/connections')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: en.bank.disconnectYes }))

    expect(await screen.findByRole('button', { name: en.bank.start })).toBeTruthy()
    expect(calls.find((call) => call.key === 'DELETE /api/bank/connections')).toBeTruthy()
  })

  it('tells the user to reconnect when the bank no longer accepts the saved credentials', async () => {
    installFetch({
      ...baseRoutes,
      'GET /api/bank/connections': () => ({ body: { connections: [{ ...CONNECTION, status: 'invalid' }] } }),
    })
    renderPage()

    expect(await screen.findByText(en.bank.invalidHelp)).toBeTruthy()
    expect(screen.queryByRole('button', { name: en.bank.showAccounts })).toBeNull()
  })
})

describe('audit log', () => {
  it('renders the trail with translated events, results and detail', async () => {
    const events: AuditEvent[] = [
      { id: 'a2', ts: '2026-10-28T12:00:02.000Z', actor: 'user', eventType: 'connection.rejected', connectionId: null, outcome: 'failure', errorCode: 'connection_rejected', metadata: {} },
      { id: 'a1', ts: '2026-10-28T12:00:01.000Z', actor: 'system', eventType: 'connection.status_changed', connectionId: 'c', outcome: 'success', errorCode: null, metadata: { from: 'active', to: 'invalid' } },
    ]
    installFetch({ ...baseRoutes, 'GET /api/bank/audit': () => ({ body: { events } }) })
    renderPage()

    const table = await screen.findByRole('table')
    expect(within(table).getByText(en.bank.auditEvents['connection.rejected'])).toBeTruthy()
    expect(within(table).getByText(en.bank.auditFailure)).toBeTruthy()
    expect(within(table).getByText(new RegExp(`active → invalid · ${en.bank.auditAutomatic}`))).toBeTruthy()
    expect(within(table).getByText(en.bank.errors.connection_rejected)).toBeTruthy()
  })

  it('shows an empty state', async () => {
    installFetch(baseRoutes)
    renderPage()
    await waitFor(() => expect(screen.getByText(en.bank.auditEmpty)).toBeTruthy())
  })
})

describe('accessibility (structural, jsdom)', () => {
  it('the consent step and the credentials form have no axe violations', async () => {
    installFetch(baseRoutes)
    const { container } = renderPage()

    fireEvent.click(await screen.findByRole('button', { name: en.bank.start }))
    await screen.findByLabelText(ITEMS[0].text)
    expect((await axe.run(container)).violations).toEqual([])

    for (const item of ITEMS) fireEvent.click(screen.getByLabelText(item.text))
    fireEvent.click(screen.getByRole('button', { name: en.bank.continue }))
    await screen.findByLabelText(en.bank.username)
    expect((await axe.run(container)).violations).toEqual([])
  })
})
