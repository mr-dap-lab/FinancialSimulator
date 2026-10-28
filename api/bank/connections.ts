import { createConnection, deleteConnection, listConnections } from '../_lib/handlers.js'
import { withUser } from '../_lib/route.js'

/** `GET` lists the signed-in user's connections, `POST` creates one, `DELETE ?id=` removes one. */
export const GET = (request: Request) => withUser(request, listConnections)
export const POST = (request: Request) => withUser(request, createConnection)
export const DELETE = (request: Request) => withUser(request, deleteConnection)
