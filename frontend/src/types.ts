export type QuoteStatus = 'draft' | 'sent' | 'accepted';
export type DiscountType = 'percentage' | 'fixed';
export type SyncStatus = 'none' | 'syncing' | 'synced' | 'failed';

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  organization: { id: string; name: string };
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Section {
  id: string;
  name: string;
  markupPercent: number;
  lineItems: LineItem[];
  lineItemsSubtotal: number;
  subtotal: number;
}

export interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  taxAmount: number;
  total: number;
}

export interface Quote {
  id: string;
  organizationId: string;
  customerName: string;
  status: QuoteStatus;
  discountType: DiscountType | null;
  discountValue: number;
  taxRate: number;
  syncStatus: SyncStatus;
  externalId: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  totals: QuoteTotals;
}

// Editable, unsaved-friendly shapes used while the user is typing.
// New rows don't have a server-assigned id yet.
export interface DraftLineItem {
  id?: string;
  clientKey: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface DraftSection {
  id?: string;
  clientKey: string;
  name: string;
  markupPercent: number;
  lineItems: DraftLineItem[];
}

export interface DraftQuote {
  customerName: string;
  status: QuoteStatus;
  discountType: DiscountType | null;
  discountValue: number;
  taxRate: number;
  sections: DraftSection[];
}

// What actually goes over the wire on create/update — no clientKey.
export interface LineItemPayload {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface SectionPayload {
  id?: string;
  name: string;
  markupPercent: number;
  lineItems: LineItemPayload[];
}

export interface QuotePayload {
  customerName?: string;
  status?: QuoteStatus;
  discountType?: DiscountType | null;
  discountValue?: number;
  taxRate?: number;
  sections?: SectionPayload[];
}
