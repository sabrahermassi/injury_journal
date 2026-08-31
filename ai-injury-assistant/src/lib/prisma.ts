// Must come first: it resolves DATABASE_URL from this service's .env and the
// repo-root .env.shared before PrismaClient is constructed below.
import '../config/load-env.js';

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
