import { prisma, nullOnRecordNotFound } from '../utils.js';
import { findOwnedResource } from './ownership.js';

// Create/update/delete carry the ownership predicate inside the statement that
// writes, rather than proving it in a separate findFirst first (issue #21).
// The reads below still do a real two-step check-then-list, and share that
// shape via ownership.js (issue #18) -- there's no mutation to race against.

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
  const injury = await findOwnedResource(prisma.injury, injuryId, { userId });

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
