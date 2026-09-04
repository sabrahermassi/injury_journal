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
import { queryClient } from '@/api/query-client';
import { getSession } from '@/api/session';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthValue = {
  status: AuthStatus;
  user: api.User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<{ revoked: boolean }>;
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
      // Cached queries belong to the account that was just signed out of --
      // leaving them would let the next account render this one's data.
      queryClient.clear();
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
      } catch (error) {
        if (cancelled) {
          return;
        }

        // `request()` already tried a refresh on a 401 and only surfaces an
        // ApiError if that failed too -- a genuinely dead session. Anything
        // else (a thrown network error, offline) is connectivity, not
        // authentication: trust the stored session rather than bouncing an
        // offline user to the login screen, and let the app's own queries
        // retry once the network is back.
        if (error instanceof api.ApiError) {
          setStatus('unauthenticated');
        } else {
          setStatus('authenticated');
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
    const result = await api.logout();

    queryClient.clear();
    setUser(null);
    setStatus('unauthenticated');

    return result;
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
