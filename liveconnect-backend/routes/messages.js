// routes/messages.js (ESM)
import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { emitToUser } from "../realtime/io.js";

const router = Router();

function normU(u) {
  return String(u || "").trim().toLowerCase();
}

/**
 * POST /messages/send
 * Body: { toUsername? , toUserId?, content }
 */
router.post("/messages/send", requireAuth, async (req, res) => {
  try {
    const { toUsername, toUserId, content } = req.body || {};
    if (!content || (!toUsername && !toUserId)) {
      return res.status(400).json({ ok: false, error: "content i (toUsername ili toUserId) su obavezni" });
    }

    let recipient = null;
    if (toUserId) {
      recipient = await prisma.user.findUnique({ where: { id: Number(toUserId) } });
    } else {
      const username = normU(toUsername);
      recipient = await prisma.user.findUnique({ where: { username } });
    }
    if (!recipient) return res.status(404).json({ ok: false, error: "Primaoc nije pronađen" });
    if (recipient.id === req.userId) return res.status(400).json({ ok: false, error: "Ne možeš slati sebi" });

    const msg = await prisma.message.create({
      data: {
        senderId: req.userId,
        recipientId: recipient.id,
        content: String(content),
      },
      include: {
        sender: { select: { id: true, username: true } },
        recipient: { select: { id: true, username: true } },
      },
    });

    // realtime emit
    emitToUser(recipient.id, "message:new", msg);
    emitToUser(req.userId, "message:new", msg);

    return res.json({ ok: true, message: msg });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Send failed" });
  }
});

/**
 * GET /messages/thread/:username?cursor=123&limit=50
 */
router.get("/messages/thread/:username", requireAuth, async (req, res) => {
  try {
    const otherName = normU(req.params.username);
    const other = await prisma.user.findUnique({ where: { username: otherName } });
    if (!other) return res.status(404).json({ ok: false, error: "Korisnik nije pronađen" });

    const take = Math.min(parseInt(req.query.limit ?? "50", 10), 100);
    const cursorId = req.query.cursor ? Number(req.query.cursor) : null;

    const msgs = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId, recipientId: other.id },
          { senderId: other.id, recipientId: req.userId },
        ],
      },
      orderBy: { id: "desc" },
      take,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      include: {
        sender: { select: { id: true, username: true } },
        recipient: { select: { id: true, username: true } },
      },
    });

    const nextCursor = msgs.length === take ? msgs[msgs.length - 1].id : null;
    return res.json({ ok: true, items: msgs, nextCursor });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Thread load failed" });
  }
});

/**
 * GET /messages/recent?limit=50
 */
router.get("/messages/recent", requireAuth, async (req, res) => {
  try {
    const take = Math.min(parseInt(req.query.limit ?? "50", 10), 100);
    const items = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.userId }, { recipientId: req.userId }],
      },
      orderBy: { id: "desc" },
      take,
      include: {
        sender: { select: { id: true, username: true } },
        recipient: { select: { id: true, username: true } },
      },
    });
    return res.json({ ok: true, items });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Recent load failed" });
  }
});

/**
 * POST /messages/read
 * Body: { fromUsername }
 */
router.post("/messages/read", requireAuth, async (req, res) => {
  try {
    const { fromUsername } = req.body || {};
    if (!fromUsername) return res.status(400).json({ ok: false, error: "fromUsername je obavezan" });

    const other = await prisma.user.findUnique({ where: { username: normU(fromUsername) } });
    if (!other) return res.status(404).json({ ok: false, error: "Korisnik nije pronađen" });

    const result = await prisma.message.updateMany({
      where: {
        senderId: other.id,
        recipientId: req.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return res.json({ ok: true, updated: result.count });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Mark read failed" });
  }
});

export default router;
