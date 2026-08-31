import { Button } from '../../components/ui'
import { useT } from '../../i18n/i18n'
import { LoginForm } from './LoginForm'

interface LoginScreenProps {
  /** Used by both the escape hatch and a completed sign-in — same destination. */
  onReturn: () => void
}

/**
 * The dedicated /login screen (`#/login` — see App.tsx for why a hash rather
 * than a real path). Optional: `onReturn`'s escape hatch below the form is
 * what makes this screen "optional" — `AccessGate`'s overlay renders the same
 * `LoginForm` with no such way out, which is the one real difference between
 * the two surfaces.
 */
export function LoginScreen({ onReturn }: LoginScreenProps) {
  const t = useT()

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-24">
      <h1 className="text-2xl font-normal text-on-surface">{t.auth.loginTitle}</h1>
      <p className="mt-2 text-sm text-on-surface-variant">{t.auth.loginSubtitle}</p>

      <div className="mt-8 w-full">
        <LoginForm onSuccess={onReturn} />
      </div>

      <Button type="button" variant="outlined" onClick={onReturn} className="mt-3 h-12 w-full">
        {t.auth.backToApp}
      </Button>
    </div>
  )
}
