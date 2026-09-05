import { useEffect, useState } from "react";

import {
  getTreatmentOutcomes,
  getTreatments,
  type Injury,
  type Treatment,
  type TreatmentOutcome,
} from "@/services/api";

export type TreatmentWithOutcomes = Treatment & {
  injuryId: number;
  injuryName: string;
  outcomes: TreatmentOutcome[];
};

// Fans out per-injury and per-treatment requests — same tradeoff as
// use-timeline-events.ts, fine at personal-journal scale.
export function useAllTreatmentOutcomes(injuries: Injury[]) {
  const [treatments, setTreatments] = useState<TreatmentWithOutcomes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      if (injuries.length === 0) {
        if (!cancelled) {
          setTreatments([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const perInjury = await Promise.all(
          injuries.map(async (injury) => {
            const injuryTreatments = await getTreatments(injury.id);

            return Promise.all(
              injuryTreatments.map(async (treatment) => {
                const outcomes = await getTreatmentOutcomes(treatment.id);
                return {
                  ...treatment,
                  injuryId: injury.id,
                  injuryName: injury.name,
                  outcomes,
                };
              }),
            );
          }),
        );

        if (!cancelled) {
          const merged = perInjury
            .flat()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTreatments(merged);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load treatments");
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
  }, [injuries]);

  return { treatments, loading, error };
}
