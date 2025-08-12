// ESM Prisma singleton (sprečava više instanci u dev-u)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.__lc_prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__lc_prisma = prisma;
}
