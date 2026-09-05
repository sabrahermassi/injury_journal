import { prisma, nullOnRecordNotFound, flattenInjuryName } from '../utils.js';
import { ICONS, CATEGORIES } from '../entryIcons.js';

// Every function here carries the ownership predicate inside the statement that
// reads or writes, rather than proving it in a separate findFirst first (issue
// #21). The two-step version was correct only for as long as nothing reassigns
// an injury's owner; this version does not depend on that.

// Every symptom the user has, across all their injuries, in one query.
//
// This exists because the frontend used to ask per injury: an account with ten
// injuries spent ten requests drawing one chart, and between the pages that do
// that the 100-request rate limit was exhausted before the dashboard had
// finished loading. Ownership is enforced by the `injury: { userId }` filter,
// which is the same relation check every other function here makes.
export const getAllSymptomsForUser = async (userId) => {
  const symptoms = await prisma.symptom.findMany({
    where: {
      injury: {
        userId,
      },
    },
    orderBy: {
      date: 'asc',
    },
    include: {
      injury: {
        select: {
          name: true,
        },
      },
    },
  });

  // Every symptom is a symptom, so this needs no lookup -- what matters is
  // that the field is present and identical on all of them.
  return symptoms.map((symptom) => ({
    ...flattenInjuryName(symptom),
    icon: ICONS.SYMPTOM,
    category: CATEGORIES.SYMPTOM,
  }));
};

// Create symptom
//
// `connect` on the @@unique([id, userId]) rather than a bare injuryId: an
// injury that is not this user's simply does not match, so there is no window
// in which the parent could change hands between the check and the insert.
export const createSymptom = async (injuryId, userId, symptomData) =>
  nullOnRecordNotFound(() =>
    prisma.symptom.create({
      data: {
        ...symptomData,
        injury: {
          connect: {
            id_userId: { id: injuryId, userId },
          },
        },
      },
    })
  );

// Get symptoms for injury
//
// This one keeps two queries. The contract distinguishes `null` (no such
// injury, or not yours -> 404) from `[]` (yours, but nothing recorded -> 200),
// and a single findMany cannot tell those apart -- it returns `[]` for both.
// The ownership filter still goes on the read, so if the injury did change
// hands mid-request the answer is an empty list rather than another user's
// symptoms.
export const getSymptoms = async (injuryId, userId) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  return prisma.symptom.findMany({
    where: {
      injuryId,
      injury: {
        userId,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
};

// Update symptom
export const updateSymptom = async (id, userId, symptomData) =>
  nullOnRecordNotFound(() =>
    prisma.symptom.update({
      where: {
        id,
        injury: {
          userId,
        },
      },
      data: symptomData,
    })
  );

// Delete symptom
export const deleteSymptom = async (id, userId) =>
  nullOnRecordNotFound(() =>
    prisma.symptom.delete({
      where: {
        id,
        injury: {
          userId,
        },
      },
    })
  );
