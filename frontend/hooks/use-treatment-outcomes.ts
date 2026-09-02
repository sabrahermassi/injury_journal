import { useEffect, useState } from "react";

import {
  getAllTreatments,
  type Treatment,
  type TreatmentOutcome,
  type WithInjury,
} from "@/services/api";

export type TreatmentWithOutcomes = WithInjury<
  Treatment & { outcomes: TreatmentOutcome[] }
>;

/**
 * Every treatment the user has, each with its outcome check-ins.
 *
 * One request. This used to fan out twice over — once per injury for the
 * treatments, then once per treatment for its outcomes — which on a real
 * account was 37 requests to draw one panel. The backend now joins the
 * outcomes in; see `getAllTreatments`.
 */
export function useAllTreatmentOutcomes() {
  const [treatments, setTreatments] = useState<TreatmentWithOutcomes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAllTreatments();

        if (!cancelled) {
          setTreatments(data);
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

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { treatments, loading, error };
}
