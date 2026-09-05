import type { journalTool } from './journal-tool.js';

type InjuryRecord = NonNullable<Awaited<ReturnType<typeof journalTool>>>;

const isoDate = (value: Date): string => value.toISOString().slice(0, 10);

const DAY_MS = 86_400_000;

// Aggregates the model would otherwise have to derive by eye from prose.
//
// Retrieval hands over sentences like "On 2026-08-18, the user received
// Physical Therapy... Reported outcome: Improving". Asking an LLM to compare
// relief across a course of treatments, or to work out whether pain is lower
// than it was, means asking it to do arithmetic and sorting over text -- the
// thing it is least reliable at. Everything below is computed here so the
// model only has to describe it.
//
// Deliberately reports figures without characterising them. "Pain went 7 -> 4"
// is arithmetic; "the injury is improving" is a clinical judgement this service
// does not make (see the safety boundary in docs/01-product.md).
//
// A pure function over records already loaded by journalTool -- no queries of
// its own, so it cannot disagree with the records in the same prompt.
export function buildInjuryStats(injury: InjuryRecord): string {
  const lines: string[] = [];

  const daysTracked = Math.max(
    0,
    Math.floor((Date.now() - injury.startDate.getTime()) / DAY_MS),
  );

  lines.push(
    `- Tracked for ${daysTracked} days (since ${isoDate(injury.startDate)})${injury.status ? `, status: ${injury.status}` : ''}`,
  );

  if (injury.Symptom.length > 0) {
    // Symptom is ordered by date ascending in journalTool's include.
    const first = injury.Symptom[0];
    const latest = injury.Symptom[injury.Symptom.length - 1];
    const levels = injury.Symptom.map((symptom) => symptom.painLevel);
    const lowest = Math.min(...levels);
    const highest = Math.max(...levels);

    lines.push(
      `- Pain: ${injury.Symptom.length} ${injury.Symptom.length === 1 ? 'entry' : 'entries'}, ` +
        `first ${first.painLevel}/10 (${isoDate(first.date)}), ` +
        `latest ${latest.painLevel}/10 (${isoDate(latest.date)}), ` +
        `range ${lowest}-${highest}`,
    );

    if (injury.Symptom.length > 1) {
      const delta = latest.painLevel - first.painLevel;
      const direction = delta === 0 ? 'unchanged' : delta < 0 ? 'lower' : 'higher';

      lines.push(
        `- Pain change since first entry: ${direction}${delta === 0 ? '' : ` by ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'point' : 'points'}`}`,
      );
    }
  } else {
    lines.push('- Pain: no symptom entries logged');
  }

  if (injury.Treatment.length > 0) {
    lines.push(`- Treatments: ${injury.Treatment.length} logged`);

    // Repeated attempts at the same treatment belong together. courseId exists
    // for exactly this; fall back to the name when it is not set, which mirrors
    // how the journal's own Insights page groups attempts.
    const groups = new Map<string, typeof injury.Treatment>();

    for (const treatment of injury.Treatment) {
      const key = treatment.courseId ?? treatment.name.trim().toLowerCase();
      groups.set(key, [...(groups.get(key) ?? []), treatment]);
    }

    for (const attempts of groups.values()) {
      const name = attempts[0].name;
      const checkIns = attempts.flatMap((attempt) => attempt.TreatmentOutcome);

      const parts = [
        `  - ${name}: ${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'}`,
      ];

      if (checkIns.length > 0) {
        const relief = checkIns
          .filter((checkIn) => checkIn.reliefDays !== null)
          .map((checkIn) => checkIn.reliefDays);

        if (relief.length > 0) {
          parts.push(`, relief days in order: ${relief.join(', ')}`);
        }

        const painAfter = checkIns
          .filter((checkIn) => checkIn.painLevel !== null)
          .map((checkIn) => checkIn.painLevel);

        if (painAfter.length > 0) {
          parts.push(`, pain after treatment: ${painAfter.join(', ')}`);
        }

        parts.push(`, latest check-in: ${checkIns[checkIns.length - 1].status}`);
      } else {
        parts.push(', no check-ins recorded');
      }

      lines.push(parts.join(''));
    }
  } else {
    lines.push('- Treatments: none logged');
  }

  lines.push(
    `- Medical visits: ${injury.MedicalVisit.length}, timeline events: ${injury.TimelineEvent.length}`,
  );

  return `Summary figures for ${injury.name}:\n${lines.join('\n')}`;
}

export function buildAllInjuryStats(injuries: InjuryRecord[]): string {
  if (injuries.length === 0) {
    return '';
  }

  return injuries.map((injury) => buildInjuryStats(injury)).join('\n\n');
}
