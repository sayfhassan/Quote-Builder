import { Quote } from './entities/quote.entity';
import { computeQuoteTotals, lineItemTotal } from './totals';

export function toQuoteResponse(quote: Quote) {
  const totals = computeQuoteTotals({
    sections: quote.sections ?? [],
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    taxRate: quote.taxRate,
  });

  const sections = (quote.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((section, index) => ({
      id: section.id,
      name: section.name,
      markupPercent: section.markupPercent ?? 0,
      lineItems: section.lineItems
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: lineItemTotal(item),
        })),
      lineItemsSubtotal: totals.sections[index]?.lineItemsSubtotal ?? 0,
      subtotal: totals.sections[index]?.subtotal ?? 0,
    }));

  return {
    id: quote.id,
    organizationId: quote.organizationId,
    customerName: quote.customerName,
    status: quote.status,
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    taxRate: quote.taxRate,
    syncStatus: quote.syncStatus,
    externalId: quote.externalId,
    syncedAt: quote.syncedAt,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    sections,
    totals: {
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      afterDiscount: totals.afterDiscount,
      taxAmount: totals.taxAmount,
      total: totals.total,
    },
  };
}

export type QuoteResponse = ReturnType<typeof toQuoteResponse>;
