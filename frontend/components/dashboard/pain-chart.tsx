"use client";

import { useMemo } from "react";

import type { SymptomWithInjury } from "@/hooks/use-symptoms";

const DAYS = 30;
const VIEW_W = 720;
const VIEW_H = 200;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 22;

// Buckets a 0-10 pain level onto the 5-step ramp. Per UI_GUIDE.md the ramp
// is built at constant lightness, so it reads as a hue sweep and each step
// clears contrast on its own -- which is why it is allowed on chart marks.
function painVar(level: number) {
  if (level <= 2) return "var(--pain-1)";
  if (level <= 4) return "var(--pain-2)";
  if (level <= 6) return "var(--pain-3)";
  if (level <= 8) return "var(--pain-4)";
  return "var(--pain-5)";
}

function startOfDay(value: string | Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

type Point = { x: number; y: number; day: Date; level: number };

export function PainChart({ symptoms }: { symptoms: SymptomWithInjury[] }) {
  const points = useMemo<Point[]>(() => {
    const today = startOfDay(new Date());
    const first = new Date(today);
    first.setDate(first.getDate() - (DAYS - 1));

    // Daily mean of every symptom logged that day. Days with nothing logged
    // get no point at all -- the line joins across them, because "not
    // recorded" is not the same as "no pain".
    const totals = new Map<number, { sum: number; count: number }>();

    for (const symptom of symptoms) {
      const day = startOfDay(symptom.date);
      if (day < first || day > today) continue;

      const key = day.getTime();
      const entry = totals.get(key) ?? { sum: 0, count: 0 };
      entry.sum += symptom.painLevel;
      entry.count += 1;
      totals.set(key, entry);
    }

    const spanMs = DAYS - 1;
    const plotW = VIEW_W - PAD_L - PAD_R;
    const plotH = VIEW_H - PAD_T - PAD_B;

    return Array.from(totals.entries())
      .sort(([a], [b]) => a - b)
      .map(([key, { sum, count }]) => {
        const day = new Date(key);
        const level = sum / count;
        const dayOffset = Math.round(
          (day.getTime() - first.getTime()) / 86_400_000,
        );

        return {
          day,
          level,
          x: PAD_L + (dayOffset / spanMs) * plotW,
          y: PAD_T + (1 - level / 10) * plotH,
        };
      });
  }, [symptoms]);

  if (points.length === 0) {
    return (
      <p className="px-1 py-8 text-sm text-muted-foreground">
        No pain levels logged in the last 30 days yet. Log a symptom and the
        trend shows up here.
      </p>
    );
  }

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const area =
    points.length > 1
      ? `${line} L${points[points.length - 1].x} ${VIEW_H - PAD_B} L${points[0].x} ${VIEW_H - PAD_B} Z`
      : "";

  const average = points.reduce((sum, p) => sum + p.level, 0) / points.length;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-44 w-full"
      role="img"
      aria-label={`Daily average pain over the last 30 days, across ${points.length} logged ${
        points.length === 1 ? "day" : "days"
      }. Overall average ${average.toFixed(1)} out of 10.`}
    >
      <defs>
        <linearGradient id="pain-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 5, 10].map((tick) => {
        const y = PAD_T + (1 - tick / 10) * (VIEW_H - PAD_T - PAD_B);
        return (
          <g key={tick}>
            <line
              x1={PAD_L}
              x2={VIEW_W - PAD_R}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--muted-foreground-subtle)"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {area && <path d={area} fill="url(#pain-area)" />}

      <path
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p) => (
        <circle
          key={p.day.getTime()}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill={painVar(p.level)}
          stroke="var(--card)"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
