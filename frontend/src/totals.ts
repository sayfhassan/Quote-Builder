import type { DraftQuote, DraftSection, QuoteTotals } from './types';

/**
 * Mirrors backend/src/quotes/totals.ts exactly, so what the user sees while
 * typing matches what the server will compute and persist. Duplicated
 * rather than shared because the frontend and backend are separate npm
 * packages in this take-home; a real project would hoist this into a
 * shared package.
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineItemTotal(quantity: number, unitPrice: number): number {
  return (quantity || 0) * (unitPrice || 0);
}

export function sectionLineItemsSubtotal(section: DraftSection): number {
  return section.lineItems.reduce(
    (sum, item) => sum + lineItemTotal(item.quantity, item.unitPrice),
    0,
  );
}

export function sectionSubtotal(section: DraftSection): number {
  const lineItemsSubtotal = sectionLineItemsSubtotal(section);
  return lineItemsSubtotal * (1 + (section.markupPercent || 0) / 100);
}

export function computeDraftTotals(quote: DraftQuote): QuoteTotals {
  const sectionSubtotals = quote.sections.map(sectionSubtotal);
  const subtotal = sectionSubtotals.reduce((sum, s) => sum + s, 0);

  let discountAmount = 0;
  if (quote.discountType && quote.discountValue) {
    discountAmount =
      quote.discountType === 'percentage'
        ? subtotal * (quote.discountValue / 100)
        : quote.discountValue;
  }
  discountAmount = Math.min(Math.max(discountAmount, 0), subtotal);

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * ((quote.taxRate || 0) / 100);
  const total = afterDiscount + taxAmount;

  return {
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    afterDiscount: round2(afterDiscount),
    taxAmount: round2(taxAmount),
    total: round2(total),
  };
}
