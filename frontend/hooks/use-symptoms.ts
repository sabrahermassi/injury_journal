import { useCallback, useEffect, useState } from "react";

import { getAllSymptoms, type Symptom, type WithInjury } from "@/services/api";

export type SymptomWithInjury = WithInjury<Symptom>;

/**
 * Every pain check-in the user has logged, oldest first.
 *
 * One request. This used to fan out per injury and take the injury list as an
 * argument, which meant it could not start until `useInjuries` had resolved
 * and then cost one request per injury; see `getAllSymptoms` for what that
 * did to the rate limit.
 */
export function useAllSymptoms() {
  const [symptoms, setSymptoms] = useState<SymptomWithInjury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Callers that write a symptom (the home screen's quick log) need the
  // chart and today's average to catch up without a full page reload.
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAllSymptoms();

        if (!cancelled) {
          setSymptoms(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load symptoms");
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
  }, [reloadKey]);

  return { symptoms, loading, error, refresh };
}
