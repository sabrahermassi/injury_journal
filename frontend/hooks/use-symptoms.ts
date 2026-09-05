import { useCallback, useEffect, useState } from "react";

import { getSymptoms, type Injury, type Symptom } from "@/services/api";

export type SymptomWithInjury = Symptom & {
  injuryId: number;
  injuryName: string;
};

// Fans out one request per injury — same tradeoff as use-timeline-events.ts
// and use-treatment-outcomes.ts, fine at personal-journal scale.
export function useAllSymptoms(injuries: Injury[]) {
  const [symptoms, setSymptoms] = useState<SymptomWithInjury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Callers that write a symptom (the home screen's quick log) need the
  // chart and today's average to catch up without a full page reload.
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      if (injuries.length === 0) {
        if (!cancelled) {
          setSymptoms([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const perInjury = await Promise.all(
          injuries.map(async (injury) => {
            const injurySymptoms = await getSymptoms(injury.id);

            return injurySymptoms.map((symptom) => ({
              ...symptom,
              injuryId: injury.id,
              injuryName: injury.name,
            }));
          }),
        );

        if (!cancelled) {
          const merged = perInjury
            .flat()
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            );
          setSymptoms(merged);
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

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [injuries, reloadKey]);

  return { symptoms, loading, error, refresh };
}
