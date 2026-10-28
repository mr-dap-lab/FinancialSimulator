import { describe, expect, it } from 'vitest'
import { CromaError, createHttpCroma, createMockCroma } from '../croma.js'

const PASSWORD = 'S3cret-bank-pass!'

function stubFetch(responder: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = []
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} })
    return responder(String(url), init ?? {})
  }) as typeof fetch
  return { impl, calls }
}

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

describe('createHttpCroma', () => {
  it('registers with the documented endpoint, bearer key and authorized:true', async () => {
    const { impl, calls } = stubFetch(() =>
      jsonResponse(201, {
        data: {
          id: 'conn_abc',
          status: 'active',
          display_name: 'J*** P*** G***',
          usage: { sign_ins_today: 2, daily_limit: null, resets_at: '2026-10-29T05:00:00.000Z' },
          created_at: '2026-10-28T12:00:00.000Z',
          last_used_at: null,
        },
      }),
    )
    const connection = await createHttpCroma('croma_test_key', 'https://api.example', impl).register('jperez', PASSWORD)

    expect(calls[0].url).toBe('https://api.example/co/bancolombia/connections/v1')
    expect(calls[0].init.method).toBe('POST')
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe('Bearer croma_test_key')
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ username: 'jperez', password: PASSWORD, authorized: true })
    expect(connection).toMatchObject({
      id: 'conn_abc',
      status: 'active',
      displayName: 'J*** P*** G***',
      usage: { signInsToday: 2, dailyLimit: null, resetsAt: '2026-10-29T05:00:00.000Z' },
    })
  })

  it("maps Croma's error envelope to a CromaError with code and Retry-After", async () => {
    const { impl } = stubFetch(() =>
      jsonResponse(429, { error: { type: 'rate_limit_error', code: 'connections_exhausted', message: 'used up' } }, { 'retry-after': '90' }),
    )
    const error = await createHttpCroma('k', 'https://api.example', impl).accounts('conn_abc').catch((e) => e)

    expect(error).toBeInstanceOf(CromaError)
    expect(error).toMatchObject({ status: 429, code: 'connections_exhausted', retryAfter: 90 })
  })

  it('never leaks the password in the error it throws when the network fails', async () => {
    const { impl } = stubFetch(() => {
      throw new TypeError(`fetch failed for body ${PASSWORD}`)
    })
    const error = await createHttpCroma('k', 'https://api.example', impl).register('jperez', PASSWORD).catch((e) => e)

    expect(error).toMatchObject({ status: 0, code: 'croma_unreachable' })
    expect(String(error.message)).not.toContain(PASSWORD)
  })

  it('treats an unknown connection status as active, not as a reconnect alarm', async () => {
    const { impl } = stubFetch(() => jsonResponse(200, { data: [{ id: 'conn_1', status: 'something_new' }] }))
    const [connection] = await createHttpCroma('k', 'https://api.example', impl).list()
    expect(connection.status).toBe('active')
  })

  it('reads accounts with the connection id in the body', async () => {
    const { impl, calls } = stubFetch(() =>
      jsonResponse(200, { data: { count: 1, accounts: [{ number: '123', custom_name: 'Ahorro', type: 'savings', currency: 'COP', status: 'ACTIVO', available_balance: 10 }] } }),
    )
    const accounts = await createHttpCroma('k', 'https://api.example', impl).accounts('conn_abc')

    expect(JSON.parse(String(calls[0].init.body))).toEqual({ connection_id: 'conn_abc' })
    expect(accounts[0]).toMatchObject({ number: '123', customName: 'Ahorro', type: 'savings', availableBalance: 10 })
  })

  it('deletes with the connection id in the path', async () => {
    const { impl, calls } = stubFetch(() => new Response(null, { status: 204 }))
    await createHttpCroma('k', 'https://api.example', impl).remove('conn_abc')
    expect(calls[0].url).toBe('https://api.example/co/bancolombia/connections/v1/conn_abc')
    expect(calls[0].init.method).toBe('DELETE')
  })
})

describe('createMockCroma', () => {
  it('lets each failure path be triggered by username', async () => {
    const croma = createMockCroma()
    await expect(croma.register('rechazado1', 'x')).rejects.toMatchObject({ code: 'connection_rejected' })
    await expect(croma.register('duplicada1', 'x')).rejects.toMatchObject({ code: 'connection_exists' })
    await expect(croma.register('sincupo1', 'x')).rejects.toMatchObject({ code: 'connection_limit_reached' })
    await expect(croma.register('ocupado1', 'x')).rejects.toMatchObject({ status: 429, retryAfter: 120 })
  })
})
