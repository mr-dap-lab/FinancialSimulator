import { clamp } from '../../lib/format'
import { bareInputClass } from './fieldStyles'

interface SliderWithNumberProps {
  id?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  /** Width of the number box, as a Tailwind class. */
  numberWidth?: string
  ariaLabel?: string
  /**
   * Overrides the slider handle's default linear position — value from `min`
   * to `max` spread evenly along the track. Provide both to make the track
   * non-linear (a log-ish scale for a currency goal spanning $0 to $100M,
   * where a linear track would put every realistic value in the first few
   * pixels): `toPosition` maps a value to 0–1 along the track, `fromPosition`
   * is its inverse, mapping a dragged position back to a value. The number
   * box next to it is unaffected either way — it always reads and writes the
   * real value directly.
   */
  toPosition?: (value: number) => number
  fromPosition?: (position: number) => number
  /**
   * Omits the paired number box — for a field that already has its own
   * currency input elsewhere in the same control and only needs the slider
   * part of this component, not a second, plain (unformatted) number display
   * of the same value.
   */
  hideNumberBox?: boolean
}

/** Resolution of the underlying native range input when a custom position
 * mapping is supplied — arbitrary, just fine enough that dragging feels
 * continuous rather than snapping between visibly distinct steps. */
const POSITION_RESOLUTION = 1000

/**
 * M3 slider paired with a number box that edits the same value.
 *
 * Both controls are wrapped rather than given width utilities directly: the
 * shared `inputClass` carries `w-full`, which would beat a `w-24` on the same
 * element on stylesheet order regardless of class order.
 */
export function SliderWithNumber({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  numberWidth = 'w-24',
  ariaLabel,
  toPosition,
  fromPosition,
  hideNumberBox = false,
}: SliderWithNumberProps) {
  const hasCustomScale = Boolean(toPosition && fromPosition)

  // Linear mode: the native input's own min/max/value drive everything.
  // Custom-scale mode: the native input always spans 0..POSITION_RESOLUTION,
  // and `toPosition`/`fromPosition` translate to and from the real value.
  const nativeMin = hasCustomScale ? 0 : min
  const nativeMax = hasCustomScale ? POSITION_RESOLUTION : max
  const nativeValue = hasCustomScale
    ? Math.round(clamp(toPosition!(value), 0, 1) * POSITION_RESOLUTION)
    : value
  const progress = ((nativeValue - nativeMin) / (nativeMax - nativeMin)) * 100

  const handleSliderChange = (raw: number) => {
    if (!hasCustomScale) {
      onChange(raw)
      return
    }
    const position = clamp(raw / POSITION_RESOLUTION, 0, 1)
    onChange(clamp(fromPosition!(position), min, max))
  }

  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <input
          id={id}
          type="range"
          min={nativeMin}
          max={nativeMax}
          step={hasCustomScale ? 1 : step}
          value={nativeValue}
          aria-label={ariaLabel}
          onChange={(event) => handleSliderChange(Number(event.target.value))}
          className="md-slider w-full"
          style={
            {
              '--md-slider-track': `linear-gradient(to right, var(--md-primary) ${progress}%, var(--md-surface-container-highest) ${progress}%)`,
            } as React.CSSProperties
          }
        />
      </div>
      {!hideNumberBox && (
        <div className={`${numberWidth} shrink-0`}>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label={ariaLabel}
            onChange={(event) => onChange(clamp(Number(event.target.value) || min, min, max))}
            className={`${bareInputClass} text-right`}
          />
        </div>
      )}
    </div>
  )
}
