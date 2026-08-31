/**
 * Non-blocking warnings, styled as M3 tertiary-container banners so they read
 * as advisory rather than as an error state.
 */
export function WarningList({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null

  return (
    <ul className="space-y-2">
      {messages.map((message) => (
        <li
          key={message}
          className="flex items-start gap-2 rounded-xs bg-tertiary-container px-3 py-2 text-xs text-on-tertiary-container"
        >
          <svg viewBox="0 0 24 24" className="mt-px h-4 w-4 shrink-0" aria-hidden="true">
            <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          {message}
        </li>
      ))}
    </ul>
  )
}
