import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign } from 'hono/jwt'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import * as schema from './db/schema'

export type Env = {
  DB: D1Database
  ASSETS: R2Bucket
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'malatesta_salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  const db = drizzle(c.env.DB)
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email))
  
  const user = users[0]
  if (!user) return c.json({ error: 'User not found' }, 401)
  
  const hashed = await hashPassword(password)
  if (user.passwordHash !== hashed) {
    return c.json({ error: 'Invalid password' }, 401)
  }

  const secret = c.env.JWT_SECRET || 'fallback_secret_for_dev_12345'
  const token = await sign({ id: user.id, email: user.email, companyId: user.companyId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret)
  
  return c.json({ token, user: { id: user.id, email: user.email, name: user.name, companyId: user.companyId } })
})

app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/auth/login' || c.req.path === '/api/health' || c.req.path === '/api/seed' || c.req.path.startsWith('/api/assets/')) {
    return next()
  }
  const secret = c.env.JWT_SECRET || 'fallback_secret_for_dev_12345'
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
  ] = await Promise.all([
    db.select().from(schema.clients).where(eq(schema.clients.companyId, companyId)),
    db.select().from(schema.partners).where(eq(schema.partners.companyId, companyId)),
    db.select().from(schema.packages).where(eq(schema.packages.companyId, companyId)),
    db.select().from(schema.events).where(eq(schema.events.companyId, companyId)),
    db.select().from(schema.budgets).where(eq(schema.budgets.companyId, companyId)),
    db.select().from(schema.payments).where(eq(schema.payments.companyId, companyId)),
    db.select().from(schema.postEventResults).where(eq(schema.postEventResults.companyId, companyId)),
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
    clients,
    partners,
    packages: packages.map(p => parseJson(p, ['partnerIds', 'customItems'])),
    events,
    budgets: budgets.map(b => parseJson(b, ['items'])),
    payments,
    postEventResults: postEventResults.map(p => parseJson(p, ['realCostLines'])),
  })
})

// --- SEED (Para resetDemo) ---
app.post('/api/seed', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  
  // Limpiar todas las tablas
  await db.delete(schema.users)
  await db.delete(schema.companies)
  await db.delete(schema.clients)
  await db.delete(schema.partners)
  await db.delete(schema.packages)
  await db.delete(schema.events)
  await db.delete(schema.budgets)
  await db.delete(schema.payments)
  await db.delete(schema.postEventResults)

  await db.insert(schema.companies).values({
    id: 'c_default',
    name: 'Pub Malatesta',
    email: 'contacto@malatesta.es',
    createdAt: new Date().toISOString()
  })

  const adminPass = await hashPassword('Malatesta*2026*')
  await db.insert(schema.users).values({
    id: 'u_admin',
    companyId: 'c_default',
    email: 'admin@malatesta.es',
    passwordHash: adminPass,
    name: 'Administrador',
    createdAt: new Date().toISOString()
  })

  // Insertar
  if (body.clients?.length) await db.insert(schema.clients).values(body.clients.map((i: any) => ({ ...i, companyId: 'c_default' })))
  if (body.partners?.length) await db.insert(schema.partners).values(body.partners.map((i: any) => ({ ...i, companyId: 'c_default' })))
  if (body.packages?.length) await db.insert(schema.packages).values(body.packages.map((i: any) => ({ ...i, companyId: 'c_default' })))
  if (body.events?.length) await db.insert(schema.events).values(body.events.map((i: any) => ({ ...i, companyId: 'c_default' })))
  if (body.budgets?.length) await db.insert(schema.budgets).values(body.budgets.map((i: any) => ({ ...i, companyId: 'c_default' })))
  if (body.payments?.length) await db.insert(schema.payments).values(body.payments.map((i: any) => ({ ...i, companyId: 'c_default' })))
  if (body.postEventResults?.length) await db.insert(schema.postEventResults).values(body.postEventResults.map((i: any) => ({ ...i, companyId: 'c_default' })))

  return c.json({ success: true })
})

// --- CLIENTS ---
app.post('/api/clients', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  body.companyId = c.get('jwtPayload').companyId
  await db.insert(schema.clients).values(body)
  return c.json({ success: true })
})
app.put('/api/clients/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  await db.update(schema.clients).set(body).where(and(eq(schema.clients.id, id), eq(schema.clients.companyId, companyId)))
  return c.json({ success: true })
})
app.delete('/api/clients/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  await db.delete(schema.clients).where(and(eq(schema.clients.id, id), eq(schema.clients.companyId, companyId)))
  return c.json({ success: true })
})

