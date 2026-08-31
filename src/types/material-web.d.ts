/**
 * Minimal JSX typing for the one real `@material/web` custom element this app
 * uses directly — `<md-icon-button>`, the trigger for `HelpPopover`. Not a
 * blanket declaration for every `@material/web` tag: this project renders the
 * rest of its UI with hand-built components (see `components/ui`), so there
 * is no need to type tags nothing here uses.
 */
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-icon-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
      }
    }
  }
}
