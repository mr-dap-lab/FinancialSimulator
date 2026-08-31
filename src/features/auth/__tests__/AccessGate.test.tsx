// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * `VITE_REQUIRE_LOGIN` is read once, at module-evaluation time
 * (`AccessGate.tsx` binds it to a top-level constant — see that file's own
 * doc comment on why). `vi.stubEnv` only affects a module the *next* time it
 * is evaluated, so `<App />` is imported dynamically here, after stubbing,
 * rather than via a static top-of-file `import` — a static import would be
 * hoisted ahead of the stub and pick up `.env.test`'s "false" instead.
 */
let App: typeof import('../../../App').default

beforeAll(async () => {
  vi.stubEnv('VITE_REQUIRE_LOGIN', 'true')

  // Same jsdom stand-ins `a11y.test.tsx` needs to mount the app at all —
  // duplicated here rather than shared, since this file's module registry is
  // isolated from that one's.
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

  class StubResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver ??= StubResizeObserver

  const internals = globalThis.ElementInternals?.prototype
  if (internals) {
    internals.setFormValue ??= () => {}
    internals.setValidity ??= () => {}
    internals.checkValidity ??= () => true
    internals.reportValidity ??= () => true
  }

  ;({ default: App } = await import('../../../App'))
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

function signIn(container: HTMLElement) {
  const email = container.querySelector('input[type="email"]') as HTMLInputElement
  const password = container.querySelector('input[type="password"]') as HTMLInputElement
  fireEvent.change(email, { target: { value: 'diego@realcapital.pro' } })
  fireEvent.change(password, { target: { value: 'Password1!' } })
  fireEvent.submit(container.querySelector('form') as HTMLFormElement)
}

describe('AccessGate — VITE_REQUIRE_LOGIN=true', () => {
  it('blocks the app behind a modal dialog when there is no session', () => {
    const { container } = render(<App />)
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    // Nothing behind the gate is in the DOM at all — not the tab strip...
    expect(container.querySelector('a[href="#/ahorro"]')).toBeNull()
    // ...and no escape hatch either: exactly one button (the submit), not two.
    expect(dialog?.querySelectorAll('button').length).toBe(1)
  })

  it('rejects an unknown email/password with one generic error and keeps the gate up', () => {
    const { container } = render(<App />)
    const email = container.querySelector('input[type="email"]') as HTMLInputElement
    const password = container.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(email, { target: { value: 'nobody@realcapital.pro' } })
    fireEvent.change(password, { target: { value: 'wrong' } })
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
  })

  it('reveals the app after a successful sign-in', () => {
    const { container } = render(<App />)
    signIn(container)

    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.querySelector('a[href="#/ahorro"]')).not.toBeNull()
  })

  it('re-shows the gate immediately after signing out', () => {
    const { container } = render(<App />)
    signIn(container)
    expect(container.querySelector('[role="dialog"]')).toBeNull()

    // The account button's aria-label is the only one mentioning the signed-in
    // user's name — matching on that rather than the label text keeps this
    // test independent of which language jsdom's navigator.language resolves.
    const accountButton = [...container.querySelectorAll('button')].find((b) =>
      (b.getAttribute('aria-label') ?? '').includes('Diego'),
    ) as HTMLButtonElement
    fireEvent.click(accountButton)
    // There is exactly one menu item in the account dropdown: sign out.
    const signOutButton = container.querySelector('button[role="menuitem"]') as HTMLButtonElement
    fireEvent.click(signOutButton)

    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect(container.querySelector('a[href="#/ahorro"]')).toBeNull()
  })

  it('restores the session across a fresh render, via sessionStorage rather than localStorage', () => {
    expect(localStorage.getItem('fs.auth.session')).toBeNull()

    const first = render(<App />)
    signIn(first.container)
    expect(sessionStorage.getItem('fs.auth.session')).toContain('diego@realcapital.pro')
    first.unmount()

    // A brand-new render simulates a page reload with sessionStorage intact.
    const second = render(<App />)
    expect(second.container.querySelector('[role="dialog"]')).toBeNull()
    expect(second.container.querySelector('a[href="#/ahorro"]')).not.toBeNull()
  })
})
