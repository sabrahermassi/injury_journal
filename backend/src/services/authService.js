import bcrypt from 'bcrypt';
import { prisma, createToken } from '../utils.js';

// Register new user
export const register = async (email, password) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
    },
  });

  return {
    id: user.id,
    email: user.email,
  };
};

// Delete the account and everything hanging off it.
//
// One transaction, children first: only TreatmentOutcome (from Treatment) and
// DocumentChunk (from Injury) cascade in the schema — the rest hold plain
// foreign keys and would block the parent delete. A half-deleted account is
// worse than a failed one, so this is all-or-nothing.
export const deleteAccount = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return null;
  }

  const belongingToUser = {
    injury: {
      userId,
    },
  };

  await prisma.$transaction([
    prisma.symptom.deleteMany({ where: belongingToUser }),
    prisma.medicalVisit.deleteMany({ where: belongingToUser }),
    prisma.timelineEvent.deleteMany({ where: belongingToUser }),
    prisma.treatment.deleteMany({ where: belongingToUser }),
    prisma.injury.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return {
    id: user.id,
    email: user.email,
  };
};

// Login user
export const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const passwordCorrect = await bcrypt.compare(password, user.password);

  if (!passwordCorrect) {
    throw new Error('Invalid email or password');
  }

  const token = createToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};
