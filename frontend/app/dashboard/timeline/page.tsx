"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAllTimelineEvents } from "@/hooks/use-timeline-events";
import { useNewEntry } from "@/components/dashboard/new-entry-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EntryIcon } from "@/components/dashboard/entry-icon";
import type { EntryCategory } from "@/lib/entry-art";
import { cn } from "@/lib/utils";

// The design's filter row is a fixed four, not one chip per value found in the
// data. `TimelineEvent.type` is free text, so events are sorted into these
// buckets by categoryFor(); anything it cannot place stays under "All".
const FILTERS: { label: string; value: EntryCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Symptoms", value: "symptom" },
  { label: "Treatments", value: "treatment" },
  { label: "Visits", value: "visit" },
];

export default function TimelinePage() {
  const router = useRouter();
  const { openNewEntry } = useNewEntry();
  // No longer reads the injury list: each event arrives carrying its
  // injury's name, so this page waits on exactly one request.
  const { events, loading, error } = useAllTimelineEvents();
  const [typeFilter, setTypeFilter] = useState<EntryCategory | "all">("all");

  const filtered = useMemo(
    () =>
      typeFilter === "all"
        ? events
        : events.filter((event) => event.category === typeFilter),
    [events, typeFilter],
  );

  return (
    <main className="flex flex-1 flex-col gap-7 p-4 md:p-11">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="font-serif text-4xl leading-tight font-light tracking-tight text-foreground md:text-[42px]">
            Timeline
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
            Everything logged, across every injury, oldest choices and all.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => {
            const active = typeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTypeFilter(filter.value)}
                className={cn(
                  "h-11 rounded-full px-4.5 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-accent-foreground text-background"
                    : "bg-popover text-foreground/80 ring-1 ring-border hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3.5">
          <Skeleton className="h-24 rounded-[22px]" />
          <Skeleton className="h-24 rounded-[22px]" />
          <Skeleton className="h-24 rounded-[22px]" />
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
              <Button size="sm" onClick={() => openNewEntry()}>
                Log your first entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filtered.map((event) => {
            const eventDate = new Date(event.date);

            return (
              <div
                key={`${event.injuryId}-${event.id}`}
                className="flex items-stretch"
              >
                <div className="w-16 flex-none pt-5 md:w-26">
                  <p className="text-sm leading-tight font-semibold text-foreground/80">
                    {eventDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-tight text-muted-foreground">
                    {eventDate.getFullYear()}
                  </p>
                </div>

                <div className="flex w-5.5 flex-none justify-center">
                  <div className="w-px bg-border" />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/injuries/${event.injuryId}`)
                  }
                  className="flex min-w-0 flex-1 items-center gap-4 rounded-[22px] bg-card px-5.5 py-5 text-left ring-1 ring-border transition-colors hover:bg-accent/40 md:gap-4.5"
                >
                  <EntryIcon icon={event.icon} size={72} />

                  {/* Stacked on a narrow screen, side by side from md up --
                      the design's fixed 300px title column would squeeze the
                      description to nothing on a phone. */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-4.5">
                    <div className="min-w-0 md:w-[220px] md:flex-none">
                      <p className="truncate font-serif text-[19px] leading-tight font-medium text-foreground capitalize">
                        {event.type}
                      </p>
                      <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                        {event.injuryName}
                      </p>
                    </div>

                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-pretty text-foreground/80">
                      {event.description}
                    </p>
                  </div>

                  {event.result && (
                    <span className="hidden flex-none rounded-full bg-muted px-3.5 py-2 text-[12.5px] font-medium text-muted-foreground lg:inline">
                      {event.result}
                    </span>
                  )}

                  <ChevronRight
                    className="size-4 flex-none text-muted-foreground-subtle"
                    aria-hidden="true"
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
