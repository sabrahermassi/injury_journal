"use client";

import { useMemo, useState } from "react";

import { createSymptom, type Injury } from "@/services/api";
import type { SymptomWithInjury } from "@/hooks/use-symptoms";
import { cn } from "@/lib/utils";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Same 5-step bucketing the chart uses. UI_GUIDE.md reserves the ramp itself
// for large numerals and chart marks, so the big number below takes the raw
// token; the buttons only take a light tint of it and keep foreground ink,
// which is what carries their contrast.
function painVar(level: number) {
  if (level <= 2) return "var(--pain-1)";
  if (level <= 4) return "var(--pain-2)";
  if (level <= 6) return "var(--pain-3)";
  if (level <= 8) return "var(--pain-4)";
  return "var(--pain-5)";
}

function isToday(iso: string) {
  const then = new Date(iso);
  const now = new Date();
  return (
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()
  );
}

/**
 * The design's "Today" card: one tap on the scale logs a pain check-in.
 *
 * This is the whole entry — `location` and the rest are optional on the API
 * (backend/src/validators.js), so a date and a level is a complete symptom.
 * Anything more detailed still belongs on the log screen.
 */
export function TodayPainCard({
  injuries,
  symptoms,
  onLogged,
}: {
  injuries: Injury[];
  symptoms: SymptomWithInjury[];
  onLogged: () => void;
}) {
  const [injuryId, setInjuryId] = useState<number | undefined>(injuries[0]?.id);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const today = useMemo(() => {
    const logged = symptoms.filter((symptom) => isToday(symptom.date));
    if (logged.length === 0) return null;
    return logged.reduce((sum, s) => sum + s.painLevel, 0) / logged.length;
  }, [symptoms]);

  async function log(level: number) {
    if (!injuryId) return;

    setSaving(level);
    setError(false);

    try {
      // The moment of the check-in, not midnight: the chart buckets by
      // calendar day either way, and this keeps the real time of day.
      await createSymptom(injuryId, {
        date: new Date().toISOString(),
        painLevel: level,
      });
      onLogged();
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground-subtle uppercase">
        Today
      </p>

      <div className="mt-3.5 flex items-end gap-3">
        <span
          className="font-serif text-[48px] leading-[0.9]"
          style={{
            color: today === null ? "var(--muted-foreground)" : painVar(today),
          }}
        >
          {today === null ? "—" : today.toFixed(1)}
        </span>
        <span className="pb-1.5 text-[12.5px] leading-snug text-foreground/80">
          {today === null ? (
            <>nothing logged yet today</>
          ) : (
            <>
              of 10
              <br />
              averaged across today
            </>
          )}
        </span>
      </div>

      {injuries.length > 1 && (
        <label className="mt-4 block">
          <span className="sr-only">Injury to log against</span>
          <select
            value={injuryId}
            onChange={(event) => setInjuryId(Number(event.target.value))}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {injuries.map((injury) => (
              <option key={injury.id} value={injury.id}>
                {injury.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-4 flex gap-1">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={saving !== null || !injuryId}
            onClick={() => log(level)}
            aria-label={`Log today's pain as ${level} out of 10`}
            className={cn(
              "h-9 flex-1 rounded-[9px] text-[11.5px] font-semibold text-foreground transition-opacity",
              "hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40",
              saving === level ? "opacity-100" : "opacity-80",
            )}
            style={{
              backgroundColor: `color-mix(in oklch, ${painVar(level)} 24%, var(--popover))`,
            }}
          >
            {level}
          </button>
        ))}
      </div>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
        {error
          ? "Couldn't save that — try again."
          : "Tap a number to log today. The scale never turns red."}
      </p>
    </div>
  );
}
