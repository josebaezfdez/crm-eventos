import { describe, it, expect, beforeAll } from 'vitest'
import app from '../src/index'
import { getPlatformProxy } from 'wrangler'
import { drizzle } from 'drizzle-orm/d1'
import { sign } from 'hono/jwt'
import * as schema from '../src/db/schema'

describe('RBAC (Role Based Access Control)', () => {
  let env: any;
  let db: ReturnType<typeof drizzle>;
  let tokenAdmin: string;
  let tokenMember: string;

  beforeAll(async () => {
    const proxy = await getPlatformProxy();
    env = proxy.env;
    env.JWT_SECRET = 'test-secret';
    db = drizzle(env.DB);
    
    // Cleanup
    await db.delete(schema.users);
    await db.delete(schema.companies);
    await db.delete(schema.companyMemberships);
    await db.delete(schema.events);

    const compId = 'comp-rbac';
    await db.insert(schema.companies).values({ id: compId, name: 'RBAC Co', createdAt: new Date().toISOString() });
    
    // Generate tokens explicitly for test
    tokenAdmin = await sign({ id: 'uA', email: 'a@a', companyId: compId, role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET);
    tokenMember = await sign({ id: 'uM', email: 'm@m', companyId: compId, role: 'MEMBER', exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET);
  })

  it('permite a un ADMIN actualizar la configuración de empresa', async () => {
    const req = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ name: 'New Name' })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(200);
  });

  it('bloquea a un MEMBER actualizar la configuración de empresa', async () => {
    const req = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenMember}` },
      body: JSON.stringify({ name: 'Hacked Name' })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(403); 
    const data = await res.json() as any;
    expect(data.error).toContain('Forbidden');
  });

  it('bloquea a un MEMBER eliminar un evento', async () => {
    const req = new Request('http://localhost/api/events/evt1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenMember}` }
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain('Forbidden');
  });
});
