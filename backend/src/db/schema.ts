import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  taxId: text('tax_id'),
  address: text('address'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  logoUrl: text('logo_url'),
  lightLogoUrl: text('light_logo_url'),
  darkLogoUrl: text('dark_logo_url'),
  createdAt: text('created_at').notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  name: text('name').notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull(),
});

export const authTokens = sqliteTable('auth_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  type: text('type').notNull(), // 'VERIFICATION' | 'RECOVERY'
  expiresAt: integer('expires_at').notNull(), // timestamp
  createdAt: text('created_at').notNull(),
});

export const companyMemberships = sqliteTable('company_memberships', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  companyId: text('company_id').notNull(),
  role: text('role').notNull(), // 'ADMIN' | 'MEMBER'
  status: text('status').notNull(), // 'ACTIVE' | 'PENDING'
  invitedBy: text('invited_by'),
  invitedAt: text('invited_at'),
  acceptedAt: text('accepted_at'),
  createdAt: text('created_at').notNull(),
}, (table) => {
  return {
    userCompanyUnique: uniqueIndex('company_memberships_user_company_unique').on(table.userId, table.companyId),
    userStatusIdx: index('company_memberships_user_status_idx').on(table.userId, table.status),
    companyStatusIdx: index('company_memberships_company_status_idx').on(table.companyId, table.status)
  }
});

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  companyId: text('company_id').default('c_default').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  company: text('company').notNull(),
  notes: text('notes').notNull(),
  createdAt: text('created_at').notNull(),
});

export const partners = sqliteTable('partners', {
  id: text('id').primaryKey(),
  companyId: text('company_id').default('c_default').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  pricingType: text('pricing_type').notNull(),
  hourlyRate: real('hourly_rate').notNull(),
  fixedRate: real('fixed_rate').notNull(),
  notes: text('notes').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull(),
});

export const packages = sqliteTable('packages', {
  id: text('id').primaryKey(),
  companyId: text('company_id').default('c_default').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  baseHours: integer('base_hours').notNull(),
  baseCost: real('base_cost').notNull(),
  recommendedPrice: real('recommended_price').notNull(),
  partnerIds: text('partner_ids', { mode: 'json' }).notNull(),
  customItems: text('custom_items', { mode: 'json' }).notNull(),
  marginTarget: real('margin_target').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull(),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  companyId: text('company_id').default('c_default').notNull(),
  clientId: text('client_id').notNull(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  location: text('location').notNull(),
  type: text('type').notNull(),
  attendees: integer('attendees').notNull(),
  durationHours: real('duration_hours').notNull(),
  status: text('status').notNull(),
  acceptedBudgetId: text('accepted_budget_id'),
  notes: text('notes').notNull(),
  createdAt: text('created_at').notNull(),
});

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  companyId: text('company_id').default('c_default').notNull(),
  eventId: text('event_id').notNull(),
  clientId: text('client_id').notNull(),
  packageId: text('package_id'),
  items: text('items', { mode: 'json' }).notNull(),
  directCosts: real('direct_costs').notNull(),
  partnerCosts: real('partner_costs').notNull(),
  laborCosts: real('labor_costs').notNull(),
  indirectCosts: real('indirect_costs').notNull(),
  totalCost: real('total_cost').notNull(),
  targetMarginPercentage: real('target_margin_percentage').notNull(),
  recommendedPriceWithoutVAT: real('recommended_price_without_vat').notNull(),
  recommendedPriceWithVAT: real('recommended_price_with_vat').notNull(),
  offeredPriceWithoutVAT: real('offered_price_without_vat').notNull(),
  offeredPriceWithVAT: real('offered_price_with_vat').notNull(),
  vatPercentage: real('vat_percentage').notNull(),
  expectedProfit: real('expected_profit').notNull(),
  expectedMarginPercentage: real('expected_margin_percentage').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').default('c_default').notNull(),
  eventId: text('event_id').notNull(),
  amount: real('amount').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull(),
  concept: text('concept').notNull(),
});

export const postEventResults = sqliteTable('post_event_results', {
  eventId: text('event_id').primaryKey(),
  companyId: text('company_id').default('c_default').notNull(),
  chargedPrice: real('charged_price').notNull(),
  realCostLines: text('real_cost_lines', { mode: 'json' }).notNull(),
  realTotalCost: real('real_total_cost').notNull(),
  notes: text('notes').notNull(),
  savedAt: text('saved_at').notNull(),
});
