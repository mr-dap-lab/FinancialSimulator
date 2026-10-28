import { recordImport } from '../_lib/handlers.js'
import { withUser } from '../_lib/route.js'

/** `POST` records, in the audit trail, that an import was applied to (or discarded from) the budget. */
export const POST = (request: Request) => withUser(request, recordImport)
