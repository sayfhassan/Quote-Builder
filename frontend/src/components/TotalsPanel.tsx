import { formatMoney } from '../format';
import type { QuoteTotals } from '../types';

export function TotalsPanel({ totals, taxRate }: { totals: QuoteTotals; taxRate: number }) {
  return (
    <div className="totals-panel">
      <div className="totals-panel__row">
        <span>Subtotal</span>
        <span className="money">{formatMoney(totals.subtotal)}</span>
      </div>
      <div className="totals-panel__row">
        <span>Discount</span>
        <span className="money">-{formatMoney(totals.discountAmount)}</span>
      </div>
      <div className="totals-panel__row">
        <span>Tax ({taxRate || 0}%)</span>
        <span className="money">{formatMoney(totals.taxAmount)}</span>
      </div>
      <div className="totals-panel__row totals-panel__row--total">
        <span>Total</span>
        <span className="money">{formatMoney(totals.total)}</span>
      </div>
    </div>
  );
}
