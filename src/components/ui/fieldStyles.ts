/**
 * The one control surface shared by every parameter input in the app —
 * currency, number, percent, text, select, and segmented-control options all
 * render at the same height, radius, and focus treatment.
 *
 * Fixed values, not tokens, because "one of everything" is the point: mixing a
 * 56px filled-field with a 40px segmented control in the same grid row is what
 * caused the row misalignment this file exists to prevent.
 *
 * - Height: 44px (`h-11`) — large enough for a comfortable touch target,
 *   small enough that a row of these plus its label and helper line still fits
 *   without inflating the panel.
 * - Radius: 8px (`rounded-sm`, redefined to 8px in `index.css`'s M3 shape scale).
 * - Focus: a 2px primary-coloured outline, offset by 2px — the same ring used
 *   on every other interactive element (buttons, switches, checkboxes), so
 *   "the one focus-ring color" is actually one color everywhere, not just
 *   within this file.
 *
 * These live apart from `Field.tsx` so that file exports only components,
 * which is what React Fast Refresh needs to hot-reload it.
 */
export const inputClass =
  'h-11 w-full rounded-sm border border-outline-variant bg-surface-container-highest ' +
  'px-3 text-sm text-on-surface tabular-nums outline-none transition-colors ' +
  'hover:bg-surface-high focus:border-primary ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'group-data-[error=true]:border-error'

/** Kept as an alias: earlier versions distinguished a "bare" (no floated
 * label) input from the default; now every input is bare, since the label
 * always lives outside the control in `ParamField`. */
export const bareInputClass = inputClass
