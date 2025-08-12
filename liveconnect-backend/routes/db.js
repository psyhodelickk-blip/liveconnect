import { Router } from "express";
import { prisma } from "../prismaClient.js";

const router = Router();

router.get("/db/health", async (_req, res) => {
  try {
    // Ne zavisi od tabela – samo testira konekciju
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up", time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({
      ok: false,
      db: "down",
      error: err?.message || "Unknown DB error",
    });
  }
});

export default router;
