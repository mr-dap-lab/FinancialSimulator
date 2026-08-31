import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth'
import type { AuthUser } from './auth'

/**
 * Two hardcoded accounts for this mock — not real user credentials, so
 * hardcoding them in client-side source is expected here, unlike the "never
 * store a password" baseline every other form in this app follows. Kept to
 * exactly this one comparison line: the password is never logged, and never
 * written down anywhere else in this file or its comments.
 */
const MOCK_ACCOUNTS: { email: string; password: string; name: string }[] = [
  { email: 'diego@realcapital.pro', password: 'Password1!', name: 'Diego' },
  { email: 'andres@realcapital.pro', password: 'Password1!', name: 'Andres' },
]

/**
 * `sessionStorage`, not `localStorage`: the session should clear when the tab
 * closes rather than persist indefinitely, but a page reload mid-session
 * (unavoidable once `AccessGate` can put a hard login wall in front of the
 * whole app) must not force a relogin. Only the email is stored — never the
 * password — and the full `AuthUser` is re-derived from `MOCK_ACCOUNTS` on
 * restore, exactly as `login()` derives it.
 */
const SESSION_STORAGE_KEY = 'fs.auth.session'

function readStoredEmail(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { email?: unknown }
    return typeof parsed.email === 'string' ? parsed.email : null
  } catch {
    // Storage can be unavailable (private browsing, a locked-down embed) —
    // the session then simply doesn't survive a reload, which is a safe
    // degradation, not a broken one.
    return null
  }
}

function restoreUser(): AuthUser | null {
  const email = readStoredEmail()
  if (!email) return null
  const match = MOCK_ACCOUNTS.find((account) => account.email === email)
  return match ? { uid: match.email, name: match.name, email: match.email, avatarUrl: null } : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(restoreUser)

  const login = useCallback((email: string, password: string): boolean => {
    const match = MOCK_ACCOUNTS.find(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password,
    )
    if (!match) return false
    setUser({ uid: match.email, name: match.name, email: match.email, avatarUrl: null })
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: match.email }))
    } catch {
      // As above — the sign-in still succeeds for this render, it just won't
      // survive a reload.
    }
    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // As above.
    }
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
