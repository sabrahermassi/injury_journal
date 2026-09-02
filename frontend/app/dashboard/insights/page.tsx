"use client";

import { useMemo, useState } from "react";

import { useInjuries } from "@/components/dashboard/injuries-provider";
import { useAllSymptoms } from "@/hooks/use-symptoms";
import {
  useAllTreatmentOutcomes,
  type TreatmentWithOutcomes,
} from "@/hooks/use-treatment-outcomes";
import { PainChart } from "@/components/dashboard/pain-chart";
import { EntryIcon } from "@/components/dashboard/entry-icon";
import { useNewEntry } from "@/components/dashboard/new-entry-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtIcon } from "@/components/ui/art-icon";

type Group = {
  name: string;
  attempts: TreatmentWithOutcomes[];
};

function groupByName(treatments: TreatmentWithOutcomes[]): Group[] {
  const groups = new Map<string, TreatmentWithOutcomes[]>();

  for (const treatment of treatments) {
    const key = `${treatment.injuryId}:${treatment.name.trim().toLowerCase()}`;
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

// Same 5-step bucketing as the chart. UI_GUIDE.md allows the ramp on large
// numerals, which is what the stat value is.
function painToneVar(level: number) {
  if (level <= 2) return "var(--pain-1)";
  if (level <= 4) return "var(--pain-2)";
  if (level <= 6) return "var(--pain-3)";
  if (level <= 8) return "var(--pain-4)";
  return "var(--pain-5)";
}

function Stat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: string;
}) {
  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
      <p
        className="font-serif text-[46px] leading-none"
        style={{ color: tone ?? "var(--foreground)" }}
      >
        {value}
      </p>
      <p className="mt-2.5 text-[13px] leading-snug text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function InsightsPage() {
  const { openNewEntry } = useNewEntry();
  const { injuries, loading: injuriesLoading } = useInjuries();
  const { treatments, loading, error } = useAllTreatmentOutcomes();
  const { symptoms, error: symptomsError } = useAllSymptoms();

  const groups = useMemo(() => groupByName(treatments), [treatments]);
  const isLoading = injuriesLoading || loading;

  // Pinned once per mount. Reading the clock during render is impure: the
  // window would silently shift on an unrelated re-render.
  const [now] = useState(() => Date.now());

  const daysTracked = useMemo(() => {
    if (injuries.length === 0) return null;

    const earliest = injuries.reduce((min, injury) => {
      const started = new Date(injury.startDate).getTime();
      return started < min ? started : min;
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(earliest)) return null;

    return Math.max(0, Math.floor((now - earliest) / 86_400_000));
  }, [injuries, now]);

  // Mean of every pain level logged in the last 30 days. Null when nothing
  // was logged in that window -- an empty average is not zero pain.
  const recentAveragePain = useMemo(() => {
    const cutoff = now - 30 * 86_400_000;
    const recent = symptoms.filter(
      (symptom) => new Date(symptom.date).getTime() >= cutoff,
    );

    if (recent.length === 0) return null;

    return recent.reduce((sum, s) => sum + s.painLevel, 0) / recent.length;
  }, [symptoms, now]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-11">
      <div>
        <h2 className="font-serif text-4xl leading-tight font-light tracking-tight text-foreground md:text-[42px]">
          Insights
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
          What is actually helping, and how the last month has moved.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Stat
          value={daysTracked === null ? "—" : String(daysTracked)}
          label={
            daysTracked === null
              ? "No injury profile yet"
              : "days since your first injury started"
          }
        />
        <Stat value={String(symptoms.length)} label="pain check-ins logged" />
        <Stat
          value={
            recentAveragePain === null ? "—" : recentAveragePain.toFixed(1)
          }
          label="average pain, last 30 days"
          tone={
            recentAveragePain === null
              ? undefined
              : painToneVar(recentAveragePain)
          }
        />
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <Card className="w-full min-w-0 flex-1 gap-0 py-0">
          <CardContent className="px-6 py-5.5">
            <div className="flex items-center gap-3">
              <ArtIcon src="/art-leaf-sm.png" size={28} />
              <h3 className="font-serif text-[23px] leading-tight font-medium text-foreground">
                How you&apos;ve been feeling
              </h3>
            </div>

            <div className="mt-3">
              {symptomsError ? (
                <p className="py-8 text-sm text-muted-foreground">
                  Couldn&apos;t load pain levels — try refreshing.
                </p>
              ) : (
                <PainChart symptoms={symptoms} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full flex-none gap-0 overflow-hidden py-0 lg:w-[420px]">
          <h3 className="px-[22px] pt-5 pb-3.5 font-serif text-[23px] leading-tight font-medium text-foreground">
            What helped
          </h3>

          {isLoading ? (
            <div className="flex flex-col gap-3 px-[22px] pb-5">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : error ? (
            <p className="px-[22px] pb-5 text-sm text-muted-foreground">
              {error}
            </p>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-start gap-3 px-[22px] pb-5">
              <p className="text-sm text-muted-foreground">
                Nothing to compare yet — log a treatment and check in on it once
                it&apos;s had time to work, or not.
              </p>
              <Button
                size="sm"
                onClick={() => openNewEntry({ kind: "Treatment" })}
              >
                Log a treatment
              </Button>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div
                  key={`${group.attempts[0].injuryId}-${group.name}`}
                  className="border-t border-border px-[22px] py-4"
                >
                  <div className="flex items-center gap-3.5">
                    <EntryIcon icon={group.attempts[0].icon} size={44} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-[16.5px] leading-tight font-medium text-foreground">
                        {group.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {group.attempts[0].injuryName} · tried{" "}
                        {group.attempts.length}{" "}
                        {group.attempts.length === 1 ? "time" : "times"}
                      </p>
                    </div>

                    <span className="flex-none rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {latestStatus(
                        group.attempts[group.attempts.length - 1],
                      ) ?? "No check-in"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
