import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  fiscalName: z.string().optional(),
  nif: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  lightLogoUrl: z.string().optional(),
  darkLogoUrl: z.string().optional()
});

export const clientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  company: z.string(),
  notes: z.string().optional(),
  createdAt: z.string().optional()
});

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string(),
  pricingType: z.string(),
  hourlyRate: z.number().min(0),
  fixedRate: z.number().min(0),
  notes: z.string().optional(),
  phone: z.string(),
  email: z.string().email().or(z.literal('')),
  createdAt: z.string().optional()
});

export const packageSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  baseHours: z.number().min(0),
  baseCost: z.number().min(0),
  recommendedPrice: z.number().min(0),
  partnerIds: z.array(z.string()),
  customItems: z.array(z.any()),
  marginTarget: z.number(),
  createdAt: z.string().optional()
});

export const eventSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string().min(1),
  date: z.string(),
  location: z.string(),
  type: z.string(),
  attendees: z.number().min(1),
  durationHours: z.number().min(0),
  status: z.string(),
  acceptedBudgetId: z.string().nullable().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional()
});

export const budgetSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  clientId: z.string(),
  packageId: z.string().nullable().optional(),
  items: z.array(z.any()),
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
  status: z.string(),
  createdAt: z.string().optional()
});

export const paymentSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  status: z.string(),
  concept: z.string()
});

export const postEventResultSchema = z.object({
  eventId: z.string(),
  chargedPrice: z.number(),
  realCostLines: z.array(z.any()),
  realTotalCost: z.number(),
  notes: z.string().optional()
});

// Update schemas: partial, omit id, require at least one field
const createUpdateSchema = (schema: z.ZodObject<any, any>) => 
  schema.omit({ id: true })
    .partial()
    .refine(data => Object.keys(data).length > 0, "Al menos un campo debe ser modificado");

export const companyUpdateSchema = companySchema
  .omit({ id: true })
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
