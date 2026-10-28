import { describe, expect, it, vi } from 'vitest'
import { CONSENT_VERSION, getConsent } from '../consent.js'
import { CromaError } from '../croma.js'
import { ConfigError } from '../deps.js'
import {
  createConnection,
  deleteConnection,
  getConsentHandler,
  listAccounts,
  listAudit,
  listConnections,
} from '../handlers.js'
import { withUser } from '../route.js'
import { OTHER_USER, USER, makeCtx, makeDeps, postRequest, validBody } from './fakes.js'

const PASSWORD = 'S3cret-bank-pass!'

// Response bodies are loosely typed in tests on purpose: they assert on wire JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const read = async (response: Response | Promise<Response>): Promise<any> => (await response).json()

async function create(body: unknown = validBody(), overrides = {}) {
  const harness = makeDeps(overrides)
  const response = await createConnection(harness.deps, makeCtx(harness.deps), postRequest(body))
  return { ...harness, response, payload: await read(response) }
}

describe('POST connections — happy path', () => {
  it('creates the connection, answers with OUR id, and audits consent → attempt → created in order', async () => {
    const { response, payload, db, croma } = await create()

    expect(response.status).toBe(201)
    expect(payload.connection.id).toBe(db.connections[0].id)
    expect(payload.connection.id).not.toBe(croma.upstream[0].id) // Croma's id never leaves the server
    expect(payload.connection.displayName).toBe('J*** P*** G***')
    expect(db.types()).toEqual(['consent.accepted', 'connection.attempted', 'connection.created'])
  })

  it('records the consent version and the SHA-256 of the exact text accepted', async () => {
    const { db } = await create(validBody({ locale: 'en' }))
    const consentEvent = db.audit[0]
    expect(consentEvent.consentVersion).toBe(CONSENT_VERSION)
    expect(consentEvent.consentHash).toBe(getConsent('en').hash)
    expect(consentEvent.consentHash).not.toBe(getConsent('es').hash)
  })

  it('sends the credentials to Croma, and nowhere else', async () => {
    const { croma, db, response, payload } = await create()
    expect(croma.registered).toEqual([{ username: 'jperez', password: PASSWORD }])

    const everythingPersisted = JSON.stringify([db.audit, db.connections, payload])
    expect(everythingPersisted).not.toContain(PASSWORD)
    expect(everythingPersisted).not.toContain('jperez')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})

describe('POST connections — validation and consent', () => {
  it.each([
    ['a missing password', validBody({ password: '' })],
    ['a missing username', validBody({ username: '   ' })],
    ['an oversized password', validBody({ password: 'x'.repeat(201) })],
    ['an unknown locale', validBody({ locale: 'fr' })],
  ])('rejects %s without touching Croma', async (_label, body) => {
    const { response, croma, db } = await create(body)
    expect(response.status).toBe(400)
    expect(croma.registered).toHaveLength(0)
    expect(db.audit).toHaveLength(0)
  })

  it('rejects a body that is not a JSON object', async () => {
    const harness = makeDeps()
    const response = await createConnection(
      harness.deps,
      makeCtx(harness.deps),
      new Request('http://localhost/api/bank/connections', { method: 'POST', body: 'not json' }),
    )
    expect(response.status).toBe(400)
  })

  it('requires every consent item', async () => {
    const { response, payload, croma } = await create(
      validBody({ consent: { version: CONSENT_VERSION, accepted: ['ownership', 'responsibility'] } }),
    )
    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('consent_required')
    expect(croma.registered).toHaveLength(0)
  })

  it('rejects an outdated consent version so the user must re-read the new text', async () => {
    const { response, payload, croma } = await create(
      validBody({ consent: { version: '1999-01-01.0', accepted: ['ownership', 'responsibility', 'thirdParty', 'dataProcessing'] } }),
    )
    expect(response.status).toBe(409)
    expect(payload.error.code).toBe('consent_outdated')
    expect(croma.registered).toHaveLength(0)
  })
})

describe('POST connections — limits and safeguards', () => {
  it('lets a user hold only maxConnectionsPerUser connections', async () => {
    const harness = makeDeps()
    const ctx = makeCtx(harness.deps)
    await createConnection(harness.deps, ctx, postRequest(validBody()))
    const second = await createConnection(harness.deps, ctx, postRequest(validBody()))

    expect(second.status).toBe(409)
    expect((await read(second)).error.code).toBe('connection_limit_user')
    expect(harness.croma.registered).toHaveLength(1)
  })

  it('blocks further attempts after too many bank rejections, and audits the block', async () => {
    const harness = makeDeps({ maxRejectedPerHour: 2 })
    harness.croma.registerError = new CromaError(422, 'connection_rejected', 'nope')
    const ctx = makeCtx(harness.deps)

    for (let i = 0; i < 2; i++) await createConnection(harness.deps, ctx, postRequest(validBody()))
    const blocked = await createConnection(harness.deps, ctx, postRequest(validBody()))

    expect(blocked.status).toBe(429)
    expect((await read(blocked)).error.code).toBe('too_many_attempts')
    expect(blocked.headers.get('retry-after')).toBe('3600')
    expect(harness.croma.registered).toHaveLength(2) // the third never reached the bank
    expect(harness.db.types().at(-1)).toBe('connection.blocked')
  })

  it('does NOT call Croma when the audit trail cannot be written (fail closed)', async () => {
    const harness = makeDeps()
    harness.db.failAudit = true
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await createConnection(harness.deps, makeCtx(harness.deps), postRequest(validBody()))

    expect(response.status).toBe(503)
    expect((await read(response)).error.code).toBe('audit_unavailable')
    expect(harness.croma.registered).toHaveLength(0)
    vi.restoreAllMocks()
  })
})

describe('POST connections — bank/provider failures', () => {
  it.each([
    [new CromaError(422, 'connection_rejected', 'x'), 422, 'connection_rejected', 'connection.rejected'],
    [new CromaError(409, 'connection_exists', 'x'), 409, 'connection_exists', 'connection.duplicate'],
    [new CromaError(422, 'connection_limit_reached', 'x'), 503, 'capacity_reached', 'connection.limit_reached'],
    [new CromaError(429, 'connections_exhausted', 'x', 120), 429, 'service_busy', 'connection.failed'],
    [new CromaError(401, 'invalid_api_key', 'x'), 502, 'provider_unavailable', 'connection.failed'],
    [new CromaError(0, 'croma_unreachable', 'x'), 502, 'provider_unavailable', 'connection.failed'],
  ])('maps %#: %s → %i %s and audits %s', async (error, status, code, event) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const harness = makeDeps()
    harness.croma.registerError = error
    const response = await createConnection(harness.deps, makeCtx(harness.deps), postRequest(validBody()))
    const payload = await read(response)

    expect(response.status).toBe(status)
    expect(payload.error.code).toBe(code)
    expect(harness.db.types().at(-1)).toBe(event)
    expect(harness.db.audit.at(-1)?.outcome).toBe('failure')
    expect(harness.db.connections).toHaveLength(0)
    vi.restoreAllMocks()
  })

  it('forwards Retry-After for a busy service', async () => {
    const harness = makeDeps()
    harness.croma.registerError = new CromaError(429, 'connections_exhausted', 'x', 120)
    const response = await createConnection(harness.deps, makeCtx(harness.deps), postRequest(validBody()))
    expect(response.headers.get('retry-after')).toBe('120')
  })

  it('removes the Croma connection if saving our record fails, so no credential is orphaned', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const harness = makeDeps()
    harness.db.failInsertConnection = true
    const response = await createConnection(harness.deps, makeCtx(harness.deps), postRequest(validBody()))

    expect(response.status).toBe(500)
    expect(harness.croma.removed).toEqual(['conn_1'])
    vi.restoreAllMocks()
  })
})

