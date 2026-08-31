import { CurrencyInput, ParamField } from '../../../components/ui'

/**
 * Every simple expense category (Hipoteca y deudas, Servicios públicos,
 * Alimentación, Seguros, and Maintenance's five fixed fields) is the same
 * shape — a grid of currency fields, each with its own `(?)` help popover —
 * so they share this one renderer instead of four near-copies.
 */
export function CurrencyFieldGrid<T extends object>({
  fields,
  values,
  onChange,
}: {
  fields: { key: keyof T & string; label: string; help?: string }[]
  values: T
  onChange: (patch: Partial<T>) => void
}) {
  const numbers = values as unknown as Record<string, number>

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(({ key, label, help }) => (
        <ParamField key={key} label={label} help={help}>
          {(id) => (
            <CurrencyInput
              id={id}
              value={numbers[key]}
              onChange={(value) => onChange({ [key]: value } as unknown as Partial<T>)}
            />
          )}
        </ParamField>
      ))}
    </div>
  )
}
