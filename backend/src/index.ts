import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign } from 'hono/jwt'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from './db/schema'
import * as validators from './validators'
import { assertTenantResource, assertTenantResources, requireRole, hashToken } from './utils'

export type Env = {
  DB: D1Database
  ASSETS: R2Bucket
  JWT_SECRET: string
  MALATESTA_KV: KVNamespace
  TURNSTILE_SECRET_KEY?: string
  RESEND_API_KEY?: string
}

type Variables = {
  jwtPayload: { id: string; email: string; companyId: string; role: string; exp: number }
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('/api/*', cors({
  origin: ['https://crm-eventos.pages.dev', 'http://localhost:5173']
}))

async function verifyTurnstile(token: string, secret?: string): Promise<boolean> {
  if (!secret) return true // Skip if no secret configured
  const formData = new FormData()
  formData.append('secret', secret)
  formData.append('response', token)
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
  const result = await fetch(url, { body: formData, method: 'POST' })
  const outcome = await result.json() as any
  return outcome.success
}

async function rateLimit(kv: KVNamespace, ip: string, limit: number, windowSec: number): Promise<boolean> {
  const key = `rl_${ip}`
  const current = await kv.get(key)
  const count = current ? parseInt(current) : 0
  if (count >= limit) return false
  await kv.put(key, (count + 1).toString(), { expirationTtl: windowSec })
  return true
}

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
    const ip = c.req.header('cf-connecting-ip') || 'unknown'
    const allowed = await rateLimit(c.env.MALATESTA_KV, ip, 5, 3600) // 5 registrations per hour
    if (!allowed) return c.json({ error: 'Demasiadas solicitudes. Intente más tarde.' }, 429)

    const body = await c.req.json()
    
    // Turnstile check
    if (c.env.TURNSTILE_SECRET_KEY) {
      if (!body.turnstileToken) {
        return c.json({ error: 'Validación de seguridad requerida' }, 403)
      }
      const isValid = await verifyTurnstile(body.turnstileToken, c.env.TURNSTILE_SECRET_KEY)
      if (!isValid) return c.json({ error: 'Validación de seguridad fallida' }, 403)
    }

    const parsed = validators.registerSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const { name, email, password, companyName } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()
    
    const db = drizzle(c.env.DB)
    const secret = c.env.JWT_SECRET
    if (!secret) return c.json({ error: 'Server configuration error' }, 500)

    // Check if user already exists
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail))
    if (existingUser.length > 0) return c.json({ error: 'El email ya está registrado' }, 400)

    const userId = `user_${crypto.randomUUID()}`
    const companyId = `company_${crypto.randomUUID()}`
    const membershipId = `mem_${crypto.randomUUID()}`
    const now = new Date().toISOString()

    const { hash, salt } = await hashPassword(password)

    // Insert user
    // Execute atomic batch insert
    await db.batch([
      db.insert(schema.users).values({
        id: userId,
        email: normalizedEmail,
        passwordHash: hash,
        passwordSalt: salt,
        name,
        createdAt: now
      }),
      db.insert(schema.companies).values({
        id: companyId,
        name: companyName,
        createdAt: now
      }),
      db.insert(schema.companyMemberships).values({
        id: membershipId,
        userId,
        companyId,
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: now
      })
    ])
    
    const token = await sign({ id: userId, email: normalizedEmail, companyId, role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret)
    
    // Create verification token and send email
    const verifToken = crypto.randomUUID()
    const hashedVerifToken = await hashToken(verifToken)
    await db.insert(schema.authTokens).values({
      id: crypto.randomUUID(),
      userId,
      tokenHash: hashedVerifToken,
      type: 'VERIFICATION',
      expiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      createdAt: now
    })
    const link = `https://crm-eventos.pages.dev/verify-email?token=${verifToken}`
    await sendEmail(c, normalizedEmail, 'Verifica tu cuenta', `<p>Por favor, verifica tu correo haciendo clic aquí: <a href="${link}">${link}</a></p>`)

    const memberships = await db.select({
      id: schema.companyMemberships.id,
      userId: schema.companyMemberships.userId,
      companyId: schema.companyMemberships.companyId,
      role: schema.companyMemberships.role,
      status: schema.companyMemberships.status,
      companyName: schema.companies.name
    }).from(schema.companyMemberships)
      .innerJoin(schema.companies, eq(schema.companyMemberships.companyId, schema.companies.id))
      .where(and(eq(schema.companyMemberships.userId, userId), eq(schema.companyMemberships.status, 'ACTIVE')))

    return c.json({ 
      token, 
      user: { id: userId, email: normalizedEmail, name, companyId },
      memberships
    })
  } catch (err: any) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  try {
    const ip = c.req.header('cf-connecting-ip') || 'unknown'
    const allowed = await rateLimit(c.env.MALATESTA_KV, ip, 10, 600) // 10 logins per 10 minutes
    if (!allowed) return c.json({ error: 'Demasiadas solicitudes. Intente más tarde.' }, 429)

    const body = await c.req.json()

    // Turnstile check
    if (c.env.TURNSTILE_SECRET_KEY) {
      if (!body.turnstileToken) {
        return c.json({ error: 'Validación de seguridad requerida' }, 403)
      }
      const isValid = await verifyTurnstile(body.turnstileToken, c.env.TURNSTILE_SECRET_KEY)
      if (!isValid) return c.json({ error: 'Validación de seguridad fallida' }, 403)
    }

    const parsed = validators.loginSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error }, 400)
    const { email, password } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    const db = drizzle(c.env.DB)
    const users = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail))
    
    const user = users[0]
    if (!user) return c.json({ error: 'User not found' }, 401)
    
    const { hash } = await hashPassword(password, user.passwordSalt)
    if (user.passwordHash !== hash) {
      return c.json({ error: 'Invalid password' }, 401)
    }

    const memberships = await db.select({
      id: schema.companyMemberships.id,
      userId: schema.companyMemberships.userId,
      companyId: schema.companyMemberships.companyId,
      role: schema.companyMemberships.role,
      status: schema.companyMemberships.status,
      companyName: schema.companies.name
    }).from(schema.companyMemberships)
      .innerJoin(schema.companies, eq(schema.companyMemberships.companyId, schema.companies.id))
      .where(and(eq(schema.companyMemberships.userId, user.id), eq(schema.companyMemberships.status, 'ACTIVE')))

    if (memberships.length === 0) {
      return c.json({ error: 'User has no active memberships' }, 403)
    }
    const activeMembership = memberships[0]

    const secret = c.env.JWT_SECRET
    if (!secret) return c.json({ error: 'Server configuration error' }, 500)
    
    const token = await sign({ id: user.id, email: user.email, companyId: activeMembership.companyId, role: activeMembership.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret)
    
    return c.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, companyId: activeMembership.companyId, emailVerified: user.emailVerified }, 
      memberships 
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// Mock Email Sender
async function sendEmail(c: any, to: string, subject: string, html: string) {
  if (!c.env.RESEND_API_KEY) {
    console.log(`[MOCK EMAIL to ${to}] Subject: ${subject} \nBody: ${html}`)
    return
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'EventMargin <noreply@eventmargin.com>', to, subject, html })
  })
}

