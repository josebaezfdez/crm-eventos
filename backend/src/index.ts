import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign } from 'hono/jwt'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from './db/schema'
import * as validators from './validators'
import { assertTenantResource, assertTenantResources } from './utils'

export type Env = {
  DB: D1Database
  ASSETS: R2Bucket
  JWT_SECRET: string
}

type Variables = {
  jwtPayload: { id: string; email: string; companyId: string; exp: number }
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/api/*', cors({
  origin: ['https://crm-eventos.pages.dev', 'http://localhost:5173']
}))

async function hashPassword(password: string, providedSalt?: string): Promise<{ hash: string, salt: string }> {
  const enc = new TextEncoder();
  
  let saltArray: Uint8Array;
  if (providedSalt) {
    saltArray = new Uint8Array(providedSalt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  } else {
    saltArray = crypto.getRandomValues(new Uint8Array(16));
  }
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltArray,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: hashHex, salt: saltHex };
}

app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = validators.registerSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const { name, email, password, companyName } = parsed.data
    
    const db = drizzle(c.env.DB)
    // Check if user already exists
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email))
    if (existingUser.length > 0) return c.json({ error: 'El email ya está registrado' }, 400)

    const userId = `user_${Date.now()}`
    const companyId = `company_${Date.now()}`
    const membershipId = `mem_${Date.now()}`
    const now = new Date().toISOString()

    const { hash, salt } = await hashPassword(password)

    // Insert user
    await db.insert(schema.users).values({
      id: userId,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      name,
      createdAt: now
    })

    // Insert company
    await db.insert(schema.companies).values({
      id: companyId,
      name: companyName,
      createdAt: now
    })

    // Insert membership
    await db.insert(schema.companyMemberships).values({
      id: membershipId,
      userId,
      companyId,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: now
    })

    const secret = c.env.JWT_SECRET
    if (!secret) return c.json({ error: 'Server configuration error' }, 500)
    
    const token = await sign({ id: userId, email, companyId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret)
    
    const memberships = await db.select().from(schema.companyMemberships).where(eq(schema.companyMemberships.userId, userId))

    return c.json({ 
      token, 
      user: { id: userId, email, name, companyId },
      memberships
    })
  } catch (err: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = validators.loginSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const { email, password } = parsed.data
    const db = drizzle(c.env.DB)
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email))
    
    const user = users[0]
    if (!user) return c.json({ error: 'User not found' }, 401)
    
    const { hash } = await hashPassword(password, user.passwordSalt)
    if (user.passwordHash !== hash) {
      return c.json({ error: 'Invalid password' }, 401)
    }

    const memberships = await db.select().from(schema.companyMemberships).where(eq(schema.companyMemberships.userId, user.id))
    if (memberships.length === 0) {
      return c.json({ error: 'User has no active memberships' }, 403)
    }
    const activeMembership = memberships[0]

    const secret = c.env.JWT_SECRET
    if (!secret) return c.json({ error: 'Server configuration error' }, 500)
    
    const token = await sign({ id: user.id, email: user.email, companyId: activeMembership.companyId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret)
    
    return c.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, companyId: activeMembership.companyId },
      memberships
    })
  } catch (err: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/auth/switch-workspace', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  const { companyId } = body
  const jwtPayload = c.get('jwtPayload')
  
  if (!companyId) return c.json({ error: 'companyId is required' }, 400)

  const memberships = await db.select().from(schema.companyMemberships)
    .where(and(
      eq(schema.companyMemberships.userId, jwtPayload.id),
      eq(schema.companyMemberships.companyId, companyId)
    ))

  if (memberships.length === 0) {
    return c.json({ error: 'Membership not found or unauthorized' }, 403)
  }

  const secret = c.env.JWT_SECRET
  if (!secret) return c.json({ error: 'Server configuration error' }, 500)

  const token = await sign({ id: jwtPayload.id, email: jwtPayload.email, companyId: companyId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret)
  
  return c.json({ token, companyId })
})

app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/auth/login' || c.req.path === '/api/auth/register' || c.req.path === '/api/health' || c.req.path.startsWith('/api/assets/public/')) {
    return next()
  }
  const secret = c.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not configured")
  
  const jwtMiddleware = jwt({ secret, alg: 'HS256' })
  return jwtMiddleware(c, next)
})

app.get('/api/health', (c) => c.json({ status: 'ok' }))

// --- ALL DATA (Para inicialización rápida) ---
app.get('/api/all', async (c) => {
  const db = drizzle(c.env.DB)
  const companyId = c.get('jwtPayload').companyId
  const [
    clients,
    partners,
    packages,
    events,
    budgets,
    payments,
    postEventResults,
    companies,
  ] = await Promise.all([
    db.select().from(schema.clients).where(eq(schema.clients.companyId, companyId)),
    db.select().from(schema.partners).where(and(eq(schema.partners.companyId, companyId), eq(schema.partners.isActive, true))),
    db.select().from(schema.packages).where(and(eq(schema.packages.companyId, companyId), eq(schema.packages.isActive, true))),
    db.select().from(schema.events).where(eq(schema.events.companyId, companyId)),
    db.select().from(schema.budgets).where(eq(schema.budgets.companyId, companyId)),
    db.select().from(schema.payments).where(eq(schema.payments.companyId, companyId)),
    db.select().from(schema.postEventResults).where(eq(schema.postEventResults.companyId, companyId)),
    db.select().from(schema.companies).where(eq(schema.companies.id, companyId)),
  ])
  
  // Parse JSON fields
  const parseJson = (item: any, fields: string[]) => {
    fields.forEach(f => {
      if (typeof item[f] === 'string') {
        try { item[f] = JSON.parse(item[f]) } catch (e) {}
      }
    })
    return item
  }

  return c.json({
    settings: companies[0] || {},
    clients,
    partners,
    packages: packages.map(p => parseJson(p, ['partnerIds', 'customItems'])),
    events,
    budgets: budgets.map(b => parseJson(b, ['items'])),
    payments,
    postEventResults: postEventResults.map(p => parseJson(p, ['realCostLines'])),
  })
})



// --- CLIENTS ---
app.post('/api/clients', async (c) => {
  try {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const parsed = validators.clientSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const data = parsed.data as any
    data.companyId = c.get('jwtPayload').companyId
    if (!data.createdAt) data.createdAt = new Date().toISOString()
    await db.insert(schema.clients).values(data)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})
app.put('/api/clients/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  const parsed = validators.clientUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)
  const result = await db.update(schema.clients).set(parsed.data).where(and(eq(schema.clients.id, id), eq(schema.clients.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/clients/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const result = await db.delete(schema.clients).where(and(eq(schema.clients.id, id), eq(schema.clients.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// --- PARTNERS ---
app.post('/api/partners', async (c) => {
  try {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const parsed = validators.partnerSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const data = parsed.data as any
    data.companyId = c.get('jwtPayload').companyId
    if (!data.createdAt) data.createdAt = new Date().toISOString()
    await db.insert(schema.partners).values(data)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})
app.put('/api/partners/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  const parsed = validators.partnerUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)
  const result = await db.update(schema.partners).set(parsed.data).where(and(eq(schema.partners.id, id), eq(schema.partners.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/partners/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const result = await db.update(schema.partners).set({ isActive: false }).where(and(eq(schema.partners.id, id), eq(schema.partners.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// --- PACKAGES ---
app.post('/api/packages', async (c) => {
  try {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const parsed = validators.packageSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const data = parsed.data as any
    data.companyId = c.get('jwtPayload').companyId
    
    await assertTenantResources(db, schema.partners, data.partnerIds, data.companyId, 'Proveedores')

    if (!data.createdAt) data.createdAt = new Date().toISOString()
    await db.insert(schema.packages).values(data)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})
app.put('/api/packages/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  const parsed = validators.packageUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)
  
  if (parsed.data.partnerIds) {
    await assertTenantResources(db, schema.partners, parsed.data.partnerIds, companyId, 'Proveedores')
  }

  const result = await db.update(schema.packages).set(parsed.data).where(and(eq(schema.packages.id, id), eq(schema.packages.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/packages/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const result = await db.update(schema.packages).set({ isActive: false }).where(and(eq(schema.packages.id, id), eq(schema.packages.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// --- EVENTS ---
app.post('/api/events', async (c) => {
  try {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const parsed = validators.eventSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const data = parsed.data as any
    data.companyId = c.get('jwtPayload').companyId
    
    await assertTenantResource(db, schema.clients, data.clientId, data.companyId, 'Cliente')
    if (data.acceptedBudgetId) {
      await assertTenantResource(db, schema.budgets, data.acceptedBudgetId, data.companyId, 'Presupuesto')
    }

    if (!data.createdAt) data.createdAt = new Date().toISOString()
    await db.insert(schema.events).values(data)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})
app.put('/api/events/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  const parsed = validators.eventUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)
  
  if (parsed.data.clientId) {
    await assertTenantResource(db, schema.clients, parsed.data.clientId, companyId, 'Cliente')
  }
  if (parsed.data.acceptedBudgetId) {
    await assertTenantResource(db, schema.budgets, parsed.data.acceptedBudgetId, companyId, 'Presupuesto')
  }

  const result = await db.update(schema.events).set(parsed.data).where(and(eq(schema.events.id, id), eq(schema.events.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/events/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const result = await db.delete(schema.events).where(and(eq(schema.events.id, id), eq(schema.events.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// --- BUDGETS ---
app.post('/api/budgets', async (c) => {
  try {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const parsed = validators.budgetSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const data = parsed.data as any
    data.companyId = c.get('jwtPayload').companyId
    
    await assertTenantResource(db, schema.events, data.eventId, data.companyId, 'Evento')
    await assertTenantResource(db, schema.clients, data.clientId, data.companyId, 'Cliente')
    if (data.packageId) {
      await assertTenantResource(db, schema.packages, data.packageId, data.companyId, 'Paquete')
    }

    if (!data.createdAt) data.createdAt = new Date().toISOString()
    await db.insert(schema.budgets).values(data)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})
app.put('/api/budgets/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  const parsed = validators.budgetUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)

  if (parsed.data.eventId) {
    await assertTenantResource(db, schema.events, parsed.data.eventId, companyId, 'Evento')
  }
  if (parsed.data.clientId) {
    await assertTenantResource(db, schema.clients, parsed.data.clientId, companyId, 'Cliente')
  }
  if (parsed.data.packageId) {
    await assertTenantResource(db, schema.packages, parsed.data.packageId, companyId, 'Paquete')
  }

  const result = await db.update(schema.budgets).set(parsed.data).where(and(eq(schema.budgets.id, id), eq(schema.budgets.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/budgets/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const result = await db.delete(schema.budgets).where(and(eq(schema.budgets.id, id), eq(schema.budgets.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// --- PAYMENTS ---
app.post('/api/payments', async (c) => {
  try {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const parsed = validators.paymentSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const data = parsed.data as any
    data.companyId = c.get('jwtPayload').companyId

    await assertTenantResource(db, schema.events, data.eventId, data.companyId, 'Evento')

    await db.insert(schema.payments).values(data)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})
app.put('/api/payments/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  const parsed = validators.paymentUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)

  if (parsed.data.eventId) {
    await assertTenantResource(db, schema.events, parsed.data.eventId, companyId, 'Evento')
  }

  const result = await db.update(schema.payments).set(parsed.data).where(and(eq(schema.payments.id, id), eq(schema.payments.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/payments/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const result = await db.delete(schema.payments).where(and(eq(schema.payments.id, id), eq(schema.payments.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// --- POST EVENT RESULTS ---
app.post('/api/postEventResults', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  const parsed = validators.postEventResultSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)
  const data = parsed.data as any
  data.companyId = c.get('jwtPayload').companyId
  
  try {
    await assertTenantResource(db, schema.events, data.eventId, data.companyId, 'Evento')
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }

  const existing = await db.select().from(schema.postEventResults).where(and(eq(schema.postEventResults.eventId, data.eventId), eq(schema.postEventResults.companyId, data.companyId)))
  if (existing.length > 0) {
    await db.update(schema.postEventResults).set(data).where(and(eq(schema.postEventResults.eventId, data.eventId), eq(schema.postEventResults.companyId, data.companyId)))
  } else {
    await db.insert(schema.postEventResults).values(data)
  }
  return c.json({ success: true })
})

// --- SETTINGS ---
app.get('/api/settings', async (c) => {
  const db = drizzle(c.env.DB)
  const jwtPayload = c.get('jwtPayload')
  const companyId = jwtPayload.companyId
  const companies = await db.select().from(schema.companies).where(eq(schema.companies.id, companyId))
  return c.json(companies[0] || {})
})

app.put('/api/settings', async (c) => {
  const db = drizzle(c.env.DB)
  const jwtPayload = c.get('jwtPayload')
  const companyId = jwtPayload.companyId
  const body = await c.req.json()
  const parsed = validators.companyUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)
  
  const result = await db.update(schema.companies).set(parsed.data).where(eq(schema.companies.id, companyId))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// --- ASSETS (R2) ---
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as unknown as File
    if (!file) return c.json({ error: 'No file provided' }, 400)
    
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedMimeTypes.includes(file.type)) return c.json({ error: 'Formato no permitido' }, 400)
    if (file.size > 2 * 1024 * 1024) return c.json({ error: 'El archivo excede 2MB' }, 400)
    
    const ext = file.name.split('.').pop() || 'png'
    const isPublic = formData.get('isPublic') === 'true'
    const prefix = isPublic ? 'public/' : 'private/'
    const key = `${prefix}logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    
    await c.env.ASSETS.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    })
    
    return c.json({ url: `/api/assets/${key}` })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

app.get('/api/assets/*', async (c) => {
  const key = c.req.path.replace('/api/assets/', '')
  const object = await c.env.ASSETS.get(key)
  if (!object) return new Response('Not Found', { status: 404 })
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, { headers })
})

export default app
