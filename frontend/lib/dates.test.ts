import { describe, expect, it } from "vitest";

import { addLocalDays, localDateToIso, todayLocalDate } from "@/lib/dates";

// These assertions are deliberately written against *local* calendar
// components rather than hardcoded "...Z" strings. The instant these helpers
// produce depends on the runner's timezone, but the invariant does not: a
// "YYYY-MM-DD" the user picked must read back as that same calendar day.
// Asserting a literal UTC string would pass only in one timezone, which is the
// exact class of bug these helpers exist to prevent (issue #51).
function localParts(iso: string) {
  const d = new Date(iso);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}

describe("localDateToIso", () => {
  it("round-trips a date-input value to the same local calendar day", () => {
    expect(localParts(localDateToIso("2026-01-15"))).toEqual([2026, 1, 15]);
  });

  it("lands on local midnight, not some other time of day", () => {
    const d = new Date(localDateToIso("2026-01-15"));
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0]);
  });

  it("survives the display path the app actually uses", () => {
    const iso = localDateToIso("2026-01-15");
    expect(new Date(iso).toLocaleDateString()).toBe(
      new Date(2026, 0, 15).toLocaleDateString(),
    );
  });

  it.each([
    ["2026-01-01", [2026, 1, 1]],
    ["2026-12-31", [2026, 12, 31]],
    ["2024-02-29", [2024, 2, 29]],
  ])("handles boundary date %s", (input, expected) => {
    expect(localParts(localDateToIso(input))).toEqual(expected);
  });

  it("differs from the naive UTC parse west of UTC, and never disagrees on the day", () => {
    // `new Date("2026-01-15")` is UTC midnight per spec. Our helper must agree
    // on the calendar day in local terms even where the two instants differ.
    const naive = new Date("2026-01-15");
    const ours = new Date(localDateToIso("2026-01-15"));
    expect(localParts(ours.toISOString())).toEqual([2026, 1, 15]);
    if (naive.getTimezoneOffset() > 0) {
      // West of UTC: the naive parse renders as the previous day locally.
      expect(naive.getDate()).not.toBe(ours.getDate());
    }
  });
});

describe("addLocalDays", () => {
  it("adds whole calendar days", () => {
    expect(localParts(addLocalDays("2026-01-15", 3))).toEqual([2026, 1, 18]);
  });

  it("rolls over a month boundary", () => {
    expect(localParts(addLocalDays("2026-01-30", 3))).toEqual([2026, 2, 2]);
  });

  it("stays on local midnight across a DST transition", () => {
    // US DST starts 2026-03-08. Adding days with `setDate()` must keep local
    // midnight rather than drifting an hour, which `days * 24h` would do.
    const iso = addLocalDays("2026-03-06", 4);
    const d = new Date(iso);
    expect(localParts(iso)).toEqual([2026, 3, 10]);
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
  });

  it("accepts a zero offset", () => {
    expect(addLocalDays("2026-01-15", 0)).toBe(localDateToIso("2026-01-15"));
  });
});

describe("todayLocalDate", () => {
  it("returns today in the YYYY-MM-DD shape a date input expects", () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    expect(todayLocalDate()).toBe(expected);
    expect(todayLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("feeds back into localDateToIso as the same day", () => {
    const today = todayLocalDate();
    const now = new Date();
    expect(localParts(localDateToIso(today))).toEqual([
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    ]);
  });
});
