import { formatMoney } from '../format';
import { lineItemTotal } from '../totals';
import type { DraftLineItem } from '../types';
import { TrashIcon } from './icons';

type LineItemPatch = Partial<Pick<DraftLineItem, 'description' | 'quantity' | 'unitPrice'>>;

interface LineItemRowProps {
  item: DraftLineItem;
  onUpdate: (patch: LineItemPatch) => void;
  onRemove: () => void;
}

export function LineItemRow({ item, onUpdate, onRemove }: LineItemRowProps) {
  return (
    <tr>
      <td>
        <input
          value={item.description}
          placeholder="Description"
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          step="any"
          className="qty-input"
          value={item.quantity}
          onChange={(e) => onUpdate({ quantity: Number(e.target.value) || 0 })}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          step="0.01"
          className="price-input"
          value={item.unitPrice}
          onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) || 0 })}
        />
      </td>
      <td className="money">{formatMoney(lineItemTotal(item.quantity, item.unitPrice))}</td>
      <td>
        <button
          className="icon-button"
          onClick={onRemove}
          aria-label="Remove line item"
          title="Remove line item"
        >
          <TrashIcon size={14} />
        </button>
      </td>
    </tr>
  );
}
