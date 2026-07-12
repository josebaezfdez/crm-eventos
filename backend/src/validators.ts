import { z } from 'zod';

// Enums
export const eventTypeEnum = z.enum(['Boda', 'Cumpleaños', 'Empresa', 'Afterwork', 'Fiesta privada', 'Otro']);
export const eventStatusEnum = z.enum(['draft', 'quoted', 'accepted', 'rejected', 'completed']);
export const budgetStatusEnum = z.enum(['draft', 'sent', 'accepted', 'rejected']);
export const paymentStatusEnum = z.enum(['pending', 'paid']);
export const partnerCategoryEnum = z.enum(['DJ', 'Fotógrafo', 'Músico', 'Fotomatón', 'Camarero', 'Técnico sonido', 'Decoración', 'Otro']);
export const partnerPricingTypeEnum = z.enum(['hourly', 'fixed']);
export const budgetItemCategoryEnum = z.enum(['Bebida', 'Comida', 'Hielo', 'Vasos', 'Personal', 'Transporte', 'Alquiler', 'Partner', 'Decoración', 'Otros']);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
}).strict();

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(1)
}).strict();

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  lightLogoUrl: z.string().optional(),
  darkLogoUrl: z.string().optional(),
  createdAt: z.string().optional()
}).strict();

export const clientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  company: z.string(),
  notes: z.string().optional(),
  createdAt: z.string().optional()
}).strict();

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: partnerCategoryEnum,
  pricingType: partnerPricingTypeEnum,
  hourlyRate: z.number().min(0),
  fixedRate: z.number().min(0),
  notes: z.string().optional(),
  phone: z.string(),
  email: z.string().email().or(z.literal('')),
  createdAt: z.string().optional()
}).strict();

export const packageItemSchema = z.object({
  name: z.string(),
  category: budgetItemCategoryEnum,
  quantity: z.number(),
  unitCost: z.number(),
  unitPrice: z.number(),
  isVisibleToClient: z.boolean()
}).strict();

export const packageSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  baseHours: z.number().min(0),
  baseCost: z.number().min(0),
  recommendedPrice: z.number().min(0),
  partnerIds: z.array(z.string()),
  customItems: z.array(packageItemSchema),
  marginTarget: z.number(),
  createdAt: z.string().optional()
}).strict();

export const eventSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string().min(1),
  date: z.string(),
  location: z.string(),
  type: eventTypeEnum,
  attendees: z.number().min(1),
  durationHours: z.number().min(0),
  status: eventStatusEnum,
  acceptedBudgetId: z.string().nullable().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional()
}).strict();

export const budgetItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: budgetItemCategoryEnum,
  quantity: z.number(),
  unitCost: z.number(),
  totalCost: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  isInternalCost: z.boolean(),
  isVisibleToClient: z.boolean()
}).strict();

export const budgetSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  clientId: z.string(),
  packageId: z.string().nullable().optional(),
  items: z.array(budgetItemSchema),
  directCosts: z.number(),
  partnerCosts: z.number(),
  laborCosts: z.number(),
  indirectCosts: z.number(),
  totalCost: z.number(),
  targetMarginPercentage: z.number(),
  recommendedPriceWithoutVAT: z.number(),
  recommendedPriceWithVAT: z.number(),
  offeredPriceWithoutVAT: z.number(),
  offeredPriceWithVAT: z.number(),
  vatPercentage: z.number(),
  expectedProfit: z.number(),
  expectedMarginPercentage: z.number(),
  status: budgetStatusEnum,
  createdAt: z.string().optional()
}).strict();

export const paymentSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  status: paymentStatusEnum,
  concept: z.string()
}).strict();

export const realCostLineSchema = z.object({
  category: budgetItemCategoryEnum,
  budgeted: z.number(),
  real: z.number()
}).strict();

export const postEventResultSchema = z.object({
  eventId: z.string(),
  chargedPrice: z.number(),
  realCostLines: z.array(realCostLineSchema),
  realTotalCost: z.number(),
  notes: z.string().optional(),
  savedAt: z.string().optional()
}).strict();

// Update schemas: partial, omit id and createdAt, require at least one field
const createUpdateSchema = (schema: z.ZodObject<any, any>) => 
  schema.omit({ id: true, createdAt: true })
    .partial()
    .refine(data => Object.keys(data).length > 0, "Al menos un campo debe ser modificado");

export const companyUpdateSchema = companySchema
  .omit({ id: true, createdAt: true })
  .partial()
  .refine(data => Object.keys(data).length > 0, "Al menos un campo debe ser modificado");

export const clientUpdateSchema = createUpdateSchema(clientSchema);
export const partnerUpdateSchema = createUpdateSchema(partnerSchema);
export const packageUpdateSchema = createUpdateSchema(packageSchema);
export const eventUpdateSchema = createUpdateSchema(eventSchema);
export const budgetUpdateSchema = createUpdateSchema(budgetSchema);
export const paymentUpdateSchema = createUpdateSchema(paymentSchema);
export const postEventResultUpdateSchema = postEventResultSchema
  .omit({ eventId: true })
  .partial()
  .refine(data => Object.keys(data).length > 0, "Al menos un campo debe ser modificado");
