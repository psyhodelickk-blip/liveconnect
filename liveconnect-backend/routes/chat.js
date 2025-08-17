import { Router } from "express";
import prisma from "../prismaClient.js";
import online from "../realtime/online.js";

const router = Router();

// istorija
router.get("/history", async (req, res) => {
  try {
    const room = (req.query.room || "lobby").toString();
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const rows = await prisma.message.findMany({
      where: { room },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, username: true, name: true } } },
    });
    const items = rows.reverse().map((m) => ({
      id: m.id, room: m.room, text: m.text, ts: m.createdAt,
      user: m.user ? { id: m.user.id, username: m.user.username, name: m.user.name ?? m.user.username }
                   : { id: null, username: "anon", name: "anon" },
    }));
    res.json({ ok: true, room, items });
  } catch (e) {
    console.error("GET /chat/history error:", e);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

// ko je online
router.get("/users-online", (_req, res) => {
  res.json({ ok: true, items: online.list() });
});

export default router;
