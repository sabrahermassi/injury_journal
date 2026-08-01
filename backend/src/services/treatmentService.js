import { prisma } from '../utils.js';

// Create treatment
export const createTreatment = async (injuryId, userId, treatmentData) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  return prisma.treatment.create({
    data: {
      ...treatmentData,
      injuryId,
    },
  });
};

// Get treatments
export const getTreatments = async (injuryId, userId) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  return prisma.treatment.findMany({
    where: {
      injuryId,
    },
    orderBy: {
      date: 'asc',
    },
  });
};

// Update treatment
export const updateTreatment = async (id, userId, treatmentData) => {
  const treatment = await prisma.treatment.findFirst({
    where: {
      id,
      injury: {
        userId,
      },
    },
  });

  if (!treatment) {
    return null;
  }

  return prisma.treatment.update({
    where: {
      id,
    },
    data: treatmentData,
  });
};

// Delete treatment
export const deleteTreatment = async (id, userId) => {
  const treatment = await prisma.treatment.findFirst({
    where: {
      id,
      injury: {
        userId,
      },
    },
  });

  if (!treatment) {
    return null;
  }

  return prisma.treatment.delete({
    where: {
      id,
    },
  });
};
