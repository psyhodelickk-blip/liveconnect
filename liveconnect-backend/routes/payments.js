// liveconnect-backend/routes/payments.js
import express from "express";
import prisma from "../prismaClient.js";
import { getIO } from "../realtime/io.js";

const router = express.Router();

// Test ping
router.get("/ping", (_req, res) => res.json({ ok: true, scope: "payments" }));

// Primer: napuni +100 coins current user-u (dev)
router.post("/dev/credit100", async (req, res) => {
  try {
    const userId = Number(req.body?.userId);
    if (!userId) return res.status(400).json({ ok: false, error: "userId je obavezan" });

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: { balance: { increment: 100 } },
      create: { userId, balance: 100 },
    });

    // emituj event (ako treba)
    try { getIO().to(`user:${userId}`).emit("wallet:update", { balance: wallet.balance }); } catch {}

    return res.json({ ok: true, wallet });
  } catch (e) {
    console.error("credit100 error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
