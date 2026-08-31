import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, Ref } from 'react'
import { useLocale } from '../../context/locale'
import { decimalSeparator, parseDecimal, parseInteger } from '../../lib/format'
import { inputClass } from './fieldStyles'

/**
 * Both inputs hold a `draft` string while the user is typing and fall back to
 * the formatted prop when it is null. That keeps a half-typed value from being
 * reformatted out from under the caret, while letting an external change — a
 * reset, a locale switch — show up immediately, with no syncing effect.
 *
 * Every text-entry input also carries a `maxLength` well above any realistic
 * value. It costs a legitimate user nothing and stops a pathological paste
 * (a megabyte of digits) from ever reaching the parsing logic.
 */

interface CurrencyInputProps {
  id?: string
  value: number
  onChange: (value: number) => void
  max?: number
  /** Set when the control is not inside a `ParamField` that already labels it. */
  ariaLabel?: string
}

/**
 * A whole-currency input that stays grouped while you type.
 *
 * Reformatting on every keystroke would normally throw the caret to the end, so
 * the caret is re-placed after the same number of digits it was sitting behind.
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  max = 1_000_000_000_000,
  ariaLabel,
}: CurrencyInputProps) {
  const { locale, currencySymbol } = useLocale()
  const ref = useRef<HTMLInputElement>(null)
  const group = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  )
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? group.format(value)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const element = event.target
    const raw = element.value
    const caret = element.selectionStart ?? raw.length
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length

    // `parseInteger` can only ever hand back a finite number here (it strips
    // everything but digits first), and `Math.min` collapses even an
    // overflowed `Infinity` — from a string long enough to exceed what a
    // double can represent — down to `max`.
    const parsed = Math.min(parseInteger(raw), max)
    const formatted = group.format(parsed)

    setDraft(formatted)
    onChange(parsed)

    requestAnimationFrame(() => {
      const input = ref.current
      if (!input) return
      let seen = 0
      let index = 0
      while (index < formatted.length && seen < digitsBeforeCaret) {
        if (/\d/.test(formatted[index])) seen++
        index++
      }
      input.setSelectionRange(index, index)
    })
  }

  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-on-surface-variant">
        {currencySymbol}
      </span>
      <input
        id={id}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={18}
        aria-label={ariaLabel}
        className={`${inputClass} text-right`}
        style={{ paddingLeft: `${currencySymbol.length * 0.58 + 1.3}rem` }}
        value={text}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
      />
    </div>
  )
}

interface NumberInputProps {
  id?: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  max?: number
  decimals?: number
  ariaLabel?: string
}

/**
 * A decimal input that accepts either separator, so an es-CO user can type
 * "11,5" and an en-US user "11.5". A half-typed "11," is left alone until blur.
 */
export function NumberInput({
  id,
  value,
  onChange,
  suffix,
  min = 0,
  max = 100,
  decimals = 1,
  ariaLabel,
}: NumberInputProps) {
  const { locale } = useLocale()
  const separator = decimalSeparator(locale)
  const display = (input: number) => String(Number(input.toFixed(decimals))).replace('.', separator)

  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? display(value)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (!/^-?\d*[.,]?\d*$/.test(raw)) return
    setDraft(raw)

    // `parseDecimal` already rejects non-finite results (NaN, ±Infinity) via
    // `Number.isFinite`, so nothing but a real, in-range number reaches
    // `onChange`.
    const parsed = parseDecimal(raw)
    if (parsed === null) return
    const rounded = Number(parsed.toFixed(decimals))
    // Out-of-range keystrokes stay in the draft; blur clamps them.
    if (rounded < min || rounded > max) return
    onChange(rounded)
  }

  const handleBlur = () => {
    const parsed = draft === null ? value : parseDecimal(draft)
    const next =
      parsed === null ? value : Math.min(max, Math.max(min, Number(parsed.toFixed(decimals))))
    setDraft(null)
    onChange(next)
  }

  return (
    <div className="relative w-full">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        maxLength={14}
        aria-label={ariaLabel}
        className={`${inputClass} text-right`}
        style={suffix ? { paddingRight: '2rem' } : undefined}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-on-surface-variant">
          {suffix}
        </span>
      )}
    </div>
  )
}

interface PercentInputProps {
  id?: string
  /** A fraction: 0.11 renders as 11. */
  value: number
  /** Receives a fraction, not a percentage. */
  onChange: (value: number) => void
  /** Bounds in percentage points. */
  min?: number
  max?: number
  decimals?: number
  ariaLabel?: string
}

/**
 * Percentages are stored as fractions everywhere in the models, so this wrapper
 * owns the ×100 conversion rather than repeating it at each call site.
 */
export function PercentInput({
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  decimals = 1,
  ariaLabel,
}: PercentInputProps) {
  return (
    <NumberInput
      id={id}
      value={Number((value * 100).toFixed(decimals))}
      onChange={(next) => onChange(next / 100)}
      suffix="%"
      min={min}
      max={max}
      decimals={decimals}
      ariaLabel={ariaLabel}
    />
  )
}

interface TextInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
  maxLength?: number
  /** `email`/`password` switch the native keyboard and masking; `autoComplete` defaults follow. */
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  /** React 19 accepts `ref` as a plain prop on a function component — no `forwardRef` needed. */
  ref?: Ref<HTMLInputElement>
}

export function TextInput({
  id,
  value,
  onChange,
  ariaLabel,
  maxLength = 80,
  type = 'text',
  autoComplete,
  ref,
}: TextInputProps) {
  return (
    <input
      id={id}
      ref={ref}
      type={type}
      autoComplete={autoComplete ?? (type === 'text' ? 'off' : type)}
      maxLength={maxLength}
      aria-label={ariaLabel}
      className={inputClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

interface SelectProps<T extends string> {
  id?: string
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
  ariaLabel?: string
}

/** A native select wearing the shared control surface, with an M3 trailing icon. */
export function Select<T extends string>({
  id,
  value,
  onChange,
  options,
  ariaLabel,
}: SelectProps<T>) {
  return (
    <div className="relative w-full">
      <select
        id={id}
        aria-label={ariaLabel}
        className={`${inputClass} cursor-pointer appearance-none pr-10`}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface-container text-on-surface">
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-on-surface-variant">
          <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
        </svg>
      </span>
    </div>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  ariaLabel?: string
}

/** M3 checkbox. https://m3.material.io/components/checkbox */
export function Checkbox({ checked, onChange, label, ariaLabel }: CheckboxProps) {
  const box = (
    <span
      className={
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[2px] border-2 transition-colors ' +
        (checked ? 'border-primary bg-primary' : 'border-on-surface-variant')
      }
    >
      {checked && (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-on-primary" aria-hidden="true">
          <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </span>
  )

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        aria-label={ariaLabel ?? label}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="rounded-full p-1.5 transition-colors hover:bg-on-surface/8 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
        {box}
      </span>
      {label && <span className="text-sm text-on-surface">{label}</span>}
    </label>
  )
}
