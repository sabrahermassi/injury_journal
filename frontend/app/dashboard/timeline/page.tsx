"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import { useAllTimelineEvents } from "@/hooks/use-timeline-events";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function TimelinePage() {
  const router = useRouter();
  const { injuries, loading: injuriesLoading } = useInjuries();
  const { events, loading: eventsLoading, error } = useAllTimelineEvents(injuries);
  const [typeFilter, setTypeFilter] = useState("all");

  const loading = injuriesLoading || eventsLoading;

  const types = useMemo(
    () => Array.from(new Set(events.map((e) => e.type))).sort(),
    [events],
  );

  const filtered = useMemo(
    () =>
      typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter),
    [events, typeFilter],
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Everything logged, across every injury, oldest choices and all.
        </p>

        {types.length > 0 && (
          <select
            className={selectClassName}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-muted-foreground">{error}</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">
              {events.length === 0
                ? "Nothing on the timeline yet."
                : "Nothing matches that filter."}
            </p>
            {events.length === 0 && (
              <Button size="sm" onClick={() => router.push("/dashboard/log")}>
                Log your first entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((event) => (
            <Card key={`${event.injuryId}-${event.id}`}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-medium">{event.type}</p>
                  <p className="text-sm">{event.description}</p>
                  {event.result && (
                    <p className="text-sm text-muted-foreground">
                      Result: {event.result}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <button
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    onClick={() => router.push(`/dashboard/injuries/${event.injuryId}`)}
                  >
                    {event.injuryName}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
