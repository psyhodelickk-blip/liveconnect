// liveconnect-backend/prismaClient.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["warn", "error"], // po želji: dodaj "query" u dev-u
});

// (opciono) uredno gasi konekciju kad se proces završava
process.on("beforeExit", async () => {
  try { await prisma.$disconnect(); } catch {}
});

export default prisma;
