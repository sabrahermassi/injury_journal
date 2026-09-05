/**
 * Icon key -> illustration. The keys themselves come from the API.
 *
 * The matching table lives in `backend/src/entryIcons.js` and is the single
 * source of truth: the server stamps an `icon` onto every symptom, treatment,
 * timeline event and assistant citation it returns. Guessing here as well is
 * what made the icons inconsistent in the first place — the frontend matched
 * on an entry's type *and* its description, so two `doctor_visit` rows drew
 * different pictures because one of them mentioned physical therapy.
 *
 * So this file maps, and does not decide. An unknown or missing key falls back
 * to the leaf, which is also what the server sends for anything its table
 * cannot place.
 */
export type EntryIconKey =
  | "physio"
  | "injection"
  | "pit"
  | "symptom"
  | "visit"
  | "leaf";

const ART_SRC: Record<EntryIconKey, string> = {
  physio: "/art-physio.png",
  injection: "/art-injection.png",
  pit: "/art-pit.png",
  symptom: "/art-symptom.png",
  visit: "/art-visit.png",
  leaf: "/art-leaf-lg.png",
};

export function artSrc(icon: EntryIconKey | null | undefined): string {
  return ART_SRC[icon as EntryIconKey] ?? ART_SRC.leaf;
}

/** The timeline's three filters, as the API labels them. */
export type EntryCategory = "symptom" | "treatment" | "visit";
