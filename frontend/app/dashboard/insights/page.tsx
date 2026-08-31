"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import {
  useAllTreatmentOutcomes,
  type TreatmentWithOutcomes,
} from "@/hooks/use-treatment-outcomes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Group = {
  name: string;
  attempts: TreatmentWithOutcomes[];
};

function groupByName(treatments: TreatmentWithOutcomes[]): Group[] {
  const groups = new Map<string, TreatmentWithOutcomes[]>();

  for (const treatment of treatments) {
    const key = treatment.name.trim().toLowerCase();
    const existing = groups.get(key) ?? [];
    existing.push(treatment);
    groups.set(key, existing);
  }

  return Array.from(groups.values())
    .map((attempts) => ({ name: attempts[0].name, attempts }))
    .sort((a, b) => b.attempts.length - a.attempts.length);
}

function latestStatus(treatment: TreatmentWithOutcomes): string | null {
  if (treatment.outcomes.length === 0) return null;
  return treatment.outcomes[treatment.outcomes.length - 1].status;
}

export default function InsightsPage() {
  const router = useRouter();
  const { injuries, loading: injuriesLoading } = useInjuries();
  const { treatments, loading, error } = useAllTreatmentOutcomes(injuries);

  const groups = useMemo(() => groupByName(treatments), [treatments]);
  const isLoading = injuriesLoading || loading;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <p className="text-sm text-muted-foreground">
        Every treatment tried, grouped by name, with what came of it — the
        thing this app is actually for.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-muted-foreground">{error}</CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">
              Nothing to compare yet — log a treatment and check in on it once
              it&apos;s had time to work, or not.
            </p>
            <Button size="sm" onClick={() => router.push("/dashboard/log?type=treatment")}>
              Log a treatment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Card key={group.name}>
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tried {group.attempts.length}{" "}
                  {group.attempts.length === 1 ? "time" : "times"}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.attempts.map((attempt) => {
                  const status = latestStatus(attempt);
                  return (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-4 border-t pt-3 text-sm first:border-t-0 first:pt-0"
                    >
                      <div>
                        <button
                          className="underline underline-offset-2 hover:text-foreground"
                          onClick={() =>
                            router.push(`/dashboard/injuries/${attempt.injuryId}`)
                          }
                        >
                          {attempt.injuryName}
                        </button>
                        <span className="text-muted-foreground">
                          {" "}
                          · {new Date(attempt.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {status ?? "No check-in yet"}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
