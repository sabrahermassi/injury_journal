"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getInjuries, type Injury } from "@/services/api";

type InjuriesContextValue = {
  injuries: Injury[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const InjuriesContext = createContext<InjuriesContextValue | null>(null);

/**
 * Owns the injury list for the whole dashboard shell.
 *
 * The header (which creates injuries) and the injuries page (which lists them)
 * are siblings under `app/dashboard/layout.tsx`, so neither can hand the other
 * a refresh callback. Both read this instead, which also means the list is
 * fetched once per shell rather than once per page.
 */
export function InjuriesProvider({ children }: { children: React.ReactNode }) {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracks which request is the latest one issued, across both the initial
  // load and refresh(). If the initial load's GET resolves after a later
  // refresh() (plausible: two independent requests racing, initial load
  // fired first but not guaranteed to resolve first), it must not overwrite
  // refresh()'s newer result — e.g. a just-created injury disappearing until
  // the next reload. Whichever request's id no longer matches when it
  // resolves is stale and skips applying its result.
  const requestIdRef = useRef(0);

  // Manual re-fetch, for event handlers (creating an injury, hitting Retry).
  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await getInjuries();
      if (requestId === requestIdRef.current) {
        setInjuries(data);
      }
    } catch (error) {
      console.error(error);
      if (requestId === requestIdRef.current) {
        setError("Failed to load injuries");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // The first load is deliberately not `refresh()`: that would setState
  // synchronously in the effect body. `loading` already starts true, so there
  // is nothing to set until the request resolves.
  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    async function load() {
      try {
        const data = await getInjuries();

        if (!cancelled && requestId === requestIdRef.current) {
          setInjuries(data);
        }
      } catch (error) {
        if (!cancelled && requestId === requestIdRef.current) {
          console.error(error);
          setError("Failed to load injuries");
        }
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InjuriesContext.Provider value={{ injuries, loading, error, refresh }}>
      {children}
    </InjuriesContext.Provider>
  );
}

export function useInjuries() {
  const context = useContext(InjuriesContext);

  if (!context) {
    throw new Error("useInjuries must be used inside an InjuriesProvider");
  }

  return context;
}
