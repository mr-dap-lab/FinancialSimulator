import { createContext, useContext } from 'react'

/**
 * The only shape of the signed-in user the rest of the app ever sees.
 *
 * Two providers fill it: `SupabaseAuthProvider` when Supabase is configured
 * (real accounts, created in the Supabase dashboard — there is no public
 * sign-up), and `MockAuthProvider` otherwise (two hardcoded demo accounts, for
 * local work and the test suite). Every consumer (`AccountControl`,
 * `LoginForm`, `AccessGate`, the bank-connection page) only ever touches this
 * shape, never provider-specific detail.
 */
export interface AuthUser {
  uid: string
  name: string
  email: string
  avatarUrl: string | null
}

export type AuthProviderKind = 'mock' | 'supabase'

export interface AuthContextValue {
  user: AuthUser | null
  /** True until a stored session, if any, has been restored. Always false for the mock. */
  loading: boolean
  provider: AuthProviderKind
  /** Resolves `true` on success (the user is now signed in), `false` on any failure. */
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  /** A current access token for calling `api/*`, or `null` when signed out or on the mock. */
  getAccessToken: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Reads sign-in state. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
