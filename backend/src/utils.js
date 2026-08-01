import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const createToken = (userId) => {
  return jwt.sign(
    {
      userId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );
};


export const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};