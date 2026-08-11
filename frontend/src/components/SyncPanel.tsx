import type { QuoteStatus, SyncStatus } from '../types';

interface SyncPanelProps {
  status: QuoteStatus;
  syncStatus: SyncStatus;
  externalId: string | null;
  syncing: boolean;
  onSync: () => void;
}

export function SyncPanel({ status, syncStatus, externalId, syncing, onSync }: SyncPanelProps) {
  const canSync = status === 'accepted' && syncStatus !== 'synced';

  return (
    <div className="sync-panel">
      <div>
        <strong>Accounting sync:</strong>{' '}
        <span className={`status-badge status-badge--sync-${syncStatus}`}>{syncStatus}</span>
        {externalId && <span className="external-id"> ({externalId})</span>}
      </div>
      <button
        className="primary"
        onClick={onSync}
        disabled={syncing || !canSync}
        title={status !== 'accepted' ? 'Only accepted quotes can be synced' : undefined}
      >
        {syncing && <span className="spinner" aria-hidden="true" style={{ marginRight: '0.4rem' }} />}
        {syncing ? 'Syncing…' : syncStatus === 'synced' ? 'Synced' : 'Sync to accounting'}
      </button>
    </div>
  );
}
