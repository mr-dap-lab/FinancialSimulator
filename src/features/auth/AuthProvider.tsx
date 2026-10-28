import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { MockAuthProvider } from './MockAuthProvider'
import { SupabaseAuthProvider } from './SupabaseAuthProvider'

/**
 * Picks the auth backend once, from configuration: real Supabase accounts when
 * `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set, the two hardcoded
 * demo accounts otherwise. Consumers never know which — see `auth.ts`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return supabase ? (
    <SupabaseAuthProvider client={supabase}>{children}</SupabaseAuthProvider>
  ) : (
    <MockAuthProvider>{children}</MockAuthProvider>
  )
}
