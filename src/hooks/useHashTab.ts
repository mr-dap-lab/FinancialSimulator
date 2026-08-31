import { useCallback, useEffect, useState } from 'react'

const read = (valid: readonly string[], fallback: string): string => {
  const id = window.location.hash.replace(/^#\/?/, '')
  return valid.includes(id) ? id : fallback
}

/**
 * Keeps the active tab in the URL hash so a view can be linked and shared, and
 * so browser back/forward move between tabs.
 */
export function useHashTab<T extends string>(
  valid: readonly T[],
  fallback: T,
): [T, (id: T) => void] {
  const [active, setActive] = useState<T>(() => read(valid, fallback) as T)

  useEffect(() => {
    const onHashChange = () => setActive(read(valid, fallback) as T)
    window.addEventListener('hashchange', onHashChange)
    // Normalise a missing or unknown hash on first load.
    if (window.location.hash.replace(/^#\/?/, '') !== active) {
      window.history.replaceState(null, '', `#/${active}`)
    }
    return () => window.removeEventListener('hashchange', onHashChange)
    // `valid` and `fallback` are module-level constants at every call site.
  }, [active, fallback, valid])

  const select = useCallback((id: T) => {
    window.location.hash = `#/${id}`
    setActive(id)
  }, [])

  return [active, select]
}
