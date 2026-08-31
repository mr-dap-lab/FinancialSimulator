import { useId } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly Option<T>[]
  ariaLabel?: string
  /** Lets the control fill its row instead of hugging its labels. */
  fullWidth?: boolean
  /** Forwarded so a `ParamField` label can point `htmlFor` at the first segment. */
  id?: string
}

/**
 * M3 segmented button. https://m3.material.io/components/segmented-buttons
 *
 * Built on real `<input type="radio">` elements — visually hidden, with a
 * styled `<label>` standing in for each segment — rather than a `role="radio"`
 * `<button>`. A `<button>` re-implementing the radio role has to hand-roll
 * roving tabindex and arrow-key navigation to match the ARIA radiogroup
 * pattern; a native radio group gets that (arrow keys move both focus and
 * selection, the group is a single tab stop) from the browser for free, and
 * can't drift out of sync with what a screen reader announces.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  fullWidth = false,
  id,
}: SegmentedControlProps<T>) {
  const name = useId()

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={
        'inline-flex h-11 overflow-hidden rounded-sm border border-outline-variant ' +
        (fullWidth ? 'w-full' : 'max-w-full flex-wrap')
      }
    >
      {options.map((option, index) => {
        const selected = option.value === value
        const optionId = index === 0 && id ? id : `${name}-${index}`
        return (
          <span
            key={option.value}
            className={
              'relative flex items-stretch ' +
              (fullWidth ? 'flex-1' : 'shrink-0') +
              (index > 0 ? ' border-l border-outline-variant' : '')
            }
          >
            <input
              type="radio"
              id={optionId}
              name={name}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <label
              htmlFor={optionId}
              className={
                'group relative flex w-full cursor-pointer items-center justify-center gap-1.5 ' +
                'overflow-hidden px-3 text-sm font-medium whitespace-nowrap transition-colors ' +
                'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 ' +
                'peer-focus-visible:outline-primary ' +
                (selected
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface')
              }
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-8"
              />
              {selected && (
                <svg viewBox="0 0 24 24" className="relative h-4 w-4 shrink-0" aria-hidden="true">
                  <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              <span className="relative truncate">{option.label}</span>
            </label>
          </span>
        )
      })}
    </div>
  )
}
