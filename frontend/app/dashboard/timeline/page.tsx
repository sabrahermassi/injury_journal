"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Pill, Stethoscope, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import { useAllTimelineEvents } from "@/hooks/use-timeline-events";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// `type` is a free-text field (backend/src/validators.js), not a fixed enum
// -- these three are what the app's own forms write, everything else falls
// back to a generic icon rather than assuming the set is closed.
const TYPE_ICONS: Record<string, LucideIcon> = {
  symptom: Activity,
  treatment: Pill,
  visit: Stethoscope,
};

function iconForType(type: string) {
  return TYPE_ICONS[type.toLowerCase()] ?? CalendarClock;
}

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
          <div className="flex flex-wrap items-center gap-1.5">
            {["all", ...types].map((type) => {
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "h-8 rounded-full px-3.5 text-xs font-medium capitalize transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
                  )}
                >
                  {type === "all" ? "All" : type}
                </button>
              );
            })}
          </div>
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
          {filtered.map((event) => {
            const eventDate = new Date(event.date);
            const Icon = iconForType(event.type);

            return (
              <div
                key={`${event.injuryId}-${event.id}`}
                className="flex items-stretch gap-3"
              >
                <div className="w-12 flex-none pt-3.5 text-right">
                  <p className="text-xs font-semibold text-foreground/80">
                    {eventDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {eventDate.getFullYear()}
                  </p>
                </div>

                <div className="flex w-3.5 flex-none justify-center">
                  <div className="w-px bg-border" />
                </div>

                <Card className="flex-1 py-0">
                  <CardContent className="flex items-start gap-3 py-3.5">
                    <div className="flex size-9 flex-none items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-base text-foreground capitalize">
                          {event.type}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/dashboard/injuries/${event.injuryId}`)
                          }
                          className="flex-none rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          {event.injuryName}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-foreground/80">
                        {event.description}
                      </p>
                      {event.result && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Result: {event.result}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
