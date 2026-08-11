import { formatMoney } from '../format';
import { sectionSubtotal } from '../totals';
import type { DraftLineItem, DraftSection } from '../types';
import { LineItemRow } from './LineItemRow';
import { PlusIcon, TrashIcon } from './icons';

type SectionPatch = Partial<Pick<DraftSection, 'name' | 'markupPercent'>>;
type LineItemPatch = Partial<Pick<DraftLineItem, 'description' | 'quantity' | 'unitPrice'>>;

interface SectionCardProps {
  section: DraftSection;
  onUpdate: (patch: SectionPatch) => void;
  onRemove: () => void;
  onAddLineItem: () => void;
  onUpdateLineItem: (itemKey: string, patch: LineItemPatch) => void;
  onRemoveLineItem: (itemKey: string) => void;
}

export function SectionCard({
  section,
  onUpdate,
  onRemove,
  onAddLineItem,
  onUpdateLineItem,
  onRemoveLineItem,
}: SectionCardProps) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        <input
          className="section-name-input"
          value={section.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <label className="markup-input">
          Markup %
          <input
            type="number"
            min={0}
            step="0.01"
            value={section.markupPercent}
            onChange={(e) => onUpdate({ markupPercent: Number(e.target.value) || 0 })}
          />
        </label>
        <button className="link-button danger" onClick={onRemove}>
          <TrashIcon /> Remove section
        </button>
      </div>

      <table className="line-item-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {section.lineItems.map((item) => (
            <LineItemRow
              key={item.clientKey}
              item={item}
              onUpdate={(patch) => onUpdateLineItem(item.clientKey, patch)}
              onRemove={() => onRemoveLineItem(item.clientKey)}
            />
          ))}
        </tbody>
      </table>

      <div className="section-card__footer">
        <button className="link-button" onClick={onAddLineItem}>
          <PlusIcon /> Add line item
        </button>
        <span className="money section-subtotal">
          Section subtotal: {formatMoney(sectionSubtotal(section))}
        </span>
      </div>
    </div>
  );
}
