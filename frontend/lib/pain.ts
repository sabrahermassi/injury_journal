// Maps a 1-10 pain score to one of the five --pain-N tokens (see UI_GUIDE.md).
// Tokens are for large numerals and graphical marks only — never body text.
export function painToneClass(painLevel: number): string {
  if (painLevel <= 2) return "text-pain-1";
  if (painLevel <= 4) return "text-pain-2";
  if (painLevel <= 6) return "text-pain-3";
  if (painLevel <= 8) return "text-pain-4";
  return "text-pain-5";
}
