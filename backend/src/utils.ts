import { eq, and, inArray } from 'drizzle-orm'

export async function assertTenantResource(
  db: any,
  table: any,
  id: string,
  companyId: string,
  resourceName: string = 'Recurso'
): Promise<void> {
  const results = await db.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.companyId, companyId)))
  if (results.length === 0) {
    throw new Error(`${resourceName} no encontrado o no pertenece a la empresa actual.`)
  }
}

export async function assertTenantResources(
  db: any,
  table: any,
  ids: string[],
  companyId: string,
  resourceName: string = 'Recursos'
): Promise<void> {
  if (!ids || ids.length === 0) return;
  const results = await db.select({ id: table.id }).from(table).where(and(inArray(table.id, ids), eq(table.companyId, companyId)))
  if (results.length !== ids.length) {
    throw new Error(`Alguno de los ${resourceName} no fue encontrado o no pertenece a la empresa actual.`)
  }
}

import { HTTPException } from 'hono/http-exception'
import * as schema from './db/schema'

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function requireRole(c: any, db: any, requiredRole: string = 'ADMIN'): Promise<void> {
  const jwtPayload = c.get('jwtPayload')
  if (!jwtPayload) {
    throw new HTTPException(401, { res: new Response('Unauthorized', { status: 401 }) })
  }

  // 1. Check payload role (fast path rejection)
  if (jwtPayload.role !== requiredRole) {
    const res = new Response(JSON.stringify({ error: `Forbidden: ${requiredRole} role required` }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
    throw new HTTPException(403, { res })
  }

  // 2. Query DB to ensure membership is still ACTIVE and still has the required role
  const memberships = await db.select().from(schema.companyMemberships)
    .where(and(
      eq(schema.companyMemberships.userId, jwtPayload.id),
      eq(schema.companyMemberships.companyId, jwtPayload.companyId)
    ))
  
  if (memberships.length === 0 || memberships[0].status !== 'ACTIVE' || memberships[0].role !== requiredRole) {
    const res = new Response(JSON.stringify({ error: `Forbidden: Membership is inactive or role was revoked` }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
    throw new HTTPException(403, { res })
  }
}