app.post('/api/auth/forgot-password', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const allowed = await rateLimit(c.env.MALATESTA_KV, ip, 3, 3600) // 3 reqs per hour
  if (!allowed) return c.json({ error: 'Too many requests' }, 429)

  const body = await c.req.json()
  if (c.env.TURNSTILE_SECRET_KEY) {
    if (!body.turnstileToken) {
      return c.json({ error: 'Validación de seguridad requerida' }, 403)
    }
    const isValid = await verifyTurnstile(body.turnstileToken, c.env.TURNSTILE_SECRET_KEY)
    if (!isValid) return c.json({ error: 'Validación de seguridad fallida' }, 403)
  }

  const { email } = body
  if (!email) return c.json({ error: 'Email requerido' }, 400)

  const db = drizzle(c.env.DB)
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email.trim().toLowerCase()))
  if (users.length > 0) {
    const user = users[0]
    const token = crypto.randomUUID()
    const hashedToken = await hashToken(token)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 // 1 hour
    await db.insert(schema.authTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: hashedToken,
      type: 'RECOVERY',
      expiresAt,
      createdAt: new Date().toISOString()
    })
    
    const link = `https://crm-eventos.pages.dev/reset-password?token=${token}`
    await sendEmail(c, user.email, 'Recuperación de contraseña', `<p>Recupera tu contraseña: <a href="${link}">${link}</a></p>`)
  }
  
  return c.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' })
})

app.post('/api/auth/reset-password', async (c) => {
  const body = await c.req.json()
  const parsed = z.object({ token: z.string(), newPassword: z.string().min(6) }).safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error }, 400)
  
  const { token, newPassword } = parsed.data
  const db = drizzle(c.env.DB)
  
  const hashedToken = await hashToken(token)
  const tokens = await db.select().from(schema.authTokens).where(and(eq(schema.authTokens.tokenHash, hashedToken), eq(schema.authTokens.type, 'RECOVERY')))
  if (tokens.length === 0 || tokens[0].expiresAt < Math.floor(Date.now() / 1000)) {
    return c.json({ error: 'Token inválido o expirado' }, 400)
  }

  const { hash, salt } = await hashPassword(newPassword)
  await db.update(schema.users).set({ passwordHash: hash, passwordSalt: salt }).where(eq(schema.users.id, tokens[0].userId))
  await db.delete(schema.authTokens).where(eq(schema.authTokens.id, tokens[0].id))
  
  return c.json({ success: true })
})

