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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  const login = useCallback((email: string, password: string): boolean => {
    const match = MOCK_ACCOUNTS.find(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password,
    )
    if (!match) return false
    setUser({ uid: match.email, name: match.name, email: match.email, avatarUrl: null })
    return true
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
