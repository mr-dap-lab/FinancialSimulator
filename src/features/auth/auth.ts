import { createContext, useContext } from 'react'

/**
 * The only shape of the signed-in user the rest of the app ever sees.
 *
 * This is a mock: two accounts are hardcoded in `AuthProvider`, there is no
 * backend, and nothing here is a real credential store. Kept to this exact
 * shape — `{ uid, name, email, avatarUrl } | null` plus `login`/`logout` —
 * specifically so that swapping in a real provider (Google via Firebase, or
 * anything else) later only means rewriting this file and `AuthProvider`;
 * every consumer (`AccountControl`, `LoginScreen`) only ever touches this
 * shape, never account-specific detail.
 */
export interface AuthUser {
  uid: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface AuthContextValue {
  user: AuthUser | null
  /** `true` on a match (and the user is now signed in); `false` on no match. */
  login: (email: string, password: string) => boolean
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Reads sign-in state. Nothing in Ahorro, Crédito, or Tarjeta calls this —
 * auth is additive, never a gate — so it is only imported by the top bar's
 * account control and the `/login` screen.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
