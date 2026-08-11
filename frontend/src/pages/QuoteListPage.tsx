import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../api';
import { formatMoney } from '../format';
import { InboxIcon, PlusIcon } from '../components/icons';
import type { Quote } from '../types';

const SKELETON_ROWS = 3;

export function QuoteListPage() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setQuotes(null);
    api
      .listQuotes(currentUser.id)
      .then(setQuotes)
      .catch((err) => setError(err.message));
  }, [currentUser]);

  async function handleCreate() {
    if (!currentUser) return;
    setCreating(true);
    try {
      const quote = await api.createQuote(currentUser.id, {
        customerName: 'New customer',
        sections: [],
      });
      navigate(`/quotes/${quote.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Quotes</h1>
        <button className="primary" onClick={handleCreate} disabled={creating}>
          {creating ? (
            <span className="spinner" aria-hidden="true" style={{ marginRight: '0.4rem' }} />
          ) : (
            <PlusIcon />
          )}{' '}
          {creating ? 'Creating…' : 'New quote'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {!quotes && !error && (
        <div>
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <div className="skeleton-row" key={i}>
              <div className="skeleton" style={{ height: '1rem', width: '30%' }} />
              <div className="skeleton" style={{ height: '1rem', width: '15%' }} />
              <div className="skeleton" style={{ height: '1rem', width: '15%' }} />
              <div className="skeleton" style={{ height: '1rem', width: '20%' }} />
            </div>
          ))}
        </div>
      )}

      {quotes && quotes.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon">
            <InboxIcon />
          </span>
          <span className="empty-state__title">No quotes yet</span>
          <span>{currentUser.organization.name} hasn't created any quotes.</span>
        </div>
      )}

      {quotes && quotes.length > 0 && (
        <table className="quote-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Status</th>
              <th>Sections</th>
              <th>Total</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} onClick={() => navigate(`/quotes/${q.id}`)}>
                <td>{q.customerName}</td>
                <td>
                  <span className={`status-badge status-badge--${q.status}`}>
                    {q.status}
                  </span>
                </td>
                <td>{q.sections.length}</td>
                <td className="money">{formatMoney(q.totals.total)}</td>
                <td>{new Date(q.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
