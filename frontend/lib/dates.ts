// `<input type="date">` and `Date.toISOString()` both operate in UTC — naive
// use of either shifts the date by a day for anyone west of UTC. These helpers
// keep every date in the app anchored to the browser's local calendar day
// instead, which is the convention every date field here follows: written at
// local midnight, rendered with a plain `toLocaleDateString()`.

export function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Turns a "YYYY-MM-DD" value from a date input into an ISO instant at *local*
// midnight for that day, rather than `new Date(dateStr).toISOString()`, which
// the JS spec parses as UTC midnight — off by a day for negative UTC offsets.
export function localDateToIso(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toISOString();
}

// Adds a whole number of calendar days to a "YYYY-MM-DD" value and returns the
// resulting local midnight as an ISO instant. Uses `setDate()` rather than
// adding `days * 24h` in milliseconds, which drifts by the DST offset for any
// span that crosses a daylight-saving transition.
export function addLocalDays(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const result = new Date(year, month - 1, day);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}
