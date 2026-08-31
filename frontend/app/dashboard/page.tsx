"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import { useAllTimelineEvents } from "@/hooks/use-timeline-events";
import { useDueFollowUps } from "@/hooks/use-due-followups";
import { CreateInjuryDialog } from "@/components/dashboard/create-injury-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { injuries, loading: injuriesLoading, refresh } = useInjuries();
  const { events, loading: eventsLoading, error: eventsError } = useAllTimelineEvents(injuries);
  const { dueFollowUps, error: dueFollowUpsError } = useDueFollowUps(injuries);
  const [createOpen, setCreateOpen] = useState(false);

  const recent = useMemo(() => events.slice(0, 5), [events]);

  if (injuriesLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </main>
    );
  }

  if (injuries.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-start gap-4 p-4 md:gap-6 md:p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Start your record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Set up a profile for what you&apos;re tracking, and everything
              after — symptoms, treatments, visits — gets kept in one place
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
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-medium">{greeting()}</h2>
          <p className="text-sm text-muted-foreground">
            {injuries.length === 1
              ? "1 injury profile being tracked."
              : `${injuries.length} injury profiles being tracked.`}
          </p>
        </div>

        <Button onClick={() => router.push("/dashboard/log")}>
          <PlusCircle />
          Log something
        </Button>
      </div>

      {dueFollowUpsError && (
        <Card>
          <CardHeader>
            <CardTitle>Worth a check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t check for due follow-ups — try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {!dueFollowUpsError && dueFollowUps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Worth a check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueFollowUps.map((treatment) => (
              <div
                key={treatment.id}
                className="flex items-center justify-between gap-4 border-t pt-3 first:border-t-0 first:pt-0"
              >
                <p className="text-sm">
                  How did <span className="font-medium">{treatment.name}</span>{" "}
                  work out?{" "}
                  <span className="text-muted-foreground">
                    ({treatment.injuryName})
                  </span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/injuries/${treatment.injuryId}`)
                  }
                >
                  Check in
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : eventsError ? (
            <p className="text-muted-foreground">
              Couldn&apos;t load recent activity — try refreshing.
            </p>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-muted-foreground">
                Nothing logged yet — a note today is worth more than a
                perfect one later.
              </p>
              <Button size="sm" onClick={() => router.push("/dashboard/log")}>
                Log your first entry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recent.map((event) => (
                <div
                  key={`${event.injuryId}-${event.id}`}
                  className="flex items-start justify-between gap-4 border-t pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">{event.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.injuryName}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
