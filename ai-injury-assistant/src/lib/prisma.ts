// Must come first: it resolves DATABASE_URL from the repo-root .env before
// PrismaClient is constructed below.
import '../config/load-env.js';

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
