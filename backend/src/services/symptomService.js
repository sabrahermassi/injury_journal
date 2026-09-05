import { prisma } from '../utils.js';
import { findOwnedResource } from './ownership.js';

// Create symptom
export const createSymptom = async (injuryId, userId, symptomData) => {
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

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
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

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
  const symptom = await findOwnedResource(prisma.symptom, id, {
    injury: {
      userId,
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
  const symptom = await findOwnedResource(prisma.symptom, id, {
    injury: {
      userId,
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
