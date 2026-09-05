import { prisma } from '../utils.js';

/**
 * Turns one AI extraction into real journal records.
 *
 * The extractor keeps its own DynamoDB table and nothing ever crossed from it
 * into the journal — "Accept summary" in the design had no destination. This
 * is that destination.
 *
 * The mapping is deliberately conservative, because the source is a model's
 * reading of free text and everything it writes here is health data the user
 * will later show a clinician:
 *
 *  - The extraction's `injuryName`/`bodyArea` either open a new injury or file
 *    against one the user picked. Nothing is merged into an existing injury by
 *    name-matching — that guess is the user's to make, not ours.
 *  - Each extracted symptom becomes a Symptom row, but only when the
 *    extraction carried a pain level. `Symptom.painLevel` is a required Int,
 *    and inventing a number to satisfy the column would put a figure in the
 *    record that nobody reported.
 *  - A TimelineEvent is always written, holding the original note. It is the
 *    provenance for everything else here: without it there is no way to tell
 *    a typed entry from a model's paraphrase of a clinical letter.
 *
 * All of it in one transaction — a half-accepted summary would leave the user
 * unable to tell what landed.
 */
export const acceptExtraction = async (userId, payload) => {
  const {
    injuryId,
    injuryName,
    bodyArea,
    painLevel,
    symptoms = [],
    possibleCauses = [],
    note,
  } = payload;

  const now = new Date();
  const cause = possibleCauses.length > 0 ? possibleCauses.join('; ') : null;

  if (injuryId !== undefined) {
    const existing = await prisma.injury.findFirst({
      where: {
        id: injuryId,
        userId,
      },
    });

    // Same convention as every other nested write: unknown and not-yours are
    // the same answer, so ownership never leaks through a 404.
    if (!existing) {
      return null;
    }
  }

  return prisma.$transaction(async (tx) => {
    const injury =
      injuryId !== undefined
        ? await tx.injury.findUnique({ where: { id: injuryId } })
        : await tx.injury.create({
          data: {
            userId,
            name: injuryName,
            bodyArea,
            startDate: now,
            cause,
          },
        });

    const createdSymptoms =
      painLevel === undefined || painLevel === null
        ? []
        : await Promise.all(
          symptoms.map((text) =>
            tx.symptom.create({
              data: {
                injuryId: injury.id,
                date: now,
                painLevel,
                location: bodyArea,
                notes: text,
              },
            })
          )
        );

    const summary = symptoms.length > 0 ? symptoms.join('; ') : bodyArea;

    const event = await tx.timelineEvent.create({
      data: {
        injuryId: injury.id,
        type: 'extraction',
        date: now,
        // The note is what makes this auditable later; fall back to the
        // extracted summary when the caller did not send the original text.
        description: note ? note.slice(0, 2000) : summary,
        result: `Accepted from the AI extractor${
          createdSymptoms.length > 0
            ? ` · ${createdSymptoms.length} symptom${createdSymptoms.length === 1 ? '' : 's'} recorded`
            : ' · no pain level given, so no symptom rows were created'
        }`,
      },
    });

    return {
      injury,
      symptoms: createdSymptoms,
      event,
    };
  });
};
