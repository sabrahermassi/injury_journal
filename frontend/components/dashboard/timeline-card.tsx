"use client";

import { useEffect, useState } from "react";
import { getTimelineEvents, type TimelineEvent } from "@/services/api";

export function TimelineCard({ injuryId }: { injuryId: number }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setError(null);

        const data = await getTimelineEvents(injuryId);
        setEvents(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load timeline events");
      }
    }

    loadEvents();
  }, [injuryId]);

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Timeline</h2>

      {error ? (
        <p className="mt-3 text-muted-foreground">{error}</p>
      ) : events.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          No timeline events recorded.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          {events.map((event) => (
            <div key={event.id} className="border-l-2 pl-4">
              <p className="font-medium">{event.type}</p>

              <p className="text-sm text-muted-foreground">
                {new Date(event.date).toLocaleDateString()}
              </p>

              <p className="text-sm">{event.description}</p>

              {event.result && (
                <p className="text-sm text-muted-foreground">
                  Result: {event.result}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
