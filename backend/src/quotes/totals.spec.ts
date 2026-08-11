import { computeQuoteTotals } from './totals';
import { DiscountType } from './entities/quote.entity';

describe('computeQuoteTotals', () => {
  it('matches the worked example from the spec: $297.00 total, no discount', () => {
    const totals = computeQuoteTotals({
      sections: [
        {
          markupPercent: 10,
          lineItems: [
            { quantity: 2, unitPrice: 100 },
            { quantity: 1, unitPrice: 50 },
          ],
        },
      ],
      taxRate: 8,
    });

    expect(totals.sections[0].lineItemsSubtotal).toBe(250);
    expect(totals.sections[0].subtotal).toBe(275);
    expect(totals.subtotal).toBe(275);
    expect(totals.taxAmount).toBe(22);
    expect(totals.total).toBe(297);
  });

  it('sums multiple sections, each with their own markup', () => {
    const totals = computeQuoteTotals({
      sections: [
        { markupPercent: 0, lineItems: [{ quantity: 1, unitPrice: 100 }] },
        { markupPercent: 20, lineItems: [{ quantity: 1, unitPrice: 100 }] },
      ],
      taxRate: 0,
    });

    expect(totals.sections[0].subtotal).toBe(100);
    expect(totals.sections[1].subtotal).toBe(120);
    expect(totals.subtotal).toBe(220);
    expect(totals.total).toBe(220);
  });

  it('applies a percentage discount before tax', () => {
    const totals = computeQuoteTotals({
      sections: [{ markupPercent: 0, lineItems: [{ quantity: 1, unitPrice: 1000 }] }],
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      taxRate: 10,
    });

    expect(totals.subtotal).toBe(1000);
    expect(totals.discountAmount).toBe(100);
    expect(totals.afterDiscount).toBe(900);
    expect(totals.taxAmount).toBe(90);
    expect(totals.total).toBe(990);
  });

  it('applies a fixed discount before tax', () => {
    const totals = computeQuoteTotals({
      sections: [{ markupPercent: 0, lineItems: [{ quantity: 1, unitPrice: 500 }] }],
      discountType: DiscountType.FIXED,
      discountValue: 50,
      taxRate: 10,
    });

    expect(totals.afterDiscount).toBe(450);
    expect(totals.total).toBe(495);
  });

  it('clamps a fixed discount so it cannot exceed the subtotal or go negative', () => {
    const totals = computeQuoteTotals({
      sections: [{ markupPercent: 0, lineItems: [{ quantity: 1, unitPrice: 50 }] }],
      discountType: DiscountType.FIXED,
      discountValue: 500,
      taxRate: 0,
    });

    expect(totals.discountAmount).toBe(50);
    expect(totals.afterDiscount).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('treats an empty quote as all zeros', () => {
    const totals = computeQuoteTotals({ sections: [] });
    expect(totals.total).toBe(0);
  });
});
