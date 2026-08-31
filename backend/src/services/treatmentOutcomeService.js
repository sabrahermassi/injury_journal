import { prisma } from '../utils.js';

// Outcomes are append-only observations against a treatment — see the
// TreatmentOutcome model comment in schema.prisma. There is deliberately no
// update here; a wrong observation gets deleted and re-logged, not edited.

// Create treatment outcome
export const createTreatmentOutcome = async (treatmentId, userId, outcomeData) => {
  const treatment = await prisma.treatment.findFirst({
    where: {
      id: treatmentId,
      injury: {
        userId,
      },
    },
  });

  if (!treatment) {
    return null;
  }

  return prisma.treatmentOutcome.create({
    data: {
      ...outcomeData,
      treatmentId,
    },
  });
};

// Get treatment outcomes
export const getTreatmentOutcomes = async (treatmentId, userId) => {
  const treatment = await prisma.treatment.findFirst({
    where: {
      id: treatmentId,
      injury: {
        userId,
      },
    },
  });

  if (!treatment) {
    return null;
  }

  return prisma.treatmentOutcome.findMany({
    where: {
      treatmentId,
    },
    orderBy: {
      recordedAt: 'asc',
    },
  });
};

// Delete treatment outcome
export const deleteTreatmentOutcome = async (id, userId) => {
  const outcome = await prisma.treatmentOutcome.findFirst({
    where: {
      id,
      treatment: {
        injury: {
          userId,
        },
      },
    },
  });

  if (!outcome) {
    return null;
  }

  return prisma.treatmentOutcome.delete({
    where: {
      id,
    },
  });
};
