import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import {
  prisma,
  createToken,
  createRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from '../utils.js';

const unauthorized = (message) => {
  const error = new Error(message);
  error.statusCode = 401;

  return error;
};

// One row per rotation. `familyId` is stable across the whole chain that
// descends from a single login, which is what makes reuse detection possible
// below: it identifies every sibling token to revoke.
const issueRefreshToken = async (userId, familyId = crypto.randomUUID()) => {
  const token = createRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(token),
      familyId,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return token;
};

const publicUser = (user) => ({ id: user.id, email: user.email });

// Register new user
export const register = async (email, password, { withRefreshToken = false } = {}) => {
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

  // Registering signs you in. Previously this returned the user alone and the
  // client had to follow up with a login, which burned two of authLimiter's
  // ten requests to do one thing.
  return {
    token: createToken(user.id),
    user: publicUser(user),
    ...(withRefreshToken
      ? { refreshToken: await issueRefreshToken(user.id) }
      : {}),
  };
};

// Login user
export const login = async (email, password, { withRefreshToken = false } = {}) => {
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

  return {
    token: createToken(user.id),
    user: publicUser(user),
    ...(withRefreshToken
      ? { refreshToken: await issueRefreshToken(user.id) }
      : {}),
  };
};

// Whoever the bearer of this access token is. Lets a native client decide on
// cold start whether its stored session is still good without guessing from
// the JWT's own expiry claim, which it cannot verify.
export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });

  return user ?? null;
};

// Exchange a refresh token for a new access token, rotating the refresh token
// in the process: each one is single-use.
export const refreshSession = async (rawToken) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(rawToken) },
  });

  if (!stored) {
    throw unauthorized('Invalid or expired session');
  }

  // A token that was already rotated away is being presented again, so a copy
  // of the chain escaped -- either the legitimate client replayed after we
  // rotated, or an attacker has one. We can't tell which, so both lose: the
  // whole family dies and the real user logs in again.
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    throw unauthorized('Invalid or expired session');
  }

  if (stored.expiresAt <= new Date()) {
    throw unauthorized('Invalid or expired session');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });

  if (!user) {
    throw unauthorized('Invalid or expired session');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return {
    token: createToken(user.id),
    user: publicUser(user),
    refreshToken: await issueRefreshToken(user.id, stored.familyId),
  };
};

// Logout. Unknown or malformed tokens are ignored rather than reported: there
// is nothing useful a caller can do about a failed logout, and answering
// "that token doesn't exist" would confirm which ones do.
export const revokeRefreshTokenFamily = async (rawToken) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(rawToken) },
  });

  if (!stored) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { familyId: stored.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
