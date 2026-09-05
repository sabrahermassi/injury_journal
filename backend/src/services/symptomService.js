import { prisma, flattenInjuryName } from '../utils.js';
import { ICONS, CATEGORIES } from '../entryIcons.js';

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
export const createSymptom = async (injuryId, userId, symptomData) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  const symptom = await prisma.symptom.create({
    data: {
      ...symptomData,
      injuryId,
    },
  });

  return symptom;
};

// Get symptoms for injury
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
    },
    orderBy: {
      date: 'asc',
    },
  });
};

// Update symptom
export const updateSymptom = async (id, userId, symptomData) => {
  const symptom = await prisma.symptom.findFirst({
    where: {
      id,
      injury: {
        userId,
      },
    },
  });

  if (!symptom) {
    return null;
  }

  return prisma.symptom.update({
    where: {
      id,
    },
    data: symptomData,
  });
};

// Delete symptom
export const deleteSymptom = async (id, userId) => {
  const symptom = await prisma.symptom.findFirst({
    where: {
      id,
      injury: {
        userId,
      },
    },
  });

  if (!symptom) {
    return null;
  }

  return prisma.symptom.delete({
    where: {
      id,
    },
  });
};
