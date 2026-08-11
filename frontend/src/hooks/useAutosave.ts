import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/**
 * Calls `onSave(value)` `delayMs` after `value` last changed. Skips the
 * change that's currently in flight when the caller invokes the returned
 * `skipNextChange()` — use that right after loading fresh data so the load
 * itself isn't treated as an edit that needs saving.
 */
export function useAutosave<T>(value: T | null, onSave: (value: T) => Promise<void>, delayMs = 700) {
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextRef = useRef(true);

  useEffect(() => {
    if (value === null) return;
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    setState('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setState('saving');
      try {
        await onSave(value);
        setState('saved');
        setError(null);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Deliberately keyed on `value` only: re-running this because `onSave`'s
    // identity changed would restart the debounce window on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  const skipNextChange = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    skipNextRef.current = true;
    setState('idle');
    setError(null);
  }, []);

  return { state, error, skipNextChange };
}