describe('GET connections', () => {
  it('returns an empty list without calling Croma', async () => {
    const harness = makeDeps()
    const response = await listConnections(harness.deps, makeCtx(harness.deps), new Request('http://localhost/x'))
    expect((await read(response)).connections).toEqual([])
  })

  it("never shows one user another user's connection", async () => {
    const harness = makeDeps({ maxConnectionsPerUser: 5 })
    await createConnection(harness.deps, makeCtx(harness.deps, OTHER_USER), postRequest(validBody()))

    const mine = await listConnections(harness.deps, makeCtx(harness.deps), new Request('http://localhost/x'))
    expect((await read(mine)).connections).toEqual([])
  })

  it('serves stored data flagged stale when Croma is unreachable', async () => {
    const { deps, croma } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    croma.listError = new CromaError(0, 'croma_unreachable', 'x')

    const { connections } = await read(listConnections(deps, makeCtx(deps), new Request('http://localhost/x')))
    expect(connections[0].stale).toBe(true)
    expect(connections[0].status).toBe('active')
  })

  it('records a status change (system actor) when Croma reports a different status', async () => {
    const { deps, croma, db } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    croma.upstream[0].status = 'invalid'

    const { connections } = await read(listConnections(deps, makeCtx(deps), new Request('http://localhost/x')))
    expect(connections[0].status).toBe('invalid')
    expect(db.connections[0].status).toBe('invalid')
    const change = db.audit.at(-1)
    expect(change?.eventType).toBe('connection.status_changed')
    expect(change?.actor).toBe('system')
    expect(change?.metadata).toEqual({ from: 'active', to: 'invalid' })
  })

  it('treats a connection that no longer exists at Croma as invalid', async () => {
    const { deps, croma } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    croma.upstream = []

    const { connections } = await read(listConnections(deps, makeCtx(deps), new Request('http://localhost/x')))
    expect(connections[0].status).toBe('invalid')
  })
})

