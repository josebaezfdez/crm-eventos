import { describe, it, expect } from 'vitest';
import { eventSchema, companySchema, budgetStatusEnum } from '../src/validators';

describe('Validators', () => {
  it('eventSchema rejects invalid status or type', () => {
    const invalidEvent = {
      id: '1',
      clientId: 'c1',
      name: 'Test',
      date: '2026-01-01',
      location: 'Here',
      type: 'InvalidType', // Should be Boda, Empresa, etc.
      attendees: 100,
      durationHours: 5,
      status: 'invalidStatus', // Should be draft, quoted, etc.
      acceptedBudgetId: null,
      notes: '',
      createdAt: '2026-01-01'
    };

    const result = eventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
  });

  it('eventSchema accepts valid data', () => {
    const validEvent = {
      id: '1',
      clientId: 'c1',
      name: 'Test',
      date: '2026-01-01',
      location: 'Here',
      type: 'Empresa',
      attendees: 100,
      durationHours: 5,
      status: 'draft',
      acceptedBudgetId: null,
      notes: '',
      createdAt: '2026-01-01'
    };

    const result = eventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('companySchema uses taxId and strictly rejects unknown fields', () => {
    const invalidCompany = {
      id: '1',
      name: 'Company S.L.',
      taxId: 'B12345678',
      unknownField: 'test' // Should be rejected by .strict()
    };

    const result = companySchema.safeParse(invalidCompany);
    expect(result.success).toBe(false);
  });
  
  it('companySchema accepts valid data', () => {
    const validCompany = {
      id: '1',
      name: 'Company S.L.',
      taxId: 'B12345678',
    };

    const result = companySchema.safeParse(validCompany);
    expect(result.success).toBe(true);
  });
});
