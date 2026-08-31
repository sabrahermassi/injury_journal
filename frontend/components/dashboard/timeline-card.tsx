"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getTimelineEvents, type TimelineEvent } from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function TimelineCard({ injuryId }: { injuryId: number }) {
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTimelineEvents(injuryId);

        if (!ignore) {
          setEvents(data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Failed to load timeline events");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      ignore = true;
    };
  }, [injuryId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <p className="text-muted-foreground">{error}</p>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-muted-foreground">
              Nothing on the timeline for this injury yet.
            </p>
            <Button
              size="sm"
              onClick={() => router.push(`/dashboard/log?injuryId=${injuryId}`)}
            >
              Log the first entry
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {events.map((event) => (
              <div key={event.id} className="border-l-2 border-border pl-4">
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
      </CardContent>
    </Card>
  );
}
