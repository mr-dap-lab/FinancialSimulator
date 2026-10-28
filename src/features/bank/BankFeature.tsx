import { useCallback, useEffect, useState } from 'react'
import { Button, Card, FeatureIntro } from '../../components/ui'
import { useT } from '../../i18n/i18n'
import type { BankConnection } from '../../lib/bankTypes'
import { useAuth } from '../auth/auth'
import { AuditLogCard } from './components/AuditLogCard'
import { ConnectWizard } from './components/ConnectWizard'
import { ConnectionCard } from './components/ConnectionCard'
import { bankErrorMessage } from './errorMessage'
import { useBankApi } from './useBankApi'

const BankIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M12 2 2 7v2h20V7zM4 10v7H2v3h20v-3h-2v-7h-2v7h-3v-7h-2v7h-2v-7H9v7H6v-7z" />
  </svg>
)

/**
 * The bank-connection screen (`#/conexiones`). Only usable with real
 * (Supabase) accounts: the connection runs through `api/bank/*`, which needs a
 * verified user. With the mock provider, or signed out, it says so instead of
 * offering something that cannot work.
 */
export function BankFeature({ onRequestSignIn }: { onRequestSignIn: () => void }) {
  const { user, provider, loading } = useAuth()
  const t = useT()

  const intro = (
    <FeatureIntro icon={<BankIcon />} title={t.bank.introTitle} description={t.bank.introDescription} />
  )

  if (loading) {
    return <p role="status" className="text-sm text-on-surface-variant">{t.bank.loading}</p>
  }

  if (provider !== 'supabase') {
    return (
      <div className="space-y-4">
        {intro}
        <p role="status" className="rounded-md bg-surface-low px-4 py-3 text-sm text-on-surface-variant">
          {t.bank.unavailable}
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        {intro}
        <Card>
          <p className="text-sm text-on-surface-variant">{t.bank.signInRequired}</p>
          <Button variant="filled" className="mt-4" onClick={onRequestSignIn}>
            {t.auth.signIn}
          </Button>
        </Card>
      </div>
    )
  }

  return <BankConnections intro={intro} />
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; connections: BankConnection[] }

function BankConnections({ intro }: { intro: React.ReactNode }) {
  const t = useT()
  const api = useBankApi()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [auditKey, setAuditKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    api
      .listConnections()
      .then((connections) => active && setState({ status: 'ready', connections }))
      .catch((error) => active && setState({ status: 'error', error }))
    return () => {
      active = false
    }
  }, [api, reloadKey])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setReloadKey((value) => value + 1)
  }, [])

  const bumpAudit = useCallback(() => setAuditKey((value) => value + 1), [])

  return (
    // The whole page is masked in session recordings (Microsoft Clarity runs on
    // this site): it shows bank balances and takes bank credentials.
    <div className="space-y-4 sm:space-y-6" data-clarity-mask="true">
      {intro}

      {/* Announces the outcome of connect/disconnect to screen readers. */}
      <p role="status" className="sr-only">
        {notice}
      </p>

      {state.status === 'loading' && (
        <p role="status" className="text-sm text-on-surface-variant">
          {t.bank.loading}
        </p>
      )}

      {state.status === 'error' && (
        <Card>
          <p role="alert" className="text-sm text-on-surface">
            {bankErrorMessage(state.error, t)}
          </p>
          <Button variant="outlined" className="mt-4" onClick={retry}>
            {t.bank.retry}
          </Button>
        </Card>
      )}

      {state.status === 'ready' && state.connections.length === 0 && (
        <ConnectWizard
          api={api}
          onConnected={(connection) => {
            setState({ status: 'ready', connections: [connection] })
            setNotice(t.bank.connected)
            bumpAudit()
          }}
        />
      )}

      {state.status === 'ready' &&
        state.connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            api={api}
            onActivity={bumpAudit}
            onDisconnected={() => {
              setState({ status: 'ready', connections: [] })
              setNotice(null)
            }}
          />
        ))}

      {state.status === 'ready' && <AuditLogCard api={api} refreshKey={auditKey} />}
    </div>
  )
}
