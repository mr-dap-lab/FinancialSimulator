import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, ParamField, TextInput } from '../../components/ui'
import { useT } from '../../i18n/i18n'
import { useAuth } from './auth'

interface LoginScreenProps {
  /** Used by both the escape hatch and a completed sign-in — same destination. */
  onReturn: () => void
}

/**
 * The dedicated /login screen (`#/login` — see App.tsx for why a hash rather
 * than a real path). A mock email/password form — see `AuthProvider` for the
 * two hardcoded accounts this checks against.
 */
export function LoginScreen({ onReturn }: LoginScreenProps) {
  const { login } = useAuth()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Moves focus into the form as soon as the route lands, rather than leaving
  // it on whatever triggered the navigation (a link that's no longer on screen).
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (login(email, password)) {
      onReturn()
      return
    }
    setError(t.auth.loginError)
    // The error banner renders above the form; moving focus to it means a
    // screen reader announces the failure immediately rather than leaving
    // focus sitting on the password field with no indication anything changed.
    emailRef.current?.focus()
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-24">
      <h1 className="text-2xl font-normal text-on-surface">{t.auth.loginTitle}</h1>
      <p className="mt-2 text-sm text-on-surface-variant">{t.auth.loginSubtitle}</p>

      {error && (
        <p
          role="alert"
          className="mt-6 w-full rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex w-full flex-col gap-4 text-left" noValidate>
        <ParamField label={t.auth.email}>
          {(id) => (
            <TextInput
              id={id}
              ref={emailRef}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="username"
            />
          )}
        </ParamField>

        <ParamField label={t.auth.password}>
          {(id) => (
            <TextInput id={id} type="password" value={password} onChange={setPassword} autoComplete="current-password" />
          )}
        </ParamField>

        <div className="mt-2 flex w-full flex-col gap-3">
          <Button type="submit" variant="filled" className="h-12 w-full">
            {t.auth.signIn}
          </Button>
          <Button type="button" variant="outlined" onClick={onReturn} className="h-12 w-full">
            {t.auth.backToApp}
          </Button>
        </div>
      </form>
    </div>
  )
}
