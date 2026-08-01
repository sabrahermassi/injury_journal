import { prisma } from '../utils.js';

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
