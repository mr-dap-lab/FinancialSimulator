import { getConsentHandler } from '../_lib/handlers.js'

/**
 * `GET ?locale=es|en` returns the consent text, its version and its hash. No
 * authentication: it is the same public legal text for everyone, and the user
 * reads it before anything is recorded.
 */
export const GET = (request: Request) => getConsentHandler(new URL(request.url))
