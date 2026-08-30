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

const isProduction = process.env.NODE_ENV === 'production';

// Frontend and backend are deployed on different domains in production
// (Vercel / Render), so the cookie must be sent cross-site: SameSite=None
// requires Secure. Locally both run on `localhost` (same site, different
// port), where Lax already works and doesn't require HTTPS.
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h, matches JWT expiresIn

export const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: TOKEN_TTL_MS,
};

// Double-submit CSRF token cookie: readable by frontend JS (unlike the auth
// cookie) so it can be echoed back as the X-CSRF-Token header on mutating
// requests. Needed once the auth cookie uses SameSite=None in production,
// which no longer blocks cross-site requests on its own.
export const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: TOKEN_TTL_MS,
};