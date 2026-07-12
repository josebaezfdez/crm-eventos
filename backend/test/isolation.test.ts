import { describe, it, expect, beforeAll } from 'vitest'
import app from '../src/index'
import { getPlatformProxy } from 'wrangler'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import * as schema from '../src/db/schema'

describe('Multi-tenant Isolation & Soft Delete', () => {
  let env: any;
  let db: ReturnType<typeof drizzle>;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const proxy = await getPlatformProxy();
    env = proxy.env;
    env.JWT_SECRET = 'test-secret';
    db = drizzle(env.DB);

    // Limpiar BD local de test (si tuviera datos)
    await db.delete(schema.companies);
    await db.delete(schema.clients);

    // Setup initial data
    const companyA = 'comp_A';
    const companyB = 'comp_B';

    await db.insert(schema.companies).values([
      { id: companyA, name: 'Empresa A', createdAt: new Date().toISOString() },
      { id: companyB, name: 'Empresa B', createdAt: new Date().toISOString() }
    ]);

    await db.insert(schema.clients).values([
      { id: 'client_A1', companyId: companyA, name: 'Client A1', email: 'a@a.com', phone: '', company: '', notes: '', createdAt: new Date().toISOString() },
      { id: 'client_B1', companyId: companyB, name: 'Client B1', email: 'b@b.com', phone: '', company: '', notes: '', createdAt: new Date().toISOString() }
    ]);

    // Generar JWTs
    tokenA = await sign({ id: 'user_A', email: 'user@a.com', companyId: companyA, exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET);
    tokenB = await sign({ id: 'user_B', email: 'user@b.com', companyId: companyB, exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET);
  })

  it('Empresa A no ve a los clientes de Empresa B', async () => {
    const req = new Request('http://localhost/api/all', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const res = await app.request(req, {}, env);
    const data = await res.json() as any;

    expect(data.clients).toHaveLength(1);
    expect(data.clients[0].id).toBe('client_A1');
  });

  it('Empresa A no puede actualizar el cliente de Empresa B', async () => {
    const req = new Request('http://localhost/api/clients/client_B1', {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Hacked Name' })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(404); // Ya que implementamos que si meta.changes === 0, devuelva 404

    // Verificar en BD que no cambió
    const bClients = await db.select().from(schema.clients).where(eq(schema.clients.id, 'client_B1')) as any[];
    expect(bClients[0].name).toBe('Client B1');
  });

  it('Empresa A no puede eliminar el cliente de Empresa B', async () => {
    const req = new Request('http://localhost/api/clients/client_B1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(404);

    // Verificar en BD que sigue existiendo
    const bClients = await db.select().from(schema.clients).where(eq(schema.clients.id, 'client_B1')) as any[];
    expect(bClients.length).toBe(1);
  });
});
