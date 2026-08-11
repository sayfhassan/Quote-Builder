import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api';
import type { DirectoryUser } from '../types';

const STORAGE_KEY = 'quote-builder:userId';

interface UserContextValue {
  users: DirectoryUser[];
  currentUser: DirectoryUser | null;
  loading: boolean;
  error: string | null;
  setCurrentUserId: (id: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listUsers()
      .then((list) => {
        setUsers(list);
        setError(null);
        const stillValid = list.some((u) => u.id === currentUserId);
        if (!stillValid && list.length > 0) {
          setCurrentUserId(list[0].id);
        }
      })
      .catch(() =>
        setError(
          'Could not reach the API. Is the backend running on ' +
            (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') +
            '?',
        ),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCurrentUserId(id: string) {
    setCurrentUserIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  const currentUser = users.find((u) => u.id === currentUserId) ?? null;

  return (
    <UserContext.Provider
      value={{ users, currentUser, loading, error, setCurrentUserId }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
