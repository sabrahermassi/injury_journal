import { prisma, nullOnRecordNotFound } from '../utils.js';

// Every function here carries the ownership predicate inside the statement that
// reads or writes, rather than proving it in a separate findFirst first (issue
// #21). The two-step version was correct only for as long as nothing reassigns
// an injury's owner; this version does not depend on that.

// Create treatment
// `connect` on the @@unique([id, userId]) rather than a bare injuryId: an
// injury that is not this user's simply does not match, so there is no window
// in which the parent could change hands between the check and the insert.
export const createTreatment = async (injuryId, userId, treatmentData) =>
  nullOnRecordNotFound(() =>
    prisma.treatment.create({
      data: {
        ...treatmentData,
        injury: {
          connect: {
            id_userId: { id: injuryId, userId },
          },
        },
      },
    })
  );

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
      injury: {
        userId,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
};

// Update treatment
export const updateTreatment = async (id, userId, treatmentData) =>
  nullOnRecordNotFound(() =>
    prisma.treatment.update({
      where: {
        id,
        injury: {
          userId,
        },
      },
      data: treatmentData,
    })
  );

// Delete treatment
export const deleteTreatment = async (id, userId) =>
  nullOnRecordNotFound(() =>
    prisma.treatment.delete({
      where: {
        id,
        injury: {
          userId,
        },
      },
    })
  );