// --- PARTNERS ---
app.post('/api/partners', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  body.companyId = c.get('jwtPayload').companyId
  await db.insert(schema.partners).values(body)
  return c.json({ success: true })
})
app.put('/api/partners/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  await db.update(schema.partners).set(body).where(and(eq(schema.partners.id, id), eq(schema.partners.companyId, companyId)))
  return c.json({ success: true })
})
app.delete('/api/partners/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  await db.delete(schema.partners).where(and(eq(schema.partners.id, id), eq(schema.partners.companyId, companyId)))
  return c.json({ success: true })
})

// --- PACKAGES ---
app.post('/api/packages', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  body.companyId = c.get('jwtPayload').companyId
  await db.insert(schema.packages).values(body)
  return c.json({ success: true })
})
app.put('/api/packages/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  await db.update(schema.packages).set(body).where(and(eq(schema.packages.id, id), eq(schema.packages.companyId, companyId)))
  return c.json({ success: true })
})
app.delete('/api/packages/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  await db.delete(schema.packages).where(and(eq(schema.packages.id, id), eq(schema.packages.companyId, companyId)))
  return c.json({ success: true })
})

// --- EVENTS ---
app.post('/api/events', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  body.companyId = c.get('jwtPayload').companyId
  await db.insert(schema.events).values(body)
  return c.json({ success: true })
})
app.put('/api/events/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  await db.update(schema.events).set(body).where(and(eq(schema.events.id, id), eq(schema.events.companyId, companyId)))
  return c.json({ success: true })
})
app.delete('/api/events/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  await db.delete(schema.events).where(and(eq(schema.events.id, id), eq(schema.events.companyId, companyId)))
  return c.json({ success: true })
})

// --- BUDGETS ---
app.post('/api/budgets', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  body.companyId = c.get('jwtPayload').companyId
  await db.insert(schema.budgets).values(body)
  return c.json({ success: true })
})
app.put('/api/budgets/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  await db.update(schema.budgets).set(body).where(and(eq(schema.budgets.id, id), eq(schema.budgets.companyId, companyId)))
  return c.json({ success: true })
})
app.delete('/api/budgets/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  await db.delete(schema.budgets).where(and(eq(schema.budgets.id, id), eq(schema.budgets.companyId, companyId)))
  return c.json({ success: true })
})

// --- PAYMENTS ---
app.post('/api/payments', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  body.companyId = c.get('jwtPayload').companyId
  await db.insert(schema.payments).values(body)
  return c.json({ success: true })
})
app.put('/api/payments/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  const body = await c.req.json()
  await db.update(schema.payments).set(body).where(and(eq(schema.payments.id, id), eq(schema.payments.companyId, companyId)))
  return c.json({ success: true })
})
app.delete('/api/payments/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const id = c.req.param('id')
  const companyId = c.get('jwtPayload').companyId
  await db.delete(schema.payments).where(and(eq(schema.payments.id, id), eq(schema.payments.companyId, companyId)))
  return c.json({ success: true })
})

// --- POST EVENT RESULTS ---
app.post('/api/postEventResults', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  body.companyId = c.get('jwtPayload').companyId
  
  const existing = await db.select().from(schema.postEventResults).where(and(eq(schema.postEventResults.eventId, body.eventId), eq(schema.postEventResults.companyId, body.companyId)))
  if (existing.length > 0) {
    await db.update(schema.postEventResults).set(body).where(and(eq(schema.postEventResults.eventId, body.eventId), eq(schema.postEventResults.companyId, body.companyId)))
  } else {
    await db.insert(schema.postEventResults).values(body)
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
  await db.update(schema.companies).set({
    name: body.name,
    taxId: body.taxId,
    address: body.address,
    email: body.email,
    phone: body.phone,
    website: body.website,
    lightLogoUrl: body.lightLogoUrl,
    darkLogoUrl: body.darkLogoUrl
  }).where(eq(schema.companies.id, companyId))
  return c.json({ success: true })
})

// --- ASSETS (R2) ---
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    if (!file) return c.json({ error: 'No file provided' }, 400)
    
    // Generate simple unique ID
    const ext = file.name.split('.').pop() || 'png'
    const key = `logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    
    await c.env.ASSETS.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    })
    
    return c.json({ url: `/api/assets/${key}` })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get('/api/assets/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.ASSETS.get(key)
  if (!object) return new Response('Not Found', { status: 404 })
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, { headers })
})

export default app
