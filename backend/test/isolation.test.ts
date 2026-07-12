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

    // Generar JWTs con role ADMIN para no interferir con RBAC
    tokenA = await sign({ id: 'user_A', email: 'user@a.com', companyId: companyA, role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET);
    tokenB = await sign({ id: 'user_B', email: 'user@b.com', companyId: companyB, role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }, env.JWT_SECRET);
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

  it('Empresa A no puede crear un evento usando el cliente de Empresa B', async () => {
    const req = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'event_A1',
        clientId: 'client_B1', // Este cliente es de B
        name: 'Hacked Event',
        date: '2026-10-10',
        location: 'Madrid',
        type: 'Empresa',
        attendees: 100,
        durationHours: 4,
        status: 'draft',
        notes: ''
      })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(400);

    const data = await res.json() as any;
    expect(data.error).toBe('Cliente no encontrado o no pertenece a la empresa actual.');

    // Verificar que no se creó
    const aEvents = await db.select().from(schema.events).where(eq(schema.events.id, 'event_A1')) as any[];
    expect(aEvents.length).toBe(0);
  });

  it('deniega acceso a asset privado de otro tenant', async () => {
    // The /api/assets/* endpoint checks that private/* keys start with the requester's companyId
    // Attempt to access a key that belongs to company B while authenticated as company A
    const req = new Request('http://localhost/api/assets/private/comp_B/documents/secret.pdf', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const res = await app.request(req, {}, env);
    // Must be 403 — tenantA should never access tenantB's private files
    expect(res.status).toBe(403);
  });

  it('paquetes archivados (isActive=false) no aparecen en el listado', async () => {
    const companyA = 'comp_A';
    const pkgActiveId = `pkg_active_${crypto.randomUUID()}`;
    const pkgArchivedId = `pkg_archived_${crypto.randomUUID()}`;
    // Insert one active and one archived package for company A
    await db.insert(schema.packages).values([
      { id: pkgActiveId, companyId: companyA, name: 'Activo', description: '', baseHours: 0, baseCost: 0, recommendedPrice: 0, partnerIds: [], customItems: [], marginTarget: 0, isActive: true, createdAt: new Date().toISOString() },
      { id: pkgArchivedId, companyId: companyA, name: 'Archivado', description: '', baseHours: 0, baseCost: 0, recommendedPrice: 0, partnerIds: [], customItems: [], marginTarget: 0, isActive: false, createdAt: new Date().toISOString() }
    ]);

    const req = new Request('http://localhost/api/all', {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const res = await app.request(req, {}, env);
    const data = await res.json() as any;

    const pkgIds = (data.packages as any[]).map((p: any) => p.id);
    expect(pkgIds).toContain(pkgActiveId);
    expect(pkgIds).not.toContain(pkgArchivedId);
  });

  it('PUT presupuesto con clientId de otro tenant devuelve 400 con mensaje correcto', async () => {
    const companyA = 'comp_A';
    const companyB = 'comp_B';
    const evtId = `evt_iso_${crypto.randomUUID()}`;
    const budId = `bud_iso_${crypto.randomUUID()}`;
    
    // Setup: event and budget for company A
    await db.insert(schema.events).values([
      { id: evtId, companyId: companyA, clientId: 'client_A1', name: 'Ev A', date: '2026-01-01', location: 'L', type: 'T', attendees: 1, durationHours: 1, status: 'draft', notes: '', createdAt: new Date().toISOString() }
    ]);
    await db.insert(schema.budgets).values([
      { id: budId, companyId: companyA, eventId: evtId, clientId: 'client_A1', items: [], directCosts: 0, partnerCosts: 0, laborCosts: 0, indirectCosts: 0, totalCost: 0, targetMarginPercentage: 0, recommendedPriceWithoutVAT: 0, recommendedPriceWithVAT: 0, offeredPriceWithoutVAT: 0, offeredPriceWithVAT: 0, vatPercentage: 0, expectedProfit: 0, expectedMarginPercentage: 0, status: 'draft', createdAt: new Date().toISOString() }
    ]);

    // Attempt: company A user tries to assign client_B1 (belongs to B) to its budget
    const req = new Request(`http://localhost/api/budgets/${budId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ clientId: 'client_B1' })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    // Should get the tenant-isolation error, NOT the cross-validation error
    expect(data.error).toContain('no pertenece a la empresa');
  });
});
