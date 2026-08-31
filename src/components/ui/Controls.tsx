import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

/**
 * M3 common buttons. https://m3.material.io/components/buttons
 *
 * Hover and pressed states are the M3 state layer — an overlay of the label
 * colour at 8 % / 10 % — rather than a different background per state.
 */
type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger'

const VARIANTS: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary shadow-e1 hover:shadow-e2',
  tonal: 'bg-secondary-container text-on-secondary-container',
  outlined: 'border border-outline text-primary',
  text: 'text-primary',
  danger: 'text-error',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Leading icon or glyph. */
  icon?: ReactNode
  /** React 19 accepts `ref` as a plain prop on a function component — no `forwardRef` needed. */
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'outlined',
  className = '',
  icon,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={
        'group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden ' +
        'rounded-xl px-4 text-sm font-medium tracking-[0.01em] transition-shadow ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
        'focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-38 ' +
        `${VARIANTS[variant]} ${className}`
      }
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8 group-active:opacity-10"
      />
      {icon && <span className="relative -ml-1 flex items-center">{icon}</span>}
      <span className="relative">{children}</span>
    </button>
  )
}

/** A 40dp icon-only button, used for compact table actions. */
export function IconButton({
  variant = 'text',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={
        'group relative inline-flex h-10 w-10 shrink-0 items-center justify-center ' +
        'overflow-hidden rounded-full text-lg transition ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
        'focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-38 ' +
        `${VARIANTS[variant]} ${className}`
      }
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8 group-active:opacity-10"
      />
      <span className="relative leading-none">{children}</span>
    </button>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
}

/**
 * M3 switch. https://m3.material.io/components/switch
 *
 * The handle grows from 16dp to 24dp when selected and carries a check mark,
 * which is what distinguishes it from a generic toggle.
 */
export function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          'relative mt-0.5 h-8 w-13 shrink-0 rounded-full border-2 transition-colors ' +
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
          'focus-visible:outline-primary ' +
          (checked
            ? 'border-primary bg-primary'
            : 'border-outline bg-surface-highest')
        }
      >
        <span
          className={
            'absolute top-1/2 flex items-center justify-center rounded-full ' +
            'transition-all duration-150 ' +
            (checked
              ? 'left-[calc(100%-1.625rem)] h-6 w-6 -translate-y-1/2 bg-on-primary'
              : 'left-1 h-4 w-4 -translate-y-1/2 bg-outline')
          }
        >
          {checked && (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
              />
            </svg>
          )}
        </span>
      </button>
      <span className="min-w-0">
        <span className="block text-sm text-on-surface">{label}</span>
        {description && (
          <span className="block text-xs text-on-surface-variant">{description}</span>
        )}
      </span>
    </label>
  )
}

interface DisclosureProps {
  title: ReactNode
  summary?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * A collapsible section, styled as an M3 outlined container.
 *
 * Built on native `<details>`/`<summary>` rather than a `<div>` driven by
 * `aria-expanded`: the browser handles focusability, Enter/Space toggling, and
 * announcing the expanded/collapsed state to a screen reader on its own, so
 * there is no hand-rolled keyboard handler to keep in sync with the visuals.
 * The default marker is replaced with a chevron that mirrors the element's own
 * `open` state via the `open:` variant, so it never needs its own React state.
 */
export function Disclosure({ title, summary, defaultOpen = false, children }: DisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-md border border-outline-variant bg-surface-low"
    >
      <summary
        className={
          'relative flex cursor-pointer list-none items-center gap-3 px-4 py-3 ' +
          'marker:hidden [&::-webkit-details-marker]:hidden ' +
          'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary'
        }
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-on-surface opacity-0 transition-opacity hover:opacity-8"
        />
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="relative h-5 w-5 shrink-0 text-on-surface-variant transition-transform group-open:rotate-180 motion-reduce:transition-none"
        >
          <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
        </svg>
        <span className="relative text-sm font-medium text-on-surface">{title}</span>
        {summary && (
          <span className="relative ml-auto text-xs text-on-surface-variant">{summary}</span>
        )}
      </summary>
      <div className="border-t border-outline-variant p-4">{children}</div>
    </details>
  )
}
