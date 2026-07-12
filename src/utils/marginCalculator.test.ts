import { describe, it, expect } from 'vitest';
import { recalcBudget } from './marginCalculator';
import type { Budget, BudgetItem } from '../types';

describe('marginCalculator', () => {
  it('calculates total costs and margins correctly', () => {
    const mockItems: BudgetItem[] = [
      {
        id: '1',
        name: 'Item 1',
        category: 'Personal',
        quantity: 2,
        unitCost: 50,
        totalCost: 100, // this should be recalculated anyway
        unitPrice: 100,
        totalPrice: 200,
        isInternalCost: true,
        isVisibleToClient: true
      },
      {
        id: '2',
        name: 'Item 2',
        category: 'Partner',
        quantity: 1,
        unitCost: 150,
        totalCost: 150,
        unitPrice: 200,
        totalPrice: 200,
        isInternalCost: false,
        isVisibleToClient: true
      }
    ];

    const budget: Budget = {
      id: 'b1',
      eventId: 'e1',
      clientId: 'c1',
      packageId: null,
      items: mockItems,
      directCosts: 0,
      partnerCosts: 0,
      laborCosts: 0,
      indirectCosts: 0,
      totalCost: 0,
      targetMarginPercentage: 30, // We want 30% margin
      recommendedPriceWithoutVAT: 0,
      recommendedPriceWithVAT: 0,
      offeredPriceWithoutVAT: 500, // We offer for 500
      offeredPriceWithVAT: 0,
      vatPercentage: 21,
      expectedProfit: 0,
      expectedMarginPercentage: 0,
      status: 'draft',
      createdAt: '2026-01-01'
    };

    const result = recalcBudget(budget);

    // Total Cost = 100 (Personal) + 150 (Partner) = 250
    expect(result.totalCost).toBe(250);
    expect(result.laborCosts).toBe(100);
    expect(result.partnerCosts).toBe(150);
    
    // Target Margin 30% -> Price = Cost / (1 - 0.3) = 250 / 0.7 = 357.14
    expect(result.recommendedPriceWithoutVAT).toBeCloseTo(357.14, 2);

    // Offered Price (from items) = 200 + 200 = 400
    // Expected Profit = 400 - 250 = 150
    expect(result.expectedProfit).toBe(150);
    
    // Expected Margin = 150 / 400 = 37.5%
    expect(result.expectedMarginPercentage).toBe(37.5);
  });
});
