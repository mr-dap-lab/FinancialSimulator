import '@material/web/iconbutton/icon-button.js'
import { useEffect, useId, useRef, useState } from 'react'
import { useT } from '../../i18n/i18n'

/**
 * An accessible "what does this field mean" popover, triggered by a `(?)`
 * button next to a field's label — not a hover-only tooltip, which is
 * unusable for touch and keyboard users and disappears the moment a mouse
 * moves away mid-read.
 *
 * The trigger is a real `@material/web` element (`<md-icon-button>`), this
 * app's first genuine use of the library installed alongside this feature —
 * see the README for why the rest of the UI stays on the existing hand-built
 * components rather than a wholesale swap. Slotting our own inline SVG inside
 * it (rather than `<md-icon>`) avoids pulling in the separate Material
 * Symbols icon font just for one glyph.
 *
 * The panel opens on click, closes on Escape (returning focus to the
 * trigger) or an outside click, and is cross-referenced from the trigger via
 * `aria-describedby` while open, so a screen reader announces the help text
 * as part of the button itself rather than requiring a second stop to find it.
 */
export function HelpPopover({ label, text }: { label: string; text: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-flex">
      <md-icon-button
        ref={triggerRef}
        aria-label={t.common.helpFor(label)}
        // A raw boolean here silently fails on this custom element: React's
        // custom-element handling sets a non-string value as a JS property
        // instead of an HTML attribute, and `md-icon-button`'s own ARIAMixin
        // reflection does not turn a JS `true`/`false` back into the
        // "true"/"false" attribute string a screen reader needs. Passing the
        // string explicitly keeps it on the plain attribute path, the same
        // one `aria-controls`/`aria-describedby` (already strings) use.
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={open ? panelId : undefined}
        aria-describedby={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        style={{ width: '28px', height: '28px' }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-on-surface-variant" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41a2 2 0 1 0-4 0H8a4 4 0 1 1 8 0c0 .8-.32 1.53-.83 2.06z"
          />
        </svg>
      </md-icon-button>

      {open && (
        <div
          id={panelId}
          role="note"
          className="absolute top-full left-0 z-30 mt-1.5 w-64 rounded-md border border-outline-variant bg-surface-container p-3 text-xs leading-relaxed text-on-surface shadow-e2"
        >
          {text}
        </div>
      )}
    </div>
  )
}
