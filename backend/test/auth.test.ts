import { describe, it, expect, beforeAll } from 'vitest'
import app from '../src/index'
import { getPlatformProxy } from 'wrangler'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import * as schema from '../src/db/schema'

describe('Auth & Workspaces', () => {
  let env: any;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    const proxy = await getPlatformProxy();
    env = proxy.env;
    env.JWT_SECRET = 'test-secret';
    // Stub KV rate limiter
    env.MALATESTA_KV = {
      get: async () => null,
      put: async () => {}
    };
    db = drizzle(env.DB);
    
    // Cleanup
    await db.delete(schema.users);
    await db.delete(schema.companies);
    await db.delete(schema.companyMemberships);
    await db.delete(schema.events);
    await db.delete(schema.clients);
    await db.delete(schema.budgets);
  })

  it('permite registro atómico y normaliza el email', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'TeSt@ExaMPle.COM',
        password: 'Password123!',
        companyName: 'Test Company'
      })
    });
    const res = await app.request(req, {}, env);
    const data = await res.json() as any;
    if (res.status !== 200) console.error(data);
    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
    expect(data.memberships.length).toBe(1);
    expect(data.memberships[0].role).toBe('ADMIN');
    expect(data.memberships[0].status).toBe('ACTIVE');

    // Verificar email repetido
    const req2 = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test 2',
        email: 'test@example.com',
        password: 'Password123!',
        companyName: 'Another Co'
      })
    });
    const res2 = await app.request(req2, {}, env);
    expect(res2.status).toBe(400);
  });

  it('bloquea switch-workspace sin token o con token inválido', async () => {
    const req = new Request('http://localhost/api/auth/switch-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: 'some-id' })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(401);
  });

  it('valida cross-tenant en PUT budgets', async () => {
    // Setup 2 companies
    const compA = 'compA';
    const compB = 'compB';
    const clientA = 'clientA';
    const clientB = 'clientB';
    const eventA = 'eventA';
    const eventB = 'eventB';
    
    await db.insert(schema.companies).values([
      { id: compA, name: 'A', createdAt: new Date().toISOString() },
      { id: compB, name: 'B', createdAt: new Date().toISOString() }
    ]);
    await db.insert(schema.clients).values([
      { id: clientA, companyId: compA, name: 'CA', email: 'ca@a', phone:'', company:'', notes:'', createdAt: '' },
      { id: clientB, companyId: compB, name: 'CB', email: 'cb@b', phone:'', company:'', notes:'', createdAt: '' }
    ]);
    await db.insert(schema.events).values([
      { id: eventA, companyId: compA, clientId: clientA, name: 'EA', date: '', location: '', type: '', attendees: 0, durationHours: 0, status: '', notes: '', createdAt: '' },
      { id: eventB, companyId: compB, clientId: clientB, name: 'EB', date: '', location: '', type: '', attendees: 0, durationHours: 0, status: '', notes: '', createdAt: '' }
    ]);

    const tokenA = await sign({ id: 'u1', email: 'u@u', companyId: compA, role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET);
    
    await db.insert(schema.budgets).values([
      { id: 'budA', companyId: compA, eventId: eventA, clientId: clientA, items: [], directCosts:0, partnerCosts:0, laborCosts:0, indirectCosts:0, totalCost:0, targetMarginPercentage:0, recommendedPriceWithoutVAT:0, recommendedPriceWithVAT:0, offeredPriceWithoutVAT:0, offeredPriceWithVAT:0, vatPercentage:0, expectedProfit:0, expectedMarginPercentage:0, status:'draft', createdAt: '' }
    ]);

    // Intentar PUT partial con client B
    const req = new Request('http://localhost/api/budgets/budA', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ clientId: clientB })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(400); // Porque clientB no pertenece a compA, salta assertTenantResource
    
    // Intentar PUT partial cambiando eventA por eventoA de un cliente distinto de companyA
    await db.insert(schema.clients).values([
      { id: 'clientA2', companyId: compA, name: 'CA2', email: 'ca2@a', phone:'', company:'', notes:'', createdAt: '' },
    ]);
    await db.insert(schema.events).values([
      { id: 'eventA2', companyId: compA, clientId: 'clientA2', name: 'EA2', date: '', location: '', type: '', attendees: 0, durationHours: 0, status: '', notes: '', createdAt: '' },
    ]);

    const req2 = new Request('http://localhost/api/budgets/budA', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ eventId: 'eventA2' })
    });
    // Fallará porque el event final (eventA2) tiene clientId 'clientA2', 
    // pero el presupuesto conserva clientId 'clientA'
    const res2 = await app.request(req2, {}, env);
    expect(res2.status).toBe(400);
    const data2 = await res2.json() as any;
    expect(data2.error).toContain('coincidir');
  });
  it('bloquea switch-workspace a una membership PENDING', async () => {
    // Create a second company with a PENDING membership for user 'u1'
    const compC = 'compC_pending'
    await db.insert(schema.companies).values({ id: compC, name: 'Pending Co', createdAt: new Date().toISOString() })
    await db.insert(schema.companyMemberships).values({
      id: 'mem_pending_1',
      userId: 'u1',
      companyId: compC,
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    })

    const token = await sign({ id: 'u1', email: 'u@u', companyId: 'compA', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET)
    const req = new Request('http://localhost/api/auth/switch-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ companyId: compC })
    })
    const res = await app.request(req, {}, env)
    // Must be rejected: membership is PENDING, not ACTIVE → 403 Forbidden
    expect(res.status).toBe(403)
    const data = await res.json() as any
    expect(data.error).toBeDefined()
  })

  it('permite switch-workspace a una membership ACTIVE y emite nuevo token', async () => {
    // Create a second company with an ACTIVE membership for user 'u1'
    const compD = 'compD_active'
    await db.insert(schema.companies).values({ id: compD, name: 'Active Co', createdAt: new Date().toISOString() })
    await db.insert(schema.companyMemberships).values({
      id: 'mem_active_1',
      userId: 'u1',
      companyId: compD,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    })
    // Also need user 'u1' to exist in DB
    const existingUsers = await db.select().from(schema.users).where(eq(schema.users.id, 'u1'))
    if (existingUsers.length === 0) {
      await db.insert(schema.users).values({ id: 'u1', email: 'u@u.com', passwordHash: 'x', passwordSalt: 'x', name: 'User1', createdAt: new Date().toISOString() })
    }

    const token = await sign({ id: 'u1', email: 'u@u', companyId: 'compA', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET)
    const req = new Request('http://localhost/api/auth/switch-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ companyId: compD })
    })
    const res = await app.request(req, {}, env)
    const data = await res.json() as any
    if (res.status !== 200) console.error('[switch-workspace valid]', data)
    expect(res.status).toBe(200)
    expect(data.token).toBeDefined()
    // Decode to check new companyId is in the token payload
    const parts = data.token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    expect(payload.companyId).toBe(compD)
  })
});
