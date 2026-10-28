import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { AuthContext } from './auth'
import type { AuthUser } from './auth'

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null
  const email = user.email ?? ''
  const metadataName = user.user_metadata?.name
  return {
    uid: user.id,
    name: typeof metadataName === 'string' && metadataName ? metadataName : email.split('@')[0],
    email,
    avatarUrl: null,
  }
}

/**
 * Real accounts, backed by Supabase Auth. Accounts are created by an admin in
 * the Supabase dashboard (Authentication → Users); the app has no sign-up.
 *
 * `loading` is true until the stored session has been read, so `AccessGate`
 * does not flash the login wall at someone who is in fact still signed in.
 */
export function SupabaseAuthProvider({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void client.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(toAuthUser(data.session?.user ?? null))
      setLoading(false)
    })

    // Only sets state in here — supabase-js can deadlock if this callback
    // awaits another auth call.
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null))
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      return !error
    },
    [client],
  )

  const logout = useCallback(() => {
    // `local`: end this tab's session only, not every device the user is on.
    void client.auth.signOut({ scope: 'local' })
  }, [client])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data } = await client.auth.getSession()
    return data.session?.access_token ?? null
  }, [client])

  const value = useMemo(
    () => ({ user, loading, provider: 'supabase' as const, login, logout, getAccessToken }),
    [user, loading, login, logout, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
