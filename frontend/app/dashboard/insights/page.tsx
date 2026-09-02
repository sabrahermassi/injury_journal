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
import { cn } from "@/lib/utils";

type Group = {
  name: string;
  attempts: TreatmentWithOutcomes[];
  /** Mean pain reported at check-in, across every attempt that recorded one. */
  outcomePain: number | null;
  /** Longest relief any attempt reported, in days. */
  reliefDays: number | null;
  /** How much better than the injury's own baseline, in pain points. */
  delta: number | null;
};

// The design's "What helped" row carries a session count, how long relief
// held, a change figure and a bar. Every one of those is real:
// TreatmentOutcome records `reliefDays` and `painLevel` per check-in, so the
// change is the check-in pain measured against the baseline the user was at
// before any of this — not a score we invented.
//
// Treatments with no check-in have no figure and say so, rather than being
// given a zero that would read as "did nothing".
function summarise(
  attempts: TreatmentWithOutcomes[],
  baselinePain: number | null,
): Pick<Group, "outcomePain" | "reliefDays" | "delta"> {
  const pains: number[] = [];
  let reliefDays: number | null = null;

  for (const attempt of attempts) {
    for (const outcome of attempt.outcomes) {
      if (typeof outcome.painLevel === "number") pains.push(outcome.painLevel);
      if (typeof outcome.reliefDays === "number") {
        reliefDays = Math.max(reliefDays ?? 0, outcome.reliefDays);
      }
    }
  }

  const outcomePain =
    pains.length > 0 ? pains.reduce((a, b) => a + b, 0) / pains.length : null;

  const delta =
    outcomePain !== null && baselinePain !== null
      ? outcomePain - baselinePain
      : null;

  return { outcomePain, reliefDays, delta };
}

function groupByName(
  treatments: TreatmentWithOutcomes[],
  baselinePain: number | null,
): Group[] {
  const groups = new Map<string, TreatmentWithOutcomes[]>();

  for (const treatment of treatments) {
    const key = `${treatment.injuryId}:${treatment.name.trim().toLowerCase()}`;
    const existing = groups.get(key) ?? [];
    existing.push(treatment);
    groups.set(key, existing);
  }

  return (
    Array.from(groups.values())
      .map((attempts) => ({
        name: attempts[0].name,
        attempts,
        ...summarise(attempts, baselinePain),
      }))
      // Biggest improvement first; anything with no check-in sinks to the
      // bottom rather than sorting as if it scored zero.
      .sort((a, b) => {
        if (a.delta === null && b.delta === null) {
          return b.attempts.length - a.attempts.length;
        }
        if (a.delta === null) return 1;
        if (b.delta === null) return -1;
        return a.delta - b.delta;
      })
  );
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

  // Where the user started: the mean of the earliest pain check-ins, before
  // any treatment had time to work. Every treatment's change figure is read
  // against this, so they are all measured from the same line.
  const baselinePain = useMemo(() => {
    if (symptoms.length === 0) return null;

    // `symptoms` arrives oldest-first from the API.
    const earliest = symptoms.slice(0, Math.min(5, symptoms.length));
    return earliest.reduce((sum, s) => sum + s.painLevel, 0) / earliest.length;
  }, [symptoms]);

  const groups = useMemo(
    () => groupByName(treatments, baselinePain),
    [treatments, baselinePain],
  );

  // The widest bar belongs to the biggest improvement; the rest are drawn in
  // proportion to it, so the column compares treatments against each other
  // rather than against an arbitrary ceiling.
  const bestDelta = useMemo(
    () =>
      groups.reduce(
        (best, group) =>
          group.delta !== null && group.delta < best ? group.delta : best,
        0,
      ),
    [groups],
  );

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
          value={daysTracked === null ? "-" : String(daysTracked)}
          label={
            daysTracked === null
              ? "No injury profile yet"
              : "days since your first injury started"
          }
        />
        <Stat value={String(symptoms.length)} label="pain check-ins logged" />
        <Stat
          value={
            recentAveragePain === null ? "-" : recentAveragePain.toFixed(1)
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
                  Couldn&apos;t load pain levels - try refreshing.
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
                Nothing to compare yet - log a treatment and check in on it once
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
                    <EntryIcon icon={group.attempts[0].icon} size={60} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-[16.5px] leading-tight font-medium text-foreground">
                        {group.name}
                      </p>
                      <p className="mt-1 truncate text-xs leading-snug text-muted-foreground">
                        {group.attempts.length}{" "}
                        {group.attempts.length === 1 ? "session" : "sessions"}
                        {group.reliefDays !== null &&
                          ` · relief held ${group.reliefDays} ${
                            group.reliefDays === 1 ? "day" : "days"
                          }`}
                        {group.reliefDays === null &&
                          ` · ${group.attempts[0].injuryName}`}
                      </p>
                    </div>

                    {/* The design's change pill. A treatment with no check-in
                        has no figure, and says so rather than showing a zero
                        that would read as "made no difference". */}
                    <span
                      className={cn(
                        "flex-none rounded-full px-3 py-1.5 text-[12.5px] font-medium",
                        group.delta === null
                          ? "bg-muted text-muted-foreground"
                          : group.delta < 0
                            ? "bg-accent text-accent-foreground"
                            : "bg-[#F7EEDD] text-[#7A6234] dark:bg-muted dark:text-muted-foreground",
                      )}
                    >
                      {group.delta === null
                        ? (latestStatus(
                            group.attempts[group.attempts.length - 1],
                          ) ?? "No check-in")
                        : `${group.delta < 0 ? "−" : "+"}${Math.abs(group.delta).toFixed(1)}`}
                    </span>
                  </div>

                  {/* Drawn in proportion to the biggest improvement in the
                      list, so the column compares treatments with each other. */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAE5DC] dark:bg-muted">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width:
                          group.delta !== null && bestDelta < 0
                            ? `${Math.max(0, Math.min(100, (group.delta / bestDelta) * 100))}%`
                            : "0%",
                        background:
                          group.delta !== null && group.delta < 0
                            ? "var(--accent-foreground)"
                            : "var(--muted-foreground-subtle)",
                      }}
                    />
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
