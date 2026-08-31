import { useMemo, useRef, useState } from 'react'
import { Button, TextInput } from '../../components/ui'
import { useT } from '../../i18n/i18n'
import { buildHelpIndex } from './helpIndex'

const CONTENT_ID = 'help-main-content'

/**
 * /ayuda — reference material, not a calculator, so it's reached from the
 * top bar's `?` icon rather than sitting in the tab strip (see App.tsx).
 *
 * Every explanation shown here is the exact same `helpLong` string each
 * field's `(?)` popover already reads — see `helpIndex.ts`'s own doc comment
 * for why there's no second copy of this prose to keep in sync.
 */
export function HelpFeature({ onReturn }: { onReturn: () => void }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())
  const [selectedId, setSelectedId] = useState<{ groupId: string; fieldId: string } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const groups = useMemo(() => buildHelpIndex(t), [t])

  const selectedGroup = selectedId ? groups.find((group) => group.id === selectedId.groupId) : undefined
  const selectedField = selectedId ? selectedGroup?.fields.find((field) => field.id === selectedId.fieldId) : undefined

  const normalizedQuery = query.trim().toLowerCase()
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups
    return groups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) => field.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((group) => group.fields.length > 0)
  }, [groups, normalizedQuery])

  const isFiltering = normalizedQuery.length > 0
  const isOpen = (groupId: string) => isFiltering || openGroups.has(groupId)

  const toggleGroup = (groupId: string) => {
    setOpenGroups((current) => {
      const next = new Set(current)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <div>
      <a
        href={`#${CONTENT_ID}`}
        onClick={(event) => {
          // A plain fragment href would set `location.hash`, which the app's
          // hash-based tab router (`useHashTab`) reads as a navigation
          // request — an unrecognised hash like this one falls back to the
          // default tab and kicks the user out of Ayuda entirely. Move focus
          // programmatically instead of letting the browser follow the link.
          event.preventDefault()
          contentRef.current?.focus()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-primary"
      >
        {t.help.skipToContent}
      </a>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-normal text-on-surface">{t.help.title}</h1>
        <Button variant="outlined" onClick={onReturn}>
          {t.help.backToApp}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
        <nav aria-label={t.help.indexLabel} className="space-y-3">
          <div>
            <label htmlFor="help-search" className="sr-only">
              {t.help.searchLabel}
            </label>
            <TextInput
              id="help-search"
              value={query}
              onChange={setQuery}
              ariaLabel={t.help.searchLabel}
            />
          </div>

          {filteredGroups.length === 0 ? (
            <p className="text-sm text-on-surface-variant">{t.help.noResults}</p>
          ) : (
            <ul className="space-y-2">
              {filteredGroups.map((group) => {
                const open = isOpen(group.id)
                return (
                  <li key={group.id} className="rounded-md border border-outline-variant">
                    <h2>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`help-group-${group.id}`}
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-on-surface hover:bg-on-surface/4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
                        >
                          <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                        </svg>
                        {group.title}
                      </button>
                    </h2>
                    {open && (
                      <ul id={`help-group-${group.id}`} className="space-y-0.5 px-2 pb-2">
                        {group.fields.map((field) => {
                          const isSelected = selectedId?.fieldId === field.id
                          return (
                            <li key={field.id}>
                              <a
                                href={`#${CONTENT_ID}`}
                                aria-current={isSelected ? 'true' : undefined}
                                onClick={(event) => {
                                  event.preventDefault()
                                  setSelectedId({ groupId: group.id, fieldId: field.id })
                                  contentRef.current?.focus()
                                }}
                                className={
                                  'block rounded-xs px-3 py-1.5 text-sm transition-colors ' +
                                  (isSelected
                                    ? 'bg-secondary-container text-on-secondary-container'
                                    : 'text-on-surface-variant hover:bg-on-surface/4 hover:text-on-surface')
                                }
                              >
                                {field.label}
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        <div
          id={CONTENT_ID}
          ref={contentRef}
          tabIndex={-1}
          className="rounded-lg bg-surface-low p-4 sm:p-6 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          {selectedField && selectedGroup ? (
            <div>
              <h2 className="text-sm font-medium text-on-surface-variant">{selectedGroup.title}</h2>
              <h3 className="mt-1 text-lg font-medium text-on-surface">{selectedField.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{selectedField.helpLong}</p>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">{t.help.selectPrompt}</p>
          )}
        </div>
      </div>
    </div>
  )
}
