import bcrypt from "bcrypt";
import { prisma, createToken } from "../utils.js";

// Register new user
export const register = async (email, password) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash
    }
  });

  return {
    id: user.id,
    email: user.email
  };
};

// Login user
export const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordCorrect) {
    throw new Error("Invalid email or password");
  }

  const token = createToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email
    }
  };
};