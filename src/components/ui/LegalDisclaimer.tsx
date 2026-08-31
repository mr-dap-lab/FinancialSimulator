import { useT } from '../../i18n/i18n'

/**
 * The one shared disclaimer rendered at the bottom of all seven feature
 * tabs — small and muted on purpose ("clearly secondary in visual weight to
 * everything above it, not an alarming banner"), never copy-pasted per
 * feature so there is exactly one place to fix its wording.
 */
export function LegalDisclaimer() {
  const t = useT()
  return (
    <p className="border-t border-outline-variant pt-4 text-xs leading-relaxed text-on-surface-variant">
      {t.common.legalDisclaimer}
    </p>
  )
}
