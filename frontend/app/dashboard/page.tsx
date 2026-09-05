"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, PlusCircle } from "lucide-react";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import { useAllTimelineEvents } from "@/hooks/use-timeline-events";
import { useAllSymptoms } from "@/hooks/use-symptoms";
import { useDueFollowUps } from "@/hooks/use-due-followups";
import { CreateInjuryDialog } from "@/components/dashboard/create-injury-dialog";
import { PainChart } from "@/components/dashboard/pain-chart";
import { TodayPainCard } from "@/components/dashboard/today-pain-card";
import { EntryIcon } from "@/components/dashboard/entry-icon";
import { useNewEntry } from "@/components/dashboard/new-entry-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtIcon } from "@/components/ui/art-icon";

function greeting(hour: number | null) {
  if (hour === null) return "Welcome back";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { openNewEntry } = useNewEntry();
  const { injuries, loading: injuriesLoading, refresh } = useInjuries();
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
  } = useAllTimelineEvents();
  const {
    symptoms,
    loading: symptomsLoading,
    error: symptomsError,
    refresh: refreshSymptoms,
  } = useAllSymptoms();
  const { dueFollowUps, error: dueFollowUpsError } = useDueFollowUps();
  const [createOpen, setCreateOpen] = useState(false);

  // Rendered as null on both server and client so hydration matches, then
  // filled in from the browser's own clock once mounted -- reading it during
  // the initial render risks the server and client landing on different
  // hours (and therefore a different greeting) if the request straddles the
  // boundary or the two clocks simply disagree.
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    // The clock is a browser API, not derived from props/state -- there is
    // nothing to synchronize this against, so the usual "compute during
    // render instead" alternative the lint rule is guarding for doesn't
    // apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHour(new Date().getHours());
  }, []);

  const recent = useMemo(() => events.slice(0, 5), [events]);

  const trackedNames = useMemo(
    () => injuries.map((injury) => injury.name).join(" & "),
    [injuries],
  );

  if (injuriesLoading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-11">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </main>
    );
  }

  if (injuries.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-start gap-6 p-4 md:p-11">
        <Card className="max-w-lg rounded-3xl">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-medium">
              Start your record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Set up a profile for what you&apos;re tracking, and everything
              after - symptoms, treatments, visits - gets kept in one place
              against it. The first week is just about building the record;
              there&apos;s no catching up to do.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusCircle />
              Set up your first injury profile
            </Button>
          </CardContent>
        </Card>

        <CreateInjuryDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={refresh}
        />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-4 md:px-11 md:pt-9 md:pb-11">
      {/* Decorative sprig from the reference design, bleeding off the right
          edge. Clipped by the section so it can never widen the page. */}
      <section className="relative overflow-hidden pb-6">
        <ArtIcon
          src="/sprig-ref.png"
          size={326}
          className="pointer-events-none absolute -top-8 right-0"
        />

        <div className="relative max-w-xl">
          <h2 className="font-serif text-4xl leading-[1.02] font-light tracking-tight text-foreground md:text-[46px]">
            {greeting(hour)}
          </h2>
          <p className="mt-3.5 text-[15.5px] leading-relaxed text-muted-foreground">
            Healing isn&apos;t linear, but every step counts.{" "}
            <span className="text-accent-foreground" aria-hidden="true">
              ♡
            </span>
          </p>
        </div>
      </section>

      <div className="relative flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
          <Card className="gap-0 rounded-3xl py-0">
            <CardHeader className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5.5 pb-0">
              <div className="flex items-start gap-3">
                <ArtIcon src="/art-leaf-sm.png" size={30} className="mt-1" />
                <div>
                  <CardTitle className="font-serif text-2xl leading-tight font-medium">
                    How you&apos;ve been feeling
                  </CardTitle>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Past 30 days{trackedNames ? ` · ${trackedNames}` : ""}
                  </p>
                </div>
              </div>

              {/* The design draws this as a dropdown. Daily average is the only
                  aggregation there is, so it stays a label rather than a
                  control that opens nothing. */}
              <span className="flex h-11 flex-none items-center rounded-2xl bg-popover px-4 text-[13.5px] text-foreground/80 ring-1 ring-border">
                Daily average
              </span>
            </CardHeader>

            <CardContent className="px-6 pt-3.5 pb-5">
              {symptomsError ? (
                <p className="py-8 text-sm text-muted-foreground">
                  Couldn&apos;t load pain levels - try refreshing.
                </p>
              ) : symptomsLoading ? (
                <Skeleton className="h-44 w-full rounded-xl" />
              ) : (
                <PainChart symptoms={symptoms} />
              )}
            </CardContent>
          </Card>

          <div className="flex items-baseline justify-between gap-4 px-1 pt-1">
            <h3 className="font-serif text-[26px] leading-tight font-medium text-foreground">
              Recent activity
            </h3>
            {recent.length > 0 && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/timeline")}
                className="text-[13.5px] font-medium text-accent-foreground transition-colors hover:text-foreground"
              >
                View all
              </button>
            )}
          </div>

          <Card className="gap-0 overflow-hidden rounded-3xl py-0">
            {eventsLoading ? (
              <div className="space-y-2 p-5">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : eventsError ? (
              <p className="p-5 text-muted-foreground">
                Couldn&apos;t load recent activity - try refreshing.
              </p>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-start gap-2 p-5">
                <p className="text-muted-foreground">
                  Nothing logged yet - a note today is worth more than a perfect
                  one later.
                </p>
                <Button size="sm" onClick={() => openNewEntry()}>
                  Log your first entry
                </Button>
              </div>
            ) : (
              recent.map((event) => (
                <button
                  key={`${event.injuryId}-${event.id}`}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/injuries/${event.injuryId}`)
                  }
                  className="flex w-full items-center gap-4 border-t border-border px-5.5 py-4.5 text-left transition-colors first:border-t-0 hover:bg-accent/40"
                >
                  <EntryIcon icon={event.icon} size={60} />

                  <div className="min-w-0 sm:w-[190px] sm:flex-none">
                    <p className="truncate font-serif text-[19px] leading-tight font-medium text-foreground capitalize">
                      {event.type}
                    </p>
                    <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                      {event.injuryName}
                    </p>
                  </div>

                  <p className="hidden min-w-0 flex-1 truncate text-sm text-foreground/80 sm:block">
                    {event.description}
                  </p>

                  <span className="ml-auto flex-none text-[12.5px] text-muted-foreground sm:ml-0">
                    {new Date(event.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <ChevronRight
                    className="size-4 flex-none text-muted-foreground-subtle"
                    aria-hidden="true"
                  />
                </button>
              ))
            )}
          </Card>
        </div>

        <div className="flex w-full flex-none flex-col gap-4.5 lg:w-[364px]">
          <div className="flex items-center gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
            <span className="flex size-[66px] flex-none items-center justify-center rounded-full bg-accent">
              <ArtIcon src="/art-leaf-lg.png" size={40} />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-[19px] leading-tight font-medium text-foreground">
                Small steps, real progress.
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Your consistency is building a clearer picture of your healing.
              </p>
            </div>
          </div>

          {/* The design's right rail also carries a "Next appointment" card and
              an appointment-summary prompt. There is no scheduled-appointment
              model -- MedicalVisit records a visit that already happened -- so
              those are left out rather than mocked up. */}

          <TodayPainCard
            injuries={injuries}
            symptoms={symptoms}
            onLogged={refreshSymptoms}
          />

          {dueFollowUpsError && (
            <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
              <p className="font-serif text-[19px] leading-tight font-medium text-foreground">
                Worth a check-in
              </p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                Couldn&apos;t check for due follow-ups - try refreshing.
              </p>
            </div>
          )}

          {!dueFollowUpsError && dueFollowUps.length > 0 && (
            <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
              <p className="font-serif text-[19px] leading-tight font-medium text-foreground">
                Worth a check-in
              </p>

              <div className="mt-3 flex flex-col gap-3">
                {dueFollowUps.map((treatment) => (
                  <div
                    key={treatment.id}
                    className="flex items-center justify-between gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="min-w-0 text-[13px] text-foreground/80">
                      How did{" "}
                      <span className="font-medium text-foreground">
                        {treatment.name}
                      </span>{" "}
                      work out?
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-none"
                      onClick={() =>
                        router.push(`/dashboard/injuries/${treatment.injuryId}`)
                      }
                    >
                      Check in
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
