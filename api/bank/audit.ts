import { listAudit } from '../_lib/handlers.js'
import { withUser } from '../_lib/route.js'

/** `GET` returns the signed-in user's own audit trail, newest first. */
export const GET = (request: Request) => withUser(request, listAudit)
