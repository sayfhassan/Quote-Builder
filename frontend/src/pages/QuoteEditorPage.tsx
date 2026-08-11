import { useCallback, useEffect, useReducer, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api, ApiError } from '../api';
import { computeDraftTotals } from '../totals';
import { draftToDto, quoteToDraft } from '../draft';
import { draftReducer } from '../draftReducer';
import { useAutosave } from '../hooks/useAutosave';
import { SaveIndicator } from '../components/SaveIndicator';
import { QuoteMetaForm } from '../components/QuoteMetaForm';
import { SectionCard } from '../components/SectionCard';
import { TotalsPanel } from '../components/TotalsPanel';
import { SyncPanel } from '../components/SyncPanel';
import { PlusIcon } from '../components/icons';
import type { Quote } from '../types';

export function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useUser();

  const [draft, dispatch] = useReducer(draftReducer, null);
  const [meta, setMeta] = useState<Quote | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const save = useCallback(
    async (toSave: NonNullable<typeof draft>) => {
      if (!currentUser || !id) return;
      const updated = await api.updateQuote(currentUser.id, id, draftToDto(toSave));
      setMeta(updated);
      dispatch({ type: 'mergeServerIds', quote: updated });
    },
    [currentUser, id],
  );

  const { state: saveState, error: saveError, skipNextChange } = useAutosave(draft, save);

  useEffect(() => {
    if (!currentUser || !id) return;
    // Guards against a stale response acting after a newer request has
    // superseded it — including React StrictMode's dev-only double-invoke
    // of this effect, which fires two overlapping requests for the same
    // quote. Without this, whichever response lands second calls
    // dispatch('load') with a fresh object reference *after*
    // skipNextChange()'s one-shot guard has already been consumed by the
    // first, so the autosave effect mistakes it for a real edit and
    // schedules a pointless save of unchanged data.
    let ignore = false;
    dispatch({ type: 'clear' });
    skipNextChange();
    setLoadError(null);
    api
      .getQuote(currentUser.id, id)
      .then((quote) => {
        if (ignore) return;
        setMeta(quote);
        dispatch({ type: 'load', draft: quoteToDraft(quote) });
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? 'This quote does not exist, or does not belong to your organization.'
            : err.message,
        );
      });
    return () => {
      ignore = true;
    };
  }, [currentUser, id, skipNextChange]);

  async function handleSync() {
    if (!currentUser || !id) return;
    setSyncing(true);
    try {
      const updated = await api.syncQuote(currentUser.id, id);
      setMeta(updated);
    } catch {
      // The sync panel's own badge reflects failure via meta.syncStatus;
      // no separate error surface needed here.
    } finally {
      setSyncing(false);
    }
  }

  if (!currentUser) return null;

  if (loadError) {
    return (
      <div className="page">
        <p className="error">{loadError}</p>
        <Link to="/">&larr; Back to quotes</Link>
      </div>
    );
  }

  if (!draft || !meta) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: '2rem', width: '18rem', marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: '4.5rem', marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: '9rem', marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: '9rem' }} />
      </div>
    );
  }

  const totals = computeDraftTotals(draft);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link to="/" className="back-link">
            &larr; Quotes
          </Link>
          <h1>
            <input
              className="customer-name-input"
              value={draft.customerName}
              onChange={(e) =>
                dispatch({ type: 'setFields', patch: { customerName: e.target.value } })
              }
              placeholder="Customer name"
            />
          </h1>
        </div>
        <SaveIndicator state={saveState} error={saveError} />
      </div>

      <QuoteMetaForm draft={draft} onChange={(patch) => dispatch({ type: 'setFields', patch })} />

      <div className="sections">
        {draft.sections.map((section) => (
          <SectionCard
            key={section.clientKey}
            section={section}
            onUpdate={(patch) =>
              dispatch({ type: 'updateSection', sectionKey: section.clientKey, patch })
            }
            onRemove={() => dispatch({ type: 'removeSection', sectionKey: section.clientKey })}
            onAddLineItem={() =>
              dispatch({ type: 'addLineItem', sectionKey: section.clientKey })
            }
            onUpdateLineItem={(itemKey, patch) =>
              dispatch({ type: 'updateLineItem', sectionKey: section.clientKey, itemKey, patch })
            }
            onRemoveLineItem={(itemKey) =>
              dispatch({ type: 'removeLineItem', sectionKey: section.clientKey, itemKey })
            }
          />
        ))}

        <button className="add-section-button" onClick={() => dispatch({ type: 'addSection' })}>
          <PlusIcon /> Add section
        </button>
      </div>

      <TotalsPanel totals={totals} taxRate={draft.taxRate} />

      <SyncPanel
        status={draft.status}
        syncStatus={meta.syncStatus}
        externalId={meta.externalId}
        syncing={syncing}
        onSync={handleSync}
      />
    </div>
  );
}
