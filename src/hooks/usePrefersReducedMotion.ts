import { useEffect, useState } from 'react'

/**
 * Tracks `prefers-reduced-motion`. CSS transitions are killed globally via a
 * media query in `index.css`, but Recharts' entry animations are driven from
 * JS (tweening SVG attributes on a timer), which a CSS rule cannot reach —
 * this is what lets chart components pass `isAnimationActive={false}` when
 * the user has asked for reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
