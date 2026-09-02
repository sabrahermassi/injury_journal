/**
 * The reference design's illustrated entry icons.
 *
 * The design hand-assigns art per entry ("Physiotherapy" gets the physio
 * drawing, "Cortisone injection" the syringe) because its data is fixtures.
 * Ours is free text the user typed, so the assignment has to be guessed from
 * the words. That is a heuristic and it will occasionally be wrong — which is
 * why it only ever decorates a row that already carries its own label, and why
 * anything unrecognised falls back to the neutral leaf rather than to whichever
 * icon happened to match last.
 *
 * Order matters: "cortisone injection" must reach `injection` before the more
 * general clinical words can claim it.
 */
export type EntryArt =
  "physio" | "injection" | "pit" | "symptom" | "visit" | "leaf";

const ART_SRC: Record<EntryArt, string> = {
  physio: "/art-physio.png",
  injection: "/art-injection.png",
  pit: "/art-pit.png",
  symptom: "/art-symptom.png",
  visit: "/art-visit.png",
  leaf: "/art-leaf-lg.png",
};

const RULES: [EntryArt, RegExp][] = [
  ["pit", /\bpit\b|perineural/i],
  ["injection", /inject|cortisone|steroid|\bprp\b|prolo|\bjab\b|infusion/i],
  [
    "physio",
    /physio|physical therap|\bpt\b|rehab|exercise|stretch|massage|chiro|osteo|pilates|acupunct/i,
  ],
  [
    "visit",
    /visit|doctor|\bdr\b\.?|appointment|consult|clinic|\bgp\b|specialist|surgeon|scan|x-?ray|\bmri\b|ultrasound/i,
  ],
  ["symptom", /symptom|pain|flare|ache|swelling|stiff|sore|spasm|numb/i],
];

export function artFor(...text: (string | null | undefined)[]): EntryArt {
  const haystack = text.filter(Boolean).join(" ");

  for (const [art, pattern] of RULES) {
    if (pattern.test(haystack)) return art;
  }

  return "leaf";
}

export function artSrc(art: EntryArt) {
  return ART_SRC[art];
}

/**
 * The design's timeline filters are a fixed four — All, Symptoms, Treatments,
 * Visits — but `TimelineEvent.type` is free text (backend/src/validators.js),
 * so events have to be sorted into those buckets rather than read off them.
 *
 * Anything that matches none stays visible under "All" and only there. That is
 * deliberate: silently filing an unrecognised entry under a category would be
 * worse than leaving it out of the three narrow views.
 */
export type EntryCategory = "symptom" | "treatment" | "visit";

export function categoryFor(
  ...text: (string | null | undefined)[]
): EntryCategory | null {
  const art = artFor(...text);

  if (art === "symptom") return "symptom";
  if (art === "visit") return "visit";
  if (art === "physio" || art === "injection" || art === "pit") {
    return "treatment";
  }

  return null;
}
