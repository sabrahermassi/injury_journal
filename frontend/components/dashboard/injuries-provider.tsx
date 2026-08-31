"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  // Manual re-fetch, for event handlers (creating an injury, hitting Retry).
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setInjuries(await getInjuries());
    } catch (error) {
      console.error(error);
      setError("Failed to load injuries");
    } finally {
      setLoading(false);
    }
  }, []);

  // The first load is deliberately not `refresh()`: that would setState
  // synchronously in the effect body. `loading` already starts true, so there
  // is nothing to set until the request resolves.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getInjuries();

        if (!cancelled) {
          setInjuries(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setError("Failed to load injuries");
        }
      } finally {
        if (!cancelled) {
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
