import { prisma, nullOnRecordNotFound } from '../utils.js';
import { findOwnedResource } from './ownership.js';

// Outcomes are append-only observations against a treatment — see the
// TreatmentOutcome model comment in schema.prisma. There is deliberately no
// update here; a wrong observation gets deleted and re-logged, not edited.
//
// Create/delete carry the ownership predicate inside the statement that
// writes, rather than proving it in a separate findFirst first (issue #21).
// getTreatmentOutcomes below still does a real two-step check-then-list, and
// shares that shape via ownership.js (issue #18). Ownership is two relations
// up: outcome -> treatment -> injury.userId.

// Create treatment outcome
//
// Treatment has no @@unique([id, userId]) the way Injury does, so `connect`
// matches on the id plus the relation filter rather than a compound key. Same
// effect: a treatment that is not this user's does not match, and P2025 becomes
// the null the controller turns into a 404.
export const createTreatmentOutcome = async (treatmentId, userId, outcomeData) =>
  nullOnRecordNotFound(() =>
    prisma.treatmentOutcome.create({
      data: {
        ...outcomeData,
        treatment: {
          connect: {
            id: treatmentId,
            injury: {
              userId,
            },
          },
        },
      },
    })
  );

// Get treatment outcomes
//
// This one keeps two queries. The contract distinguishes `null` (no such
// treatment, or not yours -> 404) from `[]` (yours, but nothing recorded ->
// 200), and a single findMany cannot tell those apart -- it returns `[]` for
// both. The ownership filter still goes on the read, so if the treatment did
// change hands mid-request the answer is an empty list rather than another
// user's outcomes.
export const getTreatmentOutcomes = async (treatmentId, userId) => {
  const treatment = await findOwnedResource(prisma.treatment, treatmentId, {
    injury: {
      userId,
    },
  });

  if (!treatment) {
    return null;
  }

  return prisma.treatmentOutcome.findMany({
    where: {
      treatmentId,
      treatment: {
        injury: {
          userId,
        },
      },
    },
    orderBy: {
      recordedAt: 'asc',
    },
  });
};

// Delete treatment outcome
export const deleteTreatmentOutcome = async (id, userId) =>
  nullOnRecordNotFound(() =>
    prisma.treatmentOutcome.delete({
      where: {
        id,
        treatment: {
          injury: {
            userId,
          },
        },
      },
    })
  );
