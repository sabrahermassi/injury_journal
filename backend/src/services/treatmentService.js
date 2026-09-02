import { prisma, flattenInjuryName } from '../utils.js';

// Every treatment the user has, each with its outcome check-ins attached.
//
// The outcomes come along deliberately: the insights page needs them, and
// fetching them separately cost one request per treatment on top of one per
// injury -- 37 requests for this account before the page could render. See the
// note on getAllSymptomsForUser.
export const getAllTreatmentsForUser = async (userId) => {
  const treatments = await prisma.treatment.findMany({
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
      outcomes: {
        orderBy: {
          recordedAt: 'asc',
        },
      },
    },
  });

  return treatments.map(flattenInjuryName);
};

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
