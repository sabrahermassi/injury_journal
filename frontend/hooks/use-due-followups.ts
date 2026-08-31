import { useEffect, useState } from "react";

import { getTreatments, type Injury, type Treatment } from "@/services/api";

export type DueFollowUp = Treatment & { injuryId: number; injuryName: string };

// Lighter than use-treatment-outcomes.ts — just the treatments, no outcome
// history — since Home only needs to know what's due, not what happened.
export function useDueFollowUps(injuries: Injury[]) {
  const [dueFollowUps, setDueFollowUps] = useState<DueFollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (injuries.length === 0) {
        if (!cancelled) {
          setDueFollowUps([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const now = Date.now();
        const perInjury = await Promise.all(
          injuries.map(async (injury) => {
            const treatments = await getTreatments(injury.id);
            return treatments
              .filter(
                (t) => t.followUpDueAt && new Date(t.followUpDueAt).getTime() <= now,
              )
              .map((t) => ({ ...t, injuryId: injury.id, injuryName: injury.name }));
          }),
        );

        if (!cancelled) {
          setDueFollowUps(perInjury.flat());
        }
      } catch (err) {
        console.error(err);
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
  }, [injuries]);

  return { dueFollowUps, loading };
}
