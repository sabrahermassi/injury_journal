import { describe, expect, it } from "vitest";

import { artFor, categoryFor } from "./entry-art";

// The design hand-assigns art per entry; ours has to guess it from free text.
// These pin the guesses that matter and, more importantly, the fallback --
// a wrong icon is cosmetic, but an entry silently filed under the wrong filter
// is not.

describe("artFor", () => {
  it("matches the three treatments the design draws", () => {
    expect(artFor("Physiotherapy")).toBe("physio");
    expect(artFor("Cortisone injection")).toBe("injection");
    expect(artFor("PIT Treatment")).toBe("pit");
  });

  it("puts injections ahead of the general clinical words", () => {
    // "Cortisone injection at the clinic" contains both "clinic" (visit) and
    // "injection"; the more specific one has to win.
    expect(artFor("Cortisone injection at the clinic")).toBe("injection");
  });

  it("reads across every field it is given", () => {
    expect(artFor("treatment_started", "Started physical therapy")).toBe(
      "physio",
    );
    expect(artFor("doctor_visit", "Saw the GP")).toBe("visit");
  });

  it("falls back to the leaf rather than guessing", () => {
    expect(artFor("Entry")).toBe("leaf");
    expect(artFor("")).toBe("leaf");
    expect(artFor(null, undefined)).toBe("leaf");
  });
});

describe("categoryFor", () => {
  it("folds the three treatment icons into one bucket", () => {
    expect(categoryFor("Physiotherapy")).toBe("treatment");
    expect(categoryFor("Cortisone injection")).toBe("treatment");
    expect(categoryFor("PIT Treatment")).toBe("treatment");
  });

  it("keeps symptoms and visits apart", () => {
    expect(categoryFor("symptom", "Sharp pain when bending")).toBe("symptom");
    expect(categoryFor("doctor_visit", "Saw Dr. Okafor")).toBe("visit");
  });

  it("returns null for anything it cannot place", () => {
    // These stay visible under "All" and are not filed under a filter they
    // may not belong to. `injury_occurred` and `recovered` are real types the
    // app's own seed data writes.
    expect(categoryFor("injury_occurred", "Felt a pull lifting a box")).toBe(
      null,
    );
    expect(categoryFor("recovered", "Cleared for sport")).toBe(null);
  });
});
