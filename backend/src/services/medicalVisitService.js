import { prisma, nullOnRecordNotFound } from '../utils.js';

// Every function here carries the ownership predicate inside the statement that
// reads or writes, rather than proving it in a separate findFirst first (issue
// #21). The two-step version was correct only for as long as nothing reassigns
// an injury's owner; this version does not depend on that.

// Create medical visit
// `connect` on the @@unique([id, userId]) rather than a bare injuryId: an
// injury that is not this user's simply does not match, so there is no window
// in which the parent could change hands between the check and the insert.
export const createMedicalVisit = async (injuryId, userId, visitData) =>
  nullOnRecordNotFound(() =>
    prisma.medicalVisit.create({
      data: {
        ...visitData,
        injury: {
          connect: {
            id_userId: { id: injuryId, userId },
          },
        },
      },
    })
  );

// Get visits
export const getMedicalVisits = async (injuryId, userId) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id: injuryId,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  return prisma.medicalVisit.findMany({
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

// Update visit
export const updateMedicalVisit = async (id, userId, visitData) =>
  nullOnRecordNotFound(() =>
    prisma.medicalVisit.update({
      where: {
        id,
        injury: {
          userId,
        },
      },
      data: visitData,
    })
  );

// Delete visit
export const deleteMedicalVisit = async (id, userId) =>
  nullOnRecordNotFound(() =>
    prisma.medicalVisit.delete({
      where: {
        id,
        injury: {
          userId,
        },
      },
    })
  );
