import { z } from 'zod';

export const clientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  company: z.string(),
  notes: z.string().optional()
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
  email: z.string().email().or(z.literal(''))
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
  marginTarget: z.number()
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
  notes: z.string().optional()
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
  status: z.string()
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
