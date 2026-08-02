"use client";

import { useEffect, useState } from "react";
import { getTimelineEvents } from "@/services/api";

export function TimelineCard({ injuryId }: { injuryId: number }) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getTimelineEvents(injuryId);
        setEvents(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadEvents();
  }, [injuryId]);

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Timeline</h2>

      {events.length === 0 ? (
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
