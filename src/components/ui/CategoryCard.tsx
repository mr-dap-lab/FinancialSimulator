import { useState } from 'react'
import type { ReactNode } from 'react'

interface CategoryCardProps {
  title: string
  /** Pre-formatted — the card does not know about currencies. */
  subtotal: string
  actions?: ReactNode
  children: ReactNode
  /** Every section starts open — this is a data-entry form, not an optional-extras disclosure. */
  defaultOpen?: boolean
}

/**
 * A collapsible group of parameter fields with a live subtotal in its own
 * header — the shape a grouped-input form needs (repeatable in future
 * features), distinct from both `Card` (no collapse) and `Disclosure`
 * (collapsed by default, no subtotal slot).
 *
 * Built on a real `<fieldset>`/`<legend>` rather than `<details>`: a
 * `<legend>` is what a screen reader announces as the group's name for every
 * field inside it, which is the correct semantic here (a named group of
 * inputs), not a collapsible aside. The collapse toggle is a plain button
 * living inside the `<legend>` — legends can contain interactive content —
 * driving a `hidden` div rather than `<details>`, since `<fieldset>` cannot
 * itself be a `<details>`'s child in the way this needs.
 */
export function CategoryCard({
  title,
  subtotal,
  actions,
  children,
  defaultOpen = true,
}: CategoryCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <fieldset className="rounded-lg border border-outline-variant bg-surface-low">
      {/* `<legend>`'s content model is phrasing content only, so the flex layout
          is applied to the legend itself rather than to a wrapping `<div>`,
          which `<legend>` cannot validly contain. */}
      <legend className="flex w-full flex-wrap items-center gap-3 rounded-t-lg bg-surface-container px-4 py-3 sm:px-6">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="group relative flex min-w-0 flex-1 items-center gap-2 rounded-xs text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-on-surface-variant transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          >
            <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
          </svg>
          <span className="truncate text-base font-medium text-on-surface">{title}</span>
        </button>
        <span className="text-sm font-medium text-on-surface">{subtotal}</span>
        {actions}
      </legend>
      {open && <div className="p-4 sm:p-6">{children}</div>}
    </fieldset>
  )
}
