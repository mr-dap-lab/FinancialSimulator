import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The browser-side Supabase client, or `null` when it is not configured
 * (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` unset) — in which case the
 * app falls back to the mock accounts in `MockAuthProvider`, exactly as before.
 *
 * Both values are public by design: the anon key only grants what Row Level
 * Security allows. The service-role key and the Croma key are NOT `VITE_`
 * variables and never reach this bundle.
 *
 * The session lives in `sessionStorage`, not Supabase's default
 * `localStorage`, to keep the access gate's existing guarantee: a reload
 * mid-session stays signed in, closing the tab signs out.
 */
function sessionStore(): Storage | undefined {
  try {
    return window.sessionStorage
  } catch {
    return undefined // Storage blocked: supabase-js falls back to memory.
  }
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: sessionStore(),
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null
