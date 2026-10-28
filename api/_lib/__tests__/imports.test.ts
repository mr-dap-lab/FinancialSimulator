import { describe, expect, it, vi } from 'vitest'
import { CromaError } from '../croma.js'
import { createConnection, listTransactions, recordImport } from '../handlers.js'
import { OTHER_USER, makeCtx, makeDeps, postRequest, validBody } from './fakes.js'

// Response bodies are loosely typed in tests on purpose: they assert on wire JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const read = async (response: Response | Promise<Response>): Promise<any> => (await response).json()

async function connected() {
  const harness = makeDeps()
  await createConnection(harness.deps, makeCtx(harness.deps), postRequest(validBody()))
  return { ...harness, id: harness.db.connections[0].id }
}

describe('GET transactions', () => {
  const url = (id: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ connectionId: id, account: '••••8901', from: '2026-08-01', to: '2026-10-27', ...extra })
    return new Request(`http://localhost/api/bank/transactions?${params}`)
  }

  it('resolves the masked account to the full number server-side and returns the movements', async () => {
    const { deps, croma, id } = await connected()
    const response = await listTransactions(deps, makeCtx(deps), url(id))
    const { transactions } = await read(response)

    expect(response.status).toBe(200)
    expect(croma.transactionCalls).toEqual([
      { connectionId: 'conn_1', accountNumber: '12345678901', from: '2026-08-01', to: '2026-10-27' },
    ])
    expect(transactions).toHaveLength(2)
    expect(transactions[0]).toEqual({ date: '2026-10-02', description: 'COMPRA ALMACENES EXITO', amount: -380000, direction: 'debit' })
  })

  it('audits the read with counts and the window only — never what was bought', async () => {
    const { deps, db, id } = await connected()
    await listTransactions(deps, makeCtx(deps), url(id))

    expect(db.audit.at(-1)).toMatchObject({
      eventType: 'transactions.read',
      outcome: 'success',
      metadata: { count: 2, from: '2026-08-01', to: '2026-10-27', account: '••••8901' },
    })
    expect(JSON.stringify(db.audit)).not.toContain('EXITO')
    expect(JSON.stringify(db.audit)).not.toContain('NOMINA')
  })

  it.each([
    ['a missing account', { account: '' }],
    ['an impossible date', { from: '2026-02-30' }],
    ['a window that ends in the future', { to: '2026-10-29' }],
    ['a window that ends before it starts', { from: '2026-10-27', to: '2026-10-01' }],
    ['a window longer than 92 days', { from: '2026-07-01' }],
  ])('rejects %s without touching Croma', async (_label, extra) => {
    const { deps, croma, id } = await connected()
    const response = await listTransactions(deps, makeCtx(deps), url(id, extra))
    expect(response.status).toBe(400)
    expect(croma.transactionCalls).toHaveLength(0)
  })

  it("will not read another user's connection", async () => {
    const harness = makeDeps({ maxConnectionsPerUser: 5 })
    await createConnection(harness.deps, makeCtx(harness.deps, OTHER_USER), postRequest(validBody()))
    const response = await listTransactions(harness.deps, makeCtx(harness.deps), url(harness.db.connections[0].id))
    expect(response.status).toBe(404)
    expect(harness.croma.transactionCalls).toHaveLength(0)
  })

  it('answers 404 for an account the connection does not have', async () => {
    const { deps, id } = await connected()
    const response = await listTransactions(deps, makeCtx(deps), url(id, { account: '••••0000' }))
    expect(response.status).toBe(404)
  })

  it('refuses a result too large to review, instead of truncating it silently', async () => {
    const { deps, croma, id } = await connected()
    croma.transactionList = Array.from({ length: 1501 }, () => ({
      date: '2026-10-02',
      description: 'X',
      amount: -1,
      direction: 'debit' as const,
    }))
    const response = await listTransactions(deps, makeCtx(deps), url(id))
    expect(response.status).toBe(400)
  })

  it('marks the connection invalid when the bank stops accepting the saved credentials', async () => {
    const { deps, db, croma, id } = await connected()
    croma.transactionsError = new CromaError(422, 'connection_rejected', 'x')
    const response = await listTransactions(deps, makeCtx(deps), url(id))
    expect(response.status).toBe(422)
    expect(db.connections[0].status).toBe('invalid')
    expect(db.audit.at(-1)).toMatchObject({ eventType: 'transactions.read', outcome: 'failure' })
  })
})

describe('POST imports', () => {
  const importRequest = (body: unknown) =>
    new Request('http://localhost/api/bank/imports', { method: 'POST', body: JSON.stringify(body) })

  const applied = (id: string, overrides: Record<string, unknown> = {}) => ({
    connectionId: id,
    action: 'applied',
    from: '2026-08-01',
    to: '2026-10-27',
    changes: [{ field: 'food.groceries', before: 0, after: 380000 }],
    ...overrides,
  })

  it('records an applied import with its before/after changes', async () => {
    const { deps, db, id } = await connected()
    const response = await recordImport(deps, makeCtx(deps), importRequest(applied(id)))

    expect(response.status).toBe(200)
    expect(db.audit.at(-1)).toMatchObject({
      eventType: 'import.applied',
      outcome: 'success',
      connectionId: id,
      metadata: {
        from: '2026-08-01',
        to: '2026-10-27',
        changeCount: 1,
        changes: [{ field: 'food.groceries', before: 0, after: 380000 }],
      },
    })
  })

  it('records a discarded import without any changes', async () => {
    const { deps, db, id } = await connected()
    const response = await recordImport(deps, makeCtx(deps), importRequest(applied(id, { action: 'discarded', changes: [] })))
    expect(response.status).toBe(200)
    expect(db.audit.at(-1)).toMatchObject({ eventType: 'import.discarded', metadata: { from: '2026-08-01', to: '2026-10-27' } })
    expect(db.audit.at(-1)?.metadata).not.toHaveProperty('changes')
  })

  it.each([
    ['a field outside the allowlist', { changes: [{ field: 'primary.grossAmount', before: 0, after: 1 }] }],
    ['arbitrary text as a field', { changes: [{ field: 'x'.repeat(50), before: 0, after: 1 }] }],
    ['a negative amount', { changes: [{ field: 'food.groceries', before: 0, after: -5 }] }],
    ['a non-numeric amount', { changes: [{ field: 'food.groceries', before: '0', after: 1 }] }],
    ['an applied import with no changes', { changes: [] }],
    ['an unknown action', { action: 'deleted' }],
    ['an impossible date', { from: '2026-13-01' }],
  ])('rejects %s', async (_label, overrides) => {
    const { deps, db, id } = await connected()
    const before = db.audit.length
    const response = await recordImport(deps, makeCtx(deps), importRequest(applied(id, overrides)))
    expect(response.status).toBe(400)
    expect(db.audit).toHaveLength(before)
  })

  it("will not record against another user's connection", async () => {
    const harness = makeDeps({ maxConnectionsPerUser: 5 })
    await createConnection(harness.deps, makeCtx(harness.deps, OTHER_USER), postRequest(validBody()))
    const response = await recordImport(
      harness.deps,
      makeCtx(harness.deps),
      importRequest(applied(harness.db.connections[0].id)),
    )
    expect(response.status).toBe(404)
  })

  it('fails closed: if the trail cannot be written the client is told, so it does not apply the change', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { deps, db, id } = await connected()
    db.failAudit = true
    const response = await recordImport(deps, makeCtx(deps), importRequest(applied(id)))
    expect(response.status).toBe(503)
    expect((await read(response)).error.code).toBe('audit_unavailable')
    vi.restoreAllMocks()
  })
})
