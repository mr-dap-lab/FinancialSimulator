import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Card, Checkbox, ParamField, inputClass } from '../../../components/ui'
import { useI18n } from '../../../i18n/i18n'
import type { BankConnection, ConsentDocument } from '../../../lib/bankTypes'
import { bankApi } from '../bankApi'
import { bankErrorMessage } from '../errorMessage'
import type { BankApi } from '../useBankApi'

type Step = 'intro' | 'consent' | 'credentials'
const STEPS: readonly Step[] = ['intro', 'consent', 'credentials']

interface AcceptedConsent {
  version: string
  accepted: string[]
}

/**
 * The three-step flow for connecting a bank account: what happens → the user
 * accepts responsibility → the credentials. Three separate screens rather than
 * one long form, so the consent is a deliberate act and not something scrolled
 * past on the way to the password field.
 */
export function ConnectWizard({
  api,
  onConnected,
}: {
  api: BankApi
  onConnected: (connection: BankConnection) => void
}) {
  const { t, language } = useI18n()
  const [step, setStep] = useState<Step>('intro')
  const [consent, setConsent] = useState<AcceptedConsent | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Each step change moves focus to its heading, so a keyboard or screen-reader
  // user lands at the start of the new step instead of on a button that vanished.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const labels: Record<Step, string> = {
    intro: t.bank.stepIntro,
    consent: t.bank.stepConsent,
    credentials: t.bank.stepCredentials,
  }
  const currentIndex = STEPS.indexOf(step)

  return (
    <Card>
      <ol aria-label={t.bank.stepsLabel} className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
        {STEPS.map((id, index) => {
          const current = index === currentIndex
          const done = index < currentIndex
          return (
            <li
              key={id}
              aria-current={current ? 'step' : undefined}
              className={`flex items-center gap-2 text-sm ${current ? 'font-medium text-on-surface' : 'text-on-surface-variant'}`}
            >
              <span
                aria-hidden="true"
                className={
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ' +
                  (current || done ? 'bg-primary text-on-primary' : 'border border-outline')
                }
              >
                {done ? '✓' : index + 1}
              </span>
              {labels[id]}
            </li>
          )
        })}
      </ol>
      <p className="sr-only">{t.bank.stepOf(currentIndex + 1, STEPS.length)}</p>

      {step === 'intro' && (
        <IntroStep headingRef={headingRef} onStart={() => setStep('consent')} />
      )}
      {step === 'consent' && (
        <ConsentStep
          // Remounts on a language change: the user must accept the text they are looking at.
          key={language}
          headingRef={headingRef}
          onBack={() => setStep('intro')}
          onAccept={(accepted) => {
            setConsent(accepted)
            setStep('credentials')
          }}
        />
      )}
      {step === 'credentials' && consent && (
        <CredentialsStep
          headingRef={headingRef}
          api={api}
          consent={consent}
          onBack={() => setStep('consent')}
          onConnected={onConnected}
        />
      )}
    </Card>
  )
}

type HeadingRef = { headingRef: React.RefObject<HTMLHeadingElement | null> }

function StepHeading({ headingRef, children }: HeadingRef & { children: string }) {
  return (
    <h2 ref={headingRef} tabIndex={-1} className="text-lg font-medium text-on-surface outline-none">
      {children}
    </h2>
  )
}

function IntroStep({ headingRef, onStart }: HeadingRef & { onStart: () => void }) {
  const { t } = useI18n()
  const items = [
    { title: t.bank.introDoTitle, body: t.bank.introDo },
    { title: t.bank.introDontTitle, body: t.bank.introDont },
    { title: t.bank.introWhoTitle, body: t.bank.introWho },
    { title: t.bank.introControlTitle, body: t.bank.introControl },
  ]

  return (
    <div>
      <StepHeading headingRef={headingRef}>{t.bank.introHeading}</StepHeading>
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-md bg-surface-low p-4">
            <dt className="text-sm font-medium text-on-surface">{item.title}</dt>
            <dd className="mt-1 text-sm leading-5 text-on-surface-variant">{item.body}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex justify-end">
        <Button variant="filled" onClick={onStart}>
          {t.bank.start}
        </Button>
      </div>
    </div>
  )
}

