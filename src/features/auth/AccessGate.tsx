import type { ReactNode } from 'react'
import backgroundImage from '../../assets/access-gate-bg.jpg'
import { useT } from '../../i18n/i18n'
import { AccessGateScene } from './AccessGateScene'
import { LoginForm } from './LoginForm'
import { useAuth } from './auth'

/**
 * Read once, at build time — Vite inlines `VITE_`-prefixed env vars as a
 * literal at bundle time, so this never re-checks `process.env` at runtime.
 * Default `true` lives in the repo's own `.env`; Vercel's per-environment
 * variables (see the README's deployment section) override it, so opening
 * the app up publicly later is a redeploy with one flipped value, not a code
 * change.
 */
const REQUIRE_LOGIN = import.meta.env.VITE_REQUIRE_LOGIN === 'true'

/**
 * Wraps the entire app, above the router. Builds directly on Prompt 1's mock
 * auth — same `useAuth()`, same two hardcoded accounts, same `LoginForm` the
 * optional `/login` page uses — the only thing this adds is a second place
 * that form can appear, and *when* it's unavoidable:
 *
 * - Flag off: renders `children` immediately. Auth stays exactly as optional
 *   as it was in Prompt 1.
 * - Flag on, no session: renders a full-screen overlay *instead of*
 *   `children` — not on top of it. `Shell` (and its router) never mounts, so
 *   there is no route behind the gate to reach, and nothing to Tab into but
 *   the form itself — a focus trap falls out of that for free, with no extra
 *   keyboard-cycling logic needed.
 * - Flag on, active session: renders `children` normally; the top bar's
 *   existing account menu and sign-out are untouched.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const t = useT()

  if (!REQUIRE_LOGIN || user) {
    return <>{children}</>
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-gate-title"
      aria-describedby="access-gate-subtitle"
      className="fixed inset-0 z-50 overflow-y-auto bg-black"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
      <AccessGateScene />

      <div className="relative flex min-h-full items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-surface-container/90 p-6 shadow-e3 backdrop-blur-md sm:p-8">
          <h2 id="access-gate-title" className="text-2xl font-normal text-on-surface">
            {t.auth.gateTitle}
          </h2>
          <p id="access-gate-subtitle" className="mt-2 text-sm text-on-surface-variant">
            {t.auth.gateSubtitle}
          </p>

          <div className="mt-8">
            <LoginForm onSuccess={() => {}} />
          </div>
        </div>
      </div>
    </div>
  )
}
