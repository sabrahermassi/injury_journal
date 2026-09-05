import { useEffect, useState } from "react";

import {
  getAllTimelineEvents,
  type TimelineEvent,
  type WithInjury,
} from "@/services/api";

export type EventWithInjury = WithInjury<TimelineEvent>;

/**
 * Every timeline event across every injury, newest first.
 *
 * One request — the backend does the merge and the ordering. This used to ask
 * per injury; see `getAllTimelineEvents` for why that stopped working.
 */
export function useAllTimelineEvents() {
  const [events, setEvents] = useState<EventWithInjury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAllTimelineEvents();

        if (!cancelled) {
          setEvents(data);
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

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error };
}
