import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, ParamField, TextInput } from '../../components/ui'
import { useT } from '../../i18n/i18n'
import { useAuth } from './auth'

interface LoginFormProps {
  /** Called once `login()` returns true — the caller decides what happens next. */
  onSuccess: () => void
}

/**
 * The one implementation of the mock email/password check — shared by the
 * optional `/login` page (`LoginScreen`) and `AccessGate`'s full-screen
 * overlay, so the two surfaces can never drift into two different copies of
 * the same hardcoded-credential comparison. See `AuthProvider` for the two
 * demo accounts this checks against.
 *
 * Deliberately does not render any "continue without signing in" escape
 * hatch itself — that link is specific to the optional `/login` page and
 * stays there; `AccessGate` renders this form with no such way out.
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Moves focus into the form as soon as it mounts, rather than leaving it
  // wherever it was before (a link that may no longer be on screen).
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (login(email, password)) {
      onSuccess()
      return
    }
    setError(t.auth.loginError)
    // The error banner renders above the fields; moving focus back to email
    // means a screen reader announces the failure immediately rather than
    // leaving focus sitting on the password field with no indication anything
    // changed.
    emailRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 text-left" noValidate>
      {error && (
        <p
          role="alert"
          className="w-full rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container"
        >
          {error}
        </p>
      )}

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
          <TextInput
            id={id}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        )}
      </ParamField>

      <Button type="submit" variant="filled" className="mt-2 h-12 w-full">
        {t.auth.signIn}
      </Button>
    </form>
  )
}
