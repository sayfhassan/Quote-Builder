import type { DiscountType, DraftQuote, QuoteStatus } from '../types';

type MetaFields = Pick<DraftQuote, 'status' | 'discountType' | 'discountValue' | 'taxRate'>;

interface QuoteMetaFormProps {
  draft: MetaFields;
  onChange: (patch: Partial<MetaFields>) => void;
}

export function QuoteMetaForm({ draft, onChange }: QuoteMetaFormProps) {
  return (
    <div className="quote-meta">
      <label>
        Status
        <select
          value={draft.status}
          onChange={(e) => onChange({ status: e.target.value as QuoteStatus })}
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
        </select>
      </label>

      <label>
        Discount type
        <select
          value={draft.discountType ?? ''}
          onChange={(e) =>
            onChange({ discountType: (e.target.value || null) as DiscountType | null })
          }
        >
          <option value="">None</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>
      </label>

      {draft.discountType && (
        <label>
          Discount value {draft.discountType === 'percentage' ? '(%)' : '($)'}
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.discountValue}
            onChange={(e) => onChange({ discountValue: Number(e.target.value) || 0 })}
          />
        </label>
      )}

      <label>
        Tax rate (%)
        <input
          type="number"
          min={0}
          step="0.01"
          value={draft.taxRate}
          onChange={(e) => onChange({ taxRate: Number(e.target.value) || 0 })}
        />
      </label>
    </div>
  );
}
