import { prisma } from '../../lib/prisma.js';
import type { RetrievedChunk } from '../../rag/citation-builder.js';

// Every record belonging to an injury, chronologically ordered.
//
// Ordering is not cosmetic: the whole point of handing the model a complete
// record is that it can reason about progression ("is this improving?"), and
// it cannot do that reliably from rows in primary-key order.
const injuryInclude = {
  Treatment: {
    orderBy: { date: 'asc' },
    include: { TreatmentOutcome: { orderBy: { recordedAt: 'asc' } } },
  },
  Symptom: { orderBy: { date: 'asc' } },
  TimelineEvent: { orderBy: { date: 'asc' } },
  MedicalVisit: { orderBy: { date: 'asc' } },
} as const;

export async function journalTool(
  injuryId: number,
  userId: number,
  requestId?: string,
) {
  void requestId; // unused for now — reserved for future log correlation (#32)

  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
    include: injuryInclude,
  });

  return injury;
}

// The unscoped counterpart: every injury the user owns. Same `userId` filter,
// so data isolation is identical to the scoped path.
export async function journalToolAll(userId: number, requestId?: string) {
  void requestId; // unused for now — reserved for future log correlation (#32)

  return prisma.injury.findMany({
    where: { userId },
    orderBy: { startDate: 'asc' },
    include: injuryInclude,
  });
}

type InjuryRecord = NonNullable<Awaited<ReturnType<typeof journalTool>>>;

const isoDate = (value: Date): string => value.toISOString().slice(0, 10);

export function formatInjuryRecord(injury: InjuryRecord, requestId?: string): string {
  void requestId; // unused for now — reserved for future log correlation (#32)

  const sections: string[] = [];

  const details = [
    `Name: ${injury.name}`,
    `Body area: ${injury.bodyArea}${injury.side ? ` (${injury.side})` : ''}`,
    `Start date: ${isoDate(injury.startDate)}`,
  ];

  if (injury.cause) details.push(`Cause: ${injury.cause}`);
  if (injury.status) details.push(`Status: ${injury.status}`);
  if (injury.description) details.push(`Description: ${injury.description}`);

  sections.push(`Injury:\n${details.join('\n')}`);

  if (injury.Symptom.length > 0) {
    const symptoms = injury.Symptom.map((symptom) => {
      const parts = [`- ${isoDate(symptom.date)}: pain level ${symptom.painLevel}`];

      if (symptom.location) parts.push(` at ${symptom.location}`);
      if (symptom.trigger) parts.push(`, triggered by ${symptom.trigger}`);
      if (symptom.duration) parts.push(`, lasting ${symptom.duration}`);
      if (symptom.notes) parts.push(` — ${symptom.notes}`);

      return parts.join('');
    }).join('\n');

    sections.push(`Symptoms:\n${symptoms}`);
  }

  if (injury.Treatment.length > 0) {
    const treatments = injury.Treatment.map((treatment) => {
      const parts = [`- ${isoDate(treatment.date)}: ${treatment.name}`];

      if (treatment.provider) parts.push(` (${treatment.provider})`);
      if (treatment.cost !== null) parts.push(`, cost ${treatment.cost}`);
      if (treatment.courseId) parts.push(`, part of course "${treatment.courseId}"`);
      if (treatment.outcome) parts.push(` — outcome: ${treatment.outcome}`);

      // Check-ins recorded after the fact. These are the only structured
      // evidence of whether a treatment actually worked; the free-text
      // `outcome` above is a single overwritable impression.
      for (const checkIn of treatment.TreatmentOutcome) {
        const checkInParts = [`\n    - check-in ${isoDate(checkIn.recordedAt)}: ${checkIn.status}`];

        if (checkIn.reliefDays !== null) {
          checkInParts.push(`, ${checkIn.reliefDays} days of relief`);
        }

        if (checkIn.painLevel !== null) {
          checkInParts.push(`, pain level ${checkIn.painLevel}`);
        }

        if (checkIn.notes) checkInParts.push(` — ${checkIn.notes}`);

        parts.push(checkInParts.join(''));
      }

      return parts.join('');
    }).join('\n');

    sections.push(`Treatments:\n${treatments}`);
  }

  if (injury.TimelineEvent.length > 0) {
    const events = injury.TimelineEvent.map(
      (event) =>
        `- ${isoDate(event.date)}: ${event.type} — ${event.description}${event.result ? ` (${event.result})` : ''}`,
    ).join('\n');

    sections.push(`Timeline events:\n${events}`);
  }

  if (injury.MedicalVisit.length > 0) {
    const visits = injury.MedicalVisit.map(
      (visit) =>
        `- ${isoDate(visit.date)}${visit.doctor ? `: ${visit.doctor}` : ''}${visit.clinic ? ` at ${visit.clinic}` : ''}${visit.notes ? ` — ${visit.notes}` : ''}`,
    ).join('\n');

    sections.push(`Medical visits:\n${visits}`);
  }

  return sections.join('\n\n');
}

// Several injuries in one context, each under its own heading so the model can
// tell them apart -- two lower-back injuries are a real case, not a hypothetical.
export function formatInjuryRecords(
  injuries: InjuryRecord[],
  requestId?: string,
): string {
  return injuries
    .map((injury) => `=== ${injury.name} (injury #${injury.id}) ===\n${formatInjuryRecord(injury, requestId)}`)
    .join('\n\n');
}

// The records that went into the context, in the shape `buildCitations`
// already consumes. `sourceType` values match those written by
// ingestion/documents/document-builder.ts so citations from this path are
// indistinguishable from retrieval-path ones downstream.
//
// An injury is its own source with `sourceId === injuryId`; citation-verifier.ts
// relies on that.
export function collectRecordSources(injury: InjuryRecord): RetrievedChunk[] {
  const sources: RetrievedChunk[] = [
    {
      sourceType: 'injury',
      sourceId: injury.id,
      injuryId: injury.id,
      metadata: { date: isoDate(injury.startDate) },
    },
  ];

  for (const symptom of injury.Symptom) {
    sources.push({
      sourceType: 'symptom',
      sourceId: symptom.id,
      injuryId: injury.id,
      metadata: { date: isoDate(symptom.date) },
    });
  }

  for (const treatment of injury.Treatment) {
    sources.push({
      sourceType: 'treatment',
      sourceId: treatment.id,
      injuryId: injury.id,
      metadata: { date: isoDate(treatment.date) },
    });
  }

  for (const event of injury.TimelineEvent) {
    sources.push({
      sourceType: 'timeline_event',
      sourceId: event.id,
      injuryId: injury.id,
      metadata: { date: isoDate(event.date) },
    });
  }

  for (const visit of injury.MedicalVisit) {
    sources.push({
      sourceType: 'medical_visit',
      sourceId: visit.id,
      injuryId: injury.id,
      metadata: { date: isoDate(visit.date) },
    });
  }

  return sources;
}

// Deliberately a heuristic, not a tokenizer. It only has to decide whether the
// journal is small enough to hand over whole, and the budget it feeds
// (CONTEXT_TOKEN_BUDGET) sits far enough below the model's real limit to absorb
// the error. Adding a tokenizer dependency to answer a yes/no question this
// coarse would not be worth it.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
