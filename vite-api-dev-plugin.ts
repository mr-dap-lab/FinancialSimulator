import { existsSync } from 'node:fs'
import type { IncomingMessage } from 'node:http'
import { resolve, sep } from 'node:path'
import { loadEnv } from 'vite'
import type { Plugin } from 'vite'

/**
 * Serves `api/**` during `npm run dev`, so the bank-connection endpoints work
 * locally without the Vercel CLI. The handlers are written against the web
 * standard `Request`/`Response` (the shape Vercel runs them with), so this is
 * only an adapter from Node's http objects.
 *
 * Dev-only (`apply: 'serve'`): production uses Vercel's own routing for `api/`.
 * Server-only variables (`SUPABASE_SERVICE_ROLE_KEY`, `CROMA_API_KEY`, ...) are
 * read from `.env.local` into `process.env` here; they are NOT `VITE_`-prefixed
 * and so are never exposed to the browser bundle.
 */
export function apiDevPlugin(): Plugin {
  const root = process.cwd()
  const apiRoot = resolve(root, 'api')

  return {
    name: 'financial-simulator:api-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, root, '')
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        // `/api/bank/connections` -> `<root>/api/bank/connections.ts`, and never a
        // helper (`_lib`) or anything that escapes `api/`.
        const file = resolve(root, `.${url.pathname}.ts`)
        const inside = file.startsWith(apiRoot + sep)
        if (!inside || file.includes(`${sep}_`) || !existsSync(file)) {
          res.statusCode = 404
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: { code: 'not_found', message: 'No such endpoint.' } }))
          return
        }

        try {
          const module = (await server.ssrLoadModule(file)) as Record<string, unknown>
          const handler = module[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            res.end()
            return
          }

          const response = (await handler(await toRequest(req, url))) as Response
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          server.config.logger.error(`[api-dev] ${error instanceof Error ? error.message : 'unexpected error'}`)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: { code: 'internal_error', message: 'Something went wrong.' } }))
        }
      })
    },
  }
}

async function toRequest(req: IncomingMessage, url: URL): Promise<Request> {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item))
    else if (value !== undefined) headers.set(key, value)
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  let body: Buffer | undefined
  if (hasBody) {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    body = Buffer.concat(chunks)
  }

  return new Request(new URL(url.pathname + url.search, 'http://localhost'), {
    method: req.method,
    headers,
    body: body && body.length > 0 ? new Uint8Array(body) : undefined,
  })
}
