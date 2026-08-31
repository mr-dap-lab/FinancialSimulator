import { useEffect, useId, useRef, useState } from 'react'
import { useT } from '../../i18n/i18n'
import { useAuth } from './auth'

/** Initials shown when a Google account has no profile photo. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

/**
 * The persistent top-bar auth control. Signed out (or not yet configured), it
 * is a single "Iniciar sesión" button. Signed in, it becomes the account's
 * avatar and name, opening a menu with the one action that matters here:
 * signing out.
 */
export function AccountControl({ onRequestSignIn }: { onRequestSignIn: () => void }) {
  const { user, logout } = useAuth()
  const t = useT()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Closes on an outside click or Escape, and returns focus to the trigger —
  // the same two things a native <select> gives you for free.
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

  if (!user) {
    return (
      <button
        type="button"
        onClick={onRequestSignIn}
        className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full border border-outline px-4 text-sm font-medium text-on-surface transition disabled:opacity-38 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8 group-active:opacity-10"
        />
        <span className="relative">{t.auth.signIn}</span>
      </button>
    )
  }

  const displayName = user.name || user.email
  const avatar = user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      referrerPolicy="no-referrer"
      className="h-7 w-7 shrink-0 rounded-full"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-medium text-on-primary-container"
    >
      {initialsOf(displayName)}
    </span>
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t.auth.account(displayName)}
        onClick={() => setOpen((current) => !current)}
        className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-full pr-3 pl-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8 group-active:opacity-10"
        />
        {avatar}
        <span className="relative max-w-[8rem] truncate text-sm font-medium text-on-surface">
          {displayName}
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t.auth.accountMenu}
          className="absolute top-full right-0 z-30 mt-2 min-w-[14rem] overflow-hidden rounded-md border border-outline-variant bg-surface-container shadow-e2"
        >
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-on-surface-variant">{t.auth.name}</p>
            <p className="truncate text-sm text-on-surface">{user.name}</p>
            <p className="mt-2 text-xs font-medium text-on-surface-variant">{t.auth.emailLabel}</p>
            <p className="truncate text-sm text-on-surface">{user.email}</p>
          </div>
          <div className="border-t border-outline-variant" role="none" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-on-surface/8 focus-visible:bg-on-surface/8 focus-visible:outline-none"
          >
            {t.auth.signOut}
          </button>
        </div>
      )}
    </div>
  )
}
