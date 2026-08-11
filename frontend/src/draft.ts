import type { DraftLineItem, DraftQuote, DraftSection, Quote, QuotePayload } from './types';

export function newClientKey(): string {
  return crypto.randomUUID();
}

export function emptyLineItem(): DraftLineItem {
  return { clientKey: newClientKey(), description: '', quantity: 1, unitPrice: 0 };
}

export function emptySection(): DraftSection {
  return { clientKey: newClientKey(), name: 'New section', markupPercent: 0, lineItems: [] };
}

/** Server response -> editable draft, tagging every row with a stable React key. */
export function quoteToDraft(quote: Quote): DraftQuote {
  return {
    customerName: quote.customerName,
    status: quote.status,
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    taxRate: quote.taxRate,
    sections: quote.sections.map((s) => ({
      id: s.id,
      clientKey: s.id,
      name: s.name,
      markupPercent: s.markupPercent,
      lineItems: s.lineItems.map((li) => ({
        id: li.id,
        clientKey: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      })),
    })),
  };
}

/** Editable draft -> wire payload. Strips clientKey, which the server never sees. */
export function draftToDto(draft: DraftQuote): QuotePayload {
  return {
    customerName: draft.customerName,
    status: draft.status,
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    taxRate: draft.taxRate,
    sections: draft.sections.map((s) => ({
      id: s.id,
      name: s.name,
      markupPercent: s.markupPercent,
      lineItems: s.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      })),
    })),
  };
}
