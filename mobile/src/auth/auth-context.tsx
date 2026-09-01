import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as api from '@/api/client';
import { getSession } from '@/api/session';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthValue = {
  status: AuthStatus;
  user: api.User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<api.User | null>(null);

  // A refresh can fail at any point -- deep inside a list query, minutes after
  // launch -- and there is no navigation context down there. The client calls
  // this instead, and the route guard reacts to `status`.
  useEffect(() => {
    api.setSignedOutHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });

    return () => api.setSignedOutHandler(null);
  }, []);

  // Cold start: decide whether the stored session is still real before showing
  // anything. GET /auth/me is the only honest way to answer that -- the app
  // cannot verify the JWT's signature itself, and reading its expiry claim
  // would say nothing about whether the account still exists or the session
  // was revoked from another device.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await getSession();

      if (!session) {
        if (!cancelled) {
          setStatus('unauthenticated');
        }

        return;
      }

      try {
        const currentUser = await api.getCurrentUser();

        if (!cancelled) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch {
        // The client already tried to refresh and cleared the session if the
        // server rejected it. Anything still failing here is unusable.
        if (!cancelled) {
          setStatus('unauthenticated');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await api.login(email, password));
    setStatus('authenticated');
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    // Register signs you in now, so there is no second round trip here.
    setUser(await api.register(email, password));
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return value;
}
