import { useEffect, useState } from "react";

import {
  getAllTreatments,
  type Treatment,
  type WithInjury,
} from "@/services/api";

export type DueFollowUp = WithInjury<Treatment>;

// Treatments whose follow-up date has arrived. Same single request as
// use-treatment-outcomes.ts — the outcomes ride along unused here, which is
// cheaper than the per-injury fan-out this replaced.
export function useDueFollowUps() {
  const [dueFollowUps, setDueFollowUps] = useState<DueFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const treatments = await getAllTreatments();
        const now = Date.now();

        if (!cancelled) {
          setDueFollowUps(
            treatments.filter(
              (treatment) =>
                treatment.followUpDueAt &&
                new Date(treatment.followUpDueAt).getTime() <= now,
            ),
          );
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setDueFollowUps([]);
          setError("Failed to load follow-ups");
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

  return { dueFollowUps, loading, error };
}
