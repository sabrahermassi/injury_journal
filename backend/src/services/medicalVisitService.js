import { prisma } from '../utils.js';
import { findOwnedResource } from './ownership.js';

// Create medical visit
export const createMedicalVisit = async (injuryId, userId, visitData) => {
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

  if (!injury) {
    return null;
  }

  return prisma.medicalVisit.create({
    data: {
      ...visitData,
      injuryId,
    },
  });
};

// Get visits
export const getMedicalVisits = async (injuryId, userId) => {
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

  if (!injury) {
    return null;
  }

  return prisma.medicalVisit.findMany({
    where: {
      injuryId,
    },
    orderBy: {
      date: 'asc',
    },
  });
};

// Update visit
export const updateMedicalVisit = async (id, userId, visitData) => {
  const visit = await findOwnedResource(prisma.medicalVisit, id, {
    injury: {
      userId,
    },
  });

  if (!visit) {
    return null;
  }

  return prisma.medicalVisit.update({
    where: {
      id,
    },
    data: visitData,
  });
};

// Delete visit
export const deleteMedicalVisit = async (id, userId) => {
  const visit = await findOwnedResource(prisma.medicalVisit, id, {
    injury: {
      userId,
    },
  });

  if (!visit) {
    return null;
  }

  return prisma.medicalVisit.delete({
    where: {
      id,
    },
  });
};