describe('DELETE connections', () => {
  const del = (id: string) => new Request(`http://localhost/api/bank/connections?id=${id}`, { method: 'DELETE' })

  it('removes the credentials at Croma, our record, and audits it', async () => {
    const { deps, croma, db } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    const id = db.connections[0].id

    const response = await deleteConnection(deps, makeCtx(deps), del(id))

    expect(response.status).toBe(200)
    expect(croma.removed).toEqual(['conn_1'])
    expect(db.connections).toHaveLength(0)
    expect(db.audit.at(-1)).toMatchObject({ eventType: 'connection.deleted', outcome: 'success', connectionId: id })
  })

  it("answers 404 for another user's connection and removes nothing", async () => {
    const { deps, croma, db } = makeDeps({ maxConnectionsPerUser: 5 })
    await createConnection(deps, makeCtx(deps, OTHER_USER), postRequest(validBody()))
    const theirs = db.connections[0].id

    const response = await deleteConnection(deps, makeCtx(deps), del(theirs))

    expect(response.status).toBe(404)
    expect(croma.removed).toEqual([])
    expect(db.connections).toHaveLength(1)
  })

  it('treats "already gone at Croma" as success', async () => {
    const { deps, croma, db } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    croma.removeError = new CromaError(404, 'not_found', 'x')

    const response = await deleteConnection(deps, makeCtx(deps), del(db.connections[0].id))
    expect(response.status).toBe(200)
    expect(db.connections).toHaveLength(0)
  })

  it('keeps our record and reports failure if Croma could not remove the credentials', async () => {
    const { deps, croma, db } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    croma.removeError = new CromaError(500, 'internal_error', 'x')

    const response = await deleteConnection(deps, makeCtx(deps), del(db.connections[0].id))

    expect(response.status).toBe(502)
    expect(db.connections).toHaveLength(1)
    expect(db.audit.at(-1)).toMatchObject({ eventType: 'connection.deleted', outcome: 'failure' })
  })
})

