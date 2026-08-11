import { DiscountType } from './entities/quote.entity';

export interface LineItemLike {
  quantity: number;
  unitPrice: number;
}

export interface SectionLike {
  markupPercent: number | null | undefined;
  lineItems: LineItemLike[];
}

export interface QuoteTotalsInput {
  sections: SectionLike[];
  discountType?: DiscountType | null;
  discountValue?: number | null;
  taxRate?: number | null;
}

export interface LineItemTotal {
  total: number;
}

export interface SectionTotal {
  lineItemsSubtotal: number;
  subtotal: number; // after markup
}

export interface QuoteTotals {
  sections: SectionTotal[];
  subtotal: number; // sum of section subtotals, before discount/tax
  discountAmount: number;
  afterDiscount: number;
  taxAmount: number;
  total: number;
}

/** Round to cents. Money is stored as floats for this take-home; rounding only happens at output boundaries so intermediate math stays precise. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineItemTotal(item: LineItemLike): number {
  return item.quantity * item.unitPrice;
}

export function sectionSubtotal(section: SectionLike): SectionTotal {
  const lineItemsSubtotal = section.lineItems.reduce(
    (sum, item) => sum + lineItemTotal(item),
    0,
  );
  const markup = section.markupPercent ?? 0;
  const subtotal = lineItemsSubtotal * (1 + markup / 100);
  return {
    lineItemsSubtotal: round2(lineItemsSubtotal),
    subtotal: round2(subtotal),
  };
}

/**
 * Discount and tax are applied to the un-rounded subtotal, then the final
 * total is rounded once. Section subtotals are still reported rounded to
 * cents for display since the UI shows them independently.
 */
export function computeQuoteTotals(input: QuoteTotalsInput): QuoteTotals {
  const sectionTotals = input.sections.map((section) => {
    const lineItemsSubtotal = section.lineItems.reduce(
      (sum, item) => sum + lineItemTotal(item),
      0,
    );
    const markup = section.markupPercent ?? 0;
    const subtotal = lineItemsSubtotal * (1 + markup / 100);
    return { lineItemsSubtotal, subtotal };
  });

  const subtotal = sectionTotals.reduce((sum, s) => sum + s.subtotal, 0);

  let discountAmount = 0;
  if (input.discountType && input.discountValue) {
    discountAmount =
      input.discountType === DiscountType.PERCENTAGE
        ? subtotal * (input.discountValue / 100)
        : input.discountValue;
  }
  discountAmount = Math.min(Math.max(discountAmount, 0), subtotal);

  const afterDiscount = subtotal - discountAmount;
  const taxRate = input.taxRate ?? 0;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  return {
    sections: sectionTotals.map((s) => ({
      lineItemsSubtotal: round2(s.lineItemsSubtotal),
      subtotal: round2(s.subtotal),
    })),
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    afterDiscount: round2(afterDiscount),
    taxAmount: round2(taxAmount),
    total: round2(total),
  };
}
