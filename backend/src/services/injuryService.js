import { prisma } from '../utils.js';

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
  const injury = await prisma.injury.findFirst({
    where: {
      id,
      userId,
    },
  });

  return injury;
};

export const updateInjury = async (id, userId, injuryData) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  const updatedInjury = await prisma.injury.update({
    where: {
      id,
    },
    data: injuryData,
  });

  return updatedInjury;
};

export const deleteInjury = async (id, userId) => {
  const injury = await prisma.injury.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!injury) {
    return null;
  }

  const deletedInjury = await prisma.injury.delete({
    where: {
      id,
    },
  });

  return deletedInjury;
};