app.post('/api/auth/verify-email', async (c) => {
  const { token } = await c.req.json()
  const db = drizzle(c.env.DB)
  
  const hashedToken = await hashToken(token)
  const tokens = await db.select().from(schema.authTokens).where(and(eq(schema.authTokens.tokenHash, hashedToken), eq(schema.authTokens.type, 'VERIFICATION')))
  if (tokens.length === 0 || tokens[0].expiresAt < Math.floor(Date.now() / 1000)) {
    return c.json({ error: 'Token inválido o expirado' }, 400)
  }

  await db.update(schema.users).set({ emailVerified: true }).where(eq(schema.users.id, tokens[0].userId))
  await db.delete(schema.authTokens).where(eq(schema.authTokens.id, tokens[0].id))
  
  return c.json({ success: true })
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

app.post('/api/auth/switch-workspace', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  const { companyId } = body
  const jwtPayload = c.get('jwtPayload')
  
  if (!companyId) return c.json({ error: 'companyId is required' }, 400)

  const memberships = await db.select().from(schema.companyMemberships)
    .where(and(
      eq(schema.companyMemberships.userId, jwtPayload.id),
      eq(schema.companyMemberships.companyId, companyId),
      eq(schema.companyMemberships.status, 'ACTIVE')
    ))

  if (memberships.length === 0) {
    return c.json({ error: 'Membership not found or unauthorized' }, 403)
  }

  const secret = c.env.JWT_SECRET
  if (!secret) return c.json({ error: 'Server configuration error' }, 500)

  const token = await sign({ id: jwtPayload.id, email: jwtPayload.email, companyId: companyId, role: memberships[0].role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret)
  
  return c.json({ token, companyId })
})

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

  if (parsed.data.isActive !== undefined) {
    await requireRole(c, drizzle(c.env.DB), 'ADMIN')
  }

  const result = await db.update(schema.partners).set(parsed.data).where(and(eq(schema.partners.id, id), eq(schema.partners.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/partners/:id', async (c) => {
  await requireRole(c, drizzle(c.env.DB), 'ADMIN')
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
    
    if (data.partnerIds && data.partnerIds.length > 0) {
      const partners = await db.select().from(schema.partners).where(and(inArray(schema.partners.id, data.partnerIds), eq(schema.partners.companyId, data.companyId)))
      if (partners.length !== data.partnerIds.length) throw new Error('Algún proveedor no fue encontrado o no pertenece a la empresa.')
      if (partners.some(p => !p.isActive)) throw new Error('No se pueden incluir proveedores archivados en un paquete.')
    }

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
  
  if (parsed.data.partnerIds && parsed.data.partnerIds.length > 0) {
    const partners = await db.select().from(schema.partners).where(and(inArray(schema.partners.id, parsed.data.partnerIds), eq(schema.partners.companyId, companyId)))
    if (partners.length !== parsed.data.partnerIds.length) return c.json({ error: 'Algún proveedor no fue encontrado o no pertenece a la empresa.' }, 400)
    if (partners.some(p => !p.isActive)) return c.json({ error: 'No se pueden incluir proveedores archivados en un paquete.' }, 400)
  }

  if (parsed.data.isActive !== undefined) {
    await requireRole(c, drizzle(c.env.DB), 'ADMIN')
  }

  const result = await db.update(schema.packages).set(parsed.data).where(and(eq(schema.packages.id, id), eq(schema.packages.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/packages/:id', async (c) => {
  await requireRole(c, drizzle(c.env.DB), 'ADMIN')
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
    
    if (!data.createdAt) data.createdAt = new Date().toISOString()
    
    // We cannot validate acceptedBudgetId mapping to this event because the event doesn't exist yet, 
    // and usually budgets are created after the event. 
    // If they pass acceptedBudgetId on creation, we can still verify it belongs to the tenant.
    if (data.acceptedBudgetId) {
      await assertTenantResource(db, schema.budgets, data.acceptedBudgetId, data.companyId, 'Presupuesto')
    }

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
    const budgets = await db.select().from(schema.budgets).where(and(eq(schema.budgets.id, parsed.data.acceptedBudgetId), eq(schema.budgets.companyId, companyId)))
    if (budgets.length === 0) return c.json({ error: 'Presupuesto no encontrado.' }, 400)
    if (budgets[0].eventId !== id) return c.json({ error: 'El presupuesto no pertenece a este evento.' }, 400)
  }

  const result = await db.update(schema.events).set(parsed.data).where(and(eq(schema.events.id, id), eq(schema.events.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/events/:id', async (c) => {
  await requireRole(c, drizzle(c.env.DB), 'ADMIN')
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
    
    const events = await db.select().from(schema.events).where(and(eq(schema.events.id, data.eventId), eq(schema.events.companyId, data.companyId)))
    if (events.length === 0) throw new Error(`Evento no encontrado o no pertenece a la empresa actual.`)
    if (events[0].clientId !== data.clientId) throw new Error(`El cliente del presupuesto debe coincidir con el cliente del evento.`)
    
    await assertTenantResource(db, schema.clients, data.clientId, data.companyId, 'Cliente')
    if (data.packageId) {
      const pkgs = await db.select().from(schema.packages).where(and(eq(schema.packages.id, data.packageId), eq(schema.packages.companyId, data.companyId)))
      if (pkgs.length === 0 || !pkgs[0].isActive) throw new Error(`Paquete no encontrado, no pertenece a la empresa, o está archivado.`)
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

  // 1. Load the existing budget (tenant-scoped)
  const budgets = await db.select().from(schema.budgets).where(and(eq(schema.budgets.id, id), eq(schema.budgets.companyId, companyId)))
  if (budgets.length === 0) return c.json({ error: 'Presupuesto no encontrado' }, 404)
  const current = budgets[0]

  // 2. If a new clientId is provided, verify it belongs to this company BEFORE anything else
  if (parsed.data.clientId) {
    const clientRows = await db.select({ id: schema.clients.id }).from(schema.clients)
      .where(and(eq(schema.clients.id, parsed.data.clientId), eq(schema.clients.companyId, companyId)))
    if (clientRows.length === 0) return c.json({ error: 'Cliente no encontrado o no pertenece a la empresa actual.' }, 400)
  }

  // 3. If a new packageId is provided, verify it's active and belongs to this company
  if (parsed.data.packageId) {
    const pkgs = await db.select().from(schema.packages).where(and(eq(schema.packages.id, parsed.data.packageId), eq(schema.packages.companyId, companyId)))
    if (pkgs.length === 0 || !pkgs[0].isActive) return c.json({ error: 'Paquete no encontrado o archivado.' }, 400)
  }

  // 4. Compute final eventId and clientId after individual validations
  const finalEventId = parsed.data.eventId ?? current.eventId
  const finalClientId = parsed.data.clientId ?? current.clientId

  // 5. Verify the final event belongs to this company
  const events = await db.select().from(schema.events).where(and(eq(schema.events.id, finalEventId), eq(schema.events.companyId, companyId)))
  if (events.length === 0) return c.json({ error: 'Evento final no encontrado o no pertenece a la empresa actual.' }, 400)

  // 6. Cross-validate: the final client must match the event's client
  if (events[0].clientId !== finalClientId) {
    return c.json({ error: 'El cliente del presupuesto debe coincidir con el cliente del evento.' }, 400)
  }

  const result = await db.update(schema.budgets).set(parsed.data).where(and(eq(schema.budgets.id, id), eq(schema.budgets.companyId, companyId)))
  if (result.meta.changes === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json({ success: true })
})
app.delete('/api/budgets/:id', async (c) => {
  await requireRole(c, drizzle(c.env.DB), 'ADMIN')
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
  await requireRole(c, drizzle(c.env.DB), 'ADMIN')
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
    const jwtPayload = c.get('jwtPayload')
    const companyId = jwtPayload.companyId

    if (!file) return c.json({ error: 'No file provided' }, 400)
    
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedMimeTypes.includes(file.type)) return c.json({ error: 'Formato no permitido' }, 400)
    if (file.size > 2 * 1024 * 1024) return c.json({ error: 'El archivo excede 2MB' }, 400)
    
    const ext = file.name.split('.').pop() || 'png'
    const isPublic = formData.get('isPublic') === 'true'
    
    if (isPublic) {
      await requireRole(c, drizzle(c.env.DB), 'ADMIN')
    }

    const key = isPublic 
      ? `public/${companyId}/branding/logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      : `private/${companyId}/documents/doc-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    
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
  
  if (key.startsWith('private/')) {
    // Check tenant isolation
    const jwtPayload = c.get('jwtPayload')
    if (!key.startsWith(`private/${jwtPayload.companyId}/`)) {
      return new Response('Unauthorized', { status: 403 })
    }
  }

  const object = await c.env.ASSETS.get(key)
  if (!object) return new Response('Not Found', { status: 404 })
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, { headers })
})

export default app
