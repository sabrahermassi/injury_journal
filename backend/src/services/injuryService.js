import { prisma, nullOnRecordNotFound } from '../utils.js';
import { findOwnedResource } from './ownership.js';

export const createInjury = async (userId, injuryData) => {
  const injury = await prisma.injury.create({
    data: {
      ...injuryData,
      userId,
    },
  });

  return injury;
};

export const getInjuries = async (userId) => {
  const injuries = await prisma.injury.findMany({
    where: {
      userId,
    },
  });

  return injuries;
};

export const getInjuryById = async (id, userId) => {
  return findOwnedResource(prisma.injury, id, { userId });
};

// `id_userId` is the @@unique([id, userId]) in schema.prisma. Using it rather
// than a separate findFirst means ownership is part of the statement that
// mutates, not a claim proven a moment earlier about a row that could since
// have changed hands (issue #21). No match -> P2025 -> null -> the same 404
// the two-step version returned.
export const updateInjury = async (id, userId, injuryData) =>
  nullOnRecordNotFound(() =>
    prisma.injury.update({
      where: {
        id_userId: { id, userId },
      },
      data: injuryData,
    })
  );

export const deleteInjury = async (id, userId) =>
  nullOnRecordNotFound(() =>
    prisma.injury.delete({
      where: {
        id_userId: { id, userId },
      },
    })
  );
