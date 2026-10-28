import { listAccounts } from '../_lib/handlers.js'
import { withUser } from '../_lib/route.js'

/** `GET ?connectionId=` reads the accounts behind one of the signed-in user's connections. */
export const GET = (request: Request) => withUser(request, listAccounts)
