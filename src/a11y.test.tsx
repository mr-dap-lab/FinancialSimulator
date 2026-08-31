// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import App from './App'

/**
 * A dev-only guard against accessibility regressions: renders each tab and
 * fails the run if axe-core finds a structural violation (a missing label, an
 * invalid ARIA attribute, a duplicate id, broken heading order, and so on).
 *
 * This runs under jsdom, which has no real layout or paint engine, so axe's
 * checks that need actual rendered geometry — most importantly
 * `color-contrast` — cannot run here and are not exercised by this file; axe
 * skips them itself when an element reports zero size, which every element
 * does under jsdom. Real contrast checking needs a real browser (Lighthouse
 * CI, or axe run inside Playwright/Cypress) and is a reasonable next step
 * beyond this smoke test, not a substitute for it.
 */

beforeAll(() => {
  // Neither JSDOM API exists by default; the theme and reduced-motion hooks
  // (`window.matchMedia`) and the schedule table's virtualiser
  // (`ResizeObserver`) need a stand-in to mount at all under jsdom.
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

  // jsdom's `ElementInternals` is missing the form-association methods real
  // browsers implement — `@material/web`'s `<md-icon-button>` (a
  // form-associated custom element, via its `FormSubmitterElement` mixin)
  // calls `setFormValue` on every construction. With only a handful of
  // `HelpPopover` instances mounted per render this went unnoticed; retrofitting
  // a `(?)` popover onto every field (Prompt 2) multiplies how many
  // `<md-icon-button>`s each test constructs, past whatever silently tolerated
  // it before, into an uncaught exception that fails the run.
  const internals = globalThis.ElementInternals?.prototype
  if (internals) {
    internals.setFormValue ??= () => {}
    internals.setValidity ??= () => {}
    internals.checkValidity ??= () => true
    internals.reportValidity ??= () => true
  }
})

afterEach(cleanup)

async function axeViolations(container: HTMLElement) {
  const results = await axe.run(container)
  return results.violations
}

async function goToTab(container: HTMLElement, label: string) {
  const link = [...container.querySelectorAll('a')].find((a) => a.textContent === label)
  link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function clickButton(container: HTMLElement, name: string) {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === name || candidate.getAttribute('aria-label') === name,
  )
  button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

describe('accessibility (structural, jsdom)', () => {
  it('Ahorro has no axe violations', async () => {
    const { container } = render(<App />)
    expect(await axeViolations(container)).toEqual([])
  })

  it('Meta de ahorro has no axe violations', async () => {
    const { container } = render(<App />)
    await goToTab(container, 'Meta de ahorro')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Retiro has no axe violations', async () => {
    const { container } = render(<App />)
    await goToTab(container, 'Retiro')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Crédito has no axe violations', async () => {
    const { container } = render(<App />)
    await goToTab(container, 'Crédito')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Consolidación de deudas has no axe violations', async () => {
    const { container } = render(<App />)
    await goToTab(container, 'Consolidación de deudas')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Tarjeta de crédito has no axe violations', async () => {
    const { container } = render(<App />)
    await goToTab(container, 'Tarjeta de crédito')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Mi Presupuesto has no axe violations', async () => {
    const { container } = render(<App />)
    await goToTab(container, 'Mi Presupuesto')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Ayuda (empty state) has no axe violations', async () => {
    const { container } = render(<App />)
    clickButton(container, 'Ayuda')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Ayuda with a field selected has no axe violations', async () => {
    const { container } = render(<App />)
    clickButton(container, 'Ayuda')
    clickButton(container, 'Ahorro')
    const fieldLink = [...container.querySelectorAll('a')].find((a) => a.textContent === 'Aporte mensual')
    fieldLink?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(await axeViolations(container)).toEqual([])
  })
})
