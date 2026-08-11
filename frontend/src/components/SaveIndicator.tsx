import type { SaveState } from '../hooks/useAutosave';

const LABELS: Record<SaveState, string> = {
  idle: '',
  pending: 'Unsaved changes…',
  saving: 'Saving…',
  saved: 'Saved',
  error: '',
};

export function SaveIndicator({ state, error }: { state: SaveState; error: string | null }) {
  if (state === 'error') {
    return (
      <span className="save-indicator save-indicator--error">Save failed: {error}</span>
    );
  }
  return (
    <span className={`save-indicator save-indicator--${state}`}>
      {state === 'saving' && <span className="spinner" aria-hidden="true" />}
      {LABELS[state]}
    </span>
  );
}
