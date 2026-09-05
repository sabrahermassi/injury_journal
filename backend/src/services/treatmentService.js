import { prisma } from '../utils.js';
import { findOwnedResource } from './ownership.js';

// Create treatment
export const createTreatment = async (injuryId, userId, treatmentData) => {
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

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
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

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
  const treatment = await findOwnedResource(prisma.treatment, id, {
    injury: {
      userId,
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
  const treatment = await findOwnedResource(prisma.treatment, id, {
    injury: {
      userId,
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
