import { useEffect, useState } from "react";

import { getTimelineEvents, type Injury, type TimelineEvent } from "@/services/api";

export type EventWithInjury = TimelineEvent & {
  injuryId: number;
  injuryName: string;
};

// Fans out one request per injury (there's no cross-injury events endpoint on
// the backend) and merges the results newest-first. Fine for a personal
// journal's injury count; would need a real backend query if that changes.
export function useAllTimelineEvents(injuries: Injury[]) {
  const [events, setEvents] = useState<EventWithInjury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      if (injuries.length === 0) {
        if (!cancelled) {
          setEvents([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const perInjury = await Promise.all(
          injuries.map(async (injury) => {
            const injuryEvents = await getTimelineEvents(injury.id);
            return injuryEvents.map((event) => ({
              ...event,
              injuryId: injury.id,
              injuryName: injury.name,
            }));
          }),
        );

        if (!cancelled) {
          const merged = perInjury
            .flat()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setEvents(merged);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load the timeline");
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

  return { events, loading, error };
}
