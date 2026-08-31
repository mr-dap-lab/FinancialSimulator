import { useId } from 'react'
import type { ReactNode } from 'react'
import { HelpPopover } from './HelpPopover'

/**
 * A parameter field with three fixed-height slots: label, control, helper.
 *
 * Every sibling field in a parameter panel's grid renders through this
 * component, which is what keeps a row aligned: previously some fields used a
 * "filled" text-field style (label floated *inside* the control) and others
 * used a "stacked" style (label *above* the control, as its own line), so two
 * fields sharing a grid row had their visible input boxes start at different
 * vertical offsets even though the grid stretched both cells to equal height.
 * A single field shape removes the discrepancy instead of patching it case by
 * case.
 *
 * The label slot is always one line, the control slot is always at least 44px
 * (`min-h-11` rather than a hard `h-11`, so a compound control that has to
 * wrap on an extremely narrow phone grows instead of clipping), and the helper
 * slot always renders a line of text — a non-breaking space when there is
 * nothing to say — so a field without a hint doesn't sit shorter than a
 * neighbour that has one.
 *
 * A field that combines a value with an adjacent control — the rate input next
 * to its E.A./nominal/mensual selector, the term slider next to its
 * meses/años toggle — is one `ParamField` with both controls laid out in a
 * single row inside the control slot, not two separate fields. Splitting them
 * is what produced the drift in the first place: two half-height controls
 * stacked in one cell versus a single full-height control in the next cell
 * over.
 */
interface ParamFieldProps {
  label: string
  helper?: ReactNode
  /**
   * Longer explanatory copy for the field's `(?)` popover — historical
   * context, why a default is what it is, anything too long for the one-line
   * helper. Omit it and no popover renders.
   */
  help?: string
  /** Replaces the helper and switches the field to its error colours. */
  error?: string
  children: (id: string) => ReactNode
  className?: string
}

export function ParamField({
  label,
  helper,
  help,
  error,
  children,
  className = '',
}: ParamFieldProps) {
  const id = useId()

  return (
    <div
      className={`group flex flex-col gap-1 ${className}`}
      data-error={error ? 'true' : undefined}
    >
      <div className="flex items-center gap-1">
        <label
          htmlFor={id}
          className="block text-xs leading-4 font-medium text-on-surface-variant group-data-[error=true]:text-error"
        >
          {label}
        </label>
        {help && <HelpPopover label={label} text={help} />}
      </div>
      <div className="flex min-h-11 items-center">{children(id)}</div>
      <p
        className={`text-xs leading-4 ${error ? 'text-error' : 'text-on-surface-variant'}`}
        aria-live={error ? 'polite' : undefined}
      >
        {error ?? helper ?? ' '}
      </p>
    </div>
  )
}