function ConsentStep({
  headingRef,
  onBack,
  onAccept,
}: HeadingRef & { onBack: () => void; onAccept: (consent: AcceptedConsent) => void }) {
  const { t, language } = useI18n()
  const [document, setDocument] = useState<ConsentDocument | null>(null)
  const [failed, setFailed] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  // The text comes from the server (it owns the exact words and their hash).
  useEffect(() => {
    let active = true
    bankApi
      .consent(language)
      .then((result) => active && setDocument(result))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [language])

  const allChecked = document !== null && document.items.every((item) => checked[item.id])

  return (
    <div>
      <StepHeading headingRef={headingRef}>{t.bank.consentHeading}</StepHeading>
      <p className="mt-1 text-sm text-on-surface-variant">{t.bank.consentIntro}</p>

      {failed && (
        <p role="alert" className="mt-4 rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container">
          {t.bank.consentLoadError}
        </p>
      )}
      {!document && !failed && <p role="status" className="mt-4 text-sm text-on-surface-variant">{t.bank.loading}</p>}

      {document && (
        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">{t.bank.consentHeading}</legend>
          {document.items.map((item) => (
            <div key={item.id} className="rounded-md bg-surface-low p-3">
              <Checkbox
                checked={checked[item.id] ?? false}
                onChange={(value) => setChecked((previous) => ({ ...previous, [item.id]: value }))}
                label={item.text}
              />
            </div>
          ))}
          <p className="text-xs text-on-surface-variant">{t.bank.consentVersion(document.version)}</p>
        </fieldset>
      )}

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="outlined" onClick={onBack}>
          {t.bank.back}
        </Button>
        <Button
          variant="filled"
          disabled={!allChecked}
          onClick={() =>
            document && onAccept({ version: document.version, accepted: document.items.map((item) => item.id) })
          }
        >
          {t.bank.continue}
        </Button>
      </div>
    </div>
  )
}

function CredentialsStep({
  headingRef,
  api,
  consent,
  onBack,
  onConnected,
}: HeadingRef & {
  api: BankApi
  consent: AcceptedConsent
  onBack: () => void
  onConnected: (connection: BankConnection) => void
}) {
  const { t, language } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting || !username.trim() || !password) return
    setSubmitting(true)
    setError(null)
    try {
      const connection = await api.createConnection({
        username: username.trim(),
        password,
        locale: language,
        consent,
      })
      setPassword('')
      onConnected(connection)
    } catch (caught) {
      setError(bankErrorMessage(caught, t))
    } finally {
      // The bank password does not outlive the request, success or not.
      setPassword('')
      setReveal(false)
      setSubmitting(false)
    }
  }

  // Credentials are masked in session recordings (Microsoft Clarity runs on
  // this site) and the browser/password managers are asked not to keep them.
  const secretAttributes = {
    autoComplete: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    'data-clarity-mask': 'true',
    'data-1p-ignore': true,
    'data-lpignore': 'true',
  } as const

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepHeading headingRef={headingRef}>{t.bank.credentialsHeading}</StepHeading>
      <p className="mt-1 text-sm text-on-surface-variant">{t.bank.credentialsIntro}</p>

      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-4 rounded-md bg-error-container px-4 py-3 text-sm text-on-error-container outline-none"
        >
          {error}
        </p>
      )}

      <fieldset disabled={submitting} className="mt-4 grid max-w-md grid-cols-1 gap-4">
        <ParamField label={t.bank.username}>
          {(id) => (
            <input
              id={id}
              type="text"
              maxLength={100}
              className={inputClass}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              {...secretAttributes}
            />
          )}
        </ParamField>

        <ParamField label={t.bank.bankPassword}>
          {(id) => (
            <div className="relative w-full">
              <input
                id={id}
                type={reveal ? 'text' : 'password'}
                maxLength={200}
                className={`${inputClass} pr-28`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                {...secretAttributes}
              />
              <button
                type="button"
                aria-pressed={reveal}
                onClick={() => setReveal((value) => !value)}
                className="absolute inset-y-0 right-3 text-sm font-medium text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {reveal ? t.bank.hidePassword : t.bank.showPassword}
              </button>
            </div>
          )}
        </ParamField>
      </fieldset>

      <p className="mt-2 max-w-md text-xs leading-4 text-on-surface-variant">{t.bank.securityNote}</p>

      {submitting && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none"
          />
          {t.bank.verifying}
        </p>
      )}

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="outlined" onClick={onBack} disabled={submitting}>
          {t.bank.back}
        </Button>
        <Button type="submit" variant="filled" disabled={submitting || !username.trim() || !password}>
          {t.bank.connect}
        </Button>
      </div>
    </form>
  )
}
