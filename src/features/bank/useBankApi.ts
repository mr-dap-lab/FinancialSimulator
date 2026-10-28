import { useCallback, useMemo } from 'react'
import { useAuth } from '../auth/auth'
import { BankApiError, bankApi } from './bankApi'

/**
 * `bankApi` with the signed-in user's token filled in. Every call fetches a
 * fresh token (Supabase refreshes it when it is close to expiring), and a
 * missing one — signed out, or the mock provider — fails as `unauthorized`
 * before any request is made.
 */
export function useBankApi() {
  const { getAccessToken } = useAuth()

  const withToken = useCallback(
    async <T>(call: (token: string) => Promise<T>): Promise<T> => {
      const token = await getAccessToken()
      if (!token) throw new BankApiError(401, 'unauthorized', 'No session')
      return call(token)
    },
    [getAccessToken],
  )

  // Memoised: components list this object as an effect dependency, so a new
  // identity on every render would re-run those effects forever.
  return useMemo(
    () => ({
      listConnections: () => withToken(bankApi.listConnections),
      createConnection: (body: Parameters<typeof bankApi.createConnection>[1]) =>
        withToken((token) => bankApi.createConnection(token, body)),
      deleteConnection: (id: string) => withToken((token) => bankApi.deleteConnection(token, id)),
      accounts: (id: string) => withToken((token) => bankApi.accounts(token, id)),
      transactions: (query: Parameters<typeof bankApi.transactions>[1]) =>
        withToken((token) => bankApi.transactions(token, query)),
      recordImport: (body: Parameters<typeof bankApi.recordImport>[1]) =>
        withToken((token) => bankApi.recordImport(token, body)),
      audit: () => withToken(bankApi.audit),
    }),
    [withToken],
  )
}

export type BankApi = ReturnType<typeof useBankApi>
