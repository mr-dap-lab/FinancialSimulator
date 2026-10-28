import { listTransactions } from '../_lib/handlers.js'
import { withUser } from '../_lib/route.js'

/** `GET ?connectionId=&account=&from=&to=` reads one account's movements for a window of at most 92 days. */
export const GET = (request: Request) => withUser(request, listTransactions)