describe('GET accounts', () => {
  const get = (id: string) => new Request(`http://localhost/api/bank/accounts?connectionId=${id}`)

  it('returns masked numbers only and audits the read', async () => {
    const { deps, db } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    const response = await listAccounts(deps, makeCtx(deps), get(db.connections[0].id))
    const { accounts } = await read(response)

    expect(accounts[0]).toMatchObject({ numberMasked: '••••8901', type: 'savings', name: 'Mi ahorro', availableBalance: 4_200_000 })
    expect(JSON.stringify(accounts)).not.toContain('12345678901')
    expect(db.audit.at(-1)).toMatchObject({ eventType: 'accounts.read', outcome: 'success', metadata: { count: 1 } })
  })

  it("will not read another user's accounts", async () => {
    const { deps, db, croma } = makeDeps({ maxConnectionsPerUser: 5 })
    await createConnection(deps, makeCtx(deps, OTHER_USER), postRequest(validBody()))
    const response = await listAccounts(deps, makeCtx(deps), get(db.connections[0].id))
    expect(response.status).toBe(404)
    expect(croma.accountList).toBeDefined()
  })

  it('marks the connection invalid when the bank stops accepting the saved credentials', async () => {
    const { deps, db, croma } = makeDeps()
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))
    croma.accountsError = new CromaError(422, 'connection_rejected', 'x')

    const response = await listAccounts(deps, makeCtx(deps), get(db.connections[0].id))

    expect(response.status).toBe(422)
    expect(db.connections[0].status).toBe('invalid')
    expect(db.types()).toContain('connection.status_changed')
  })
})

describe('GET audit', () => {
  it("returns only the caller's events, newest first, without internal fields", async () => {
    const { deps } = makeDeps({ maxConnectionsPerUser: 5 })
    await createConnection(deps, makeCtx(deps, OTHER_USER), postRequest(validBody()))
    await createConnection(deps, makeCtx(deps), postRequest(validBody()))

    const { events } = await read(listAudit(deps, makeCtx(deps), new Request('http://localhost/x')))

    expect(events.map((event: { eventType: string }) => event.eventType)).toEqual([
      'connection.created',
      'connection.attempted',
      'consent.accepted',
    ])
    expect(Object.keys(events[0]).sort()).toEqual(
      ['actor', 'connectionId', 'errorCode', 'eventType', 'id', 'metadata', 'outcome', 'ts'],
    )
  })
})

describe('consent endpoint', () => {
  it('serves the text, version and hash for a locale', async () => {
    const response = getConsentHandler(new URL('http://localhost/api/bank/consent?locale=es'))
    const document = await read(response)
    expect(document.version).toBe(CONSENT_VERSION)
    expect(document.items).toHaveLength(4)
    expect(document.hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('rejects an unknown locale', () => {
    expect(getConsentHandler(new URL('http://localhost/api/bank/consent?locale=fr')).status).toBe(400)
  })
})

describe('withUser', () => {
  const ok = async () => new Response('ok')

  it('rejects a request with no bearer token', async () => {
    const { deps } = makeDeps()
    const response = await withUser(new Request('http://localhost/x'), ok, deps)
    expect(response.status).toBe(401)
  })

  it('rejects an invalid or expired token', async () => {
    const { deps } = makeDeps()
    const response = await withUser(
      new Request('http://localhost/x', { headers: { authorization: 'Bearer nope' } }),
      ok,
      deps,
    )
    expect(response.status).toBe(401)
  })

  it('runs the handler for a valid token', async () => {
    const { deps } = makeDeps()
    const response = await withUser(
      new Request('http://localhost/x', { headers: { authorization: 'Bearer good-token' } }),
      async (_deps, ctx) => new Response(ctx.user.id),
      deps,
    )
    expect(await response.text()).toBe(USER.id)
  })

  it('turns a configuration error into 503 and any other error into a generic 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { deps } = makeDeps()
    const request = () => new Request('http://localhost/x', { headers: { authorization: 'Bearer good-token' } })

    const misconfigured = await withUser(request(), async () => {
      throw new ConfigError('Missing environment variable CROMA_API_KEY')
    }, deps)
    expect(misconfigured.status).toBe(503)

    const broken = await withUser(request(), async () => {
      throw new Error(`boom ${PASSWORD}`)
    }, deps)
    expect(broken.status).toBe(500)
    expect(await broken.text()).not.toContain('boom')
    vi.restoreAllMocks()
  })
})
