// routes/messages.js
import { Router } from "express";
import prisma from "../prismaClient.js";
import requireAuth from "./requireAuth.js"; // <-- bitno: ./ (u istom folderu)

const router = Router();

// Lista potencijalnih sagovornika (svi osim mene)
router.get("/users", requireAuth, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.userId } },
      select: { id: true, username: true },
    });
    res.json({ ok: true, users });
  } catch (err) {
    next(err);
  }
});

// Poruke između mene i drugog korisnika
router.get("/thread/:withUserId", requireAuth, async (req, res, next) => {
  try {
    const me = req.userId;
    const other = Number(req.params.withUserId);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: me, toUserId: other },
          { fromUserId: other, toUserId: me },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ ok: true, messages });
  } catch (err) {
    next(err);
  }
});

// Slanje poruke
router.post("/send", requireAuth, async (req, res, next) => {
  try {
    const me = req.userId;
    const { toUserId, content } = req.body ?? {};
    if (!toUserId || !content) {
      return res.status(400).json({ ok: false, error: "MISSING_FIELDS" });
    }
    const created = await prisma.message.create({
      data: { fromUserId: me, toUserId: Number(toUserId), content },
    });
    res.json({ ok: true, message: created });
  } catch (err) {
    next(err);
  }
});

export default router;
