// routes/messages.js
import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
const norm = (s) => String(s || "").trim().toLowerCase();

router.post("/messages/send", requireAuth, async (req, res) => {
  try {
    const toUsername = norm(req.body?.to);
    const content = String(req.body?.content || "").trim();
    if (!toUsername || !content) {
      return res.status(400).json({ ok: false, error: "to i content su obavezni" });
    }

    const to = await prisma.user.findUnique({ where: { username: toUsername } });
    if (!to) return res.status(404).json({ ok: false, error: "primaoc ne postoji" });
    if (to.id === req.userId) return res.status(400).json({ ok: false, error: "ne možeš poslati sebi" });

    const msg = await prisma.message.create({
      data: { senderId: req.userId, recipientId: to.id, content },
    });

    // Socket emit (ako imaš realtime/io.js sa emitToUser)
    try {
      const { emitToUser } = await import("../realtime/io.js");
      emitToUser?.(to.id, "messages:new", {
        id: msg.id,
        fromUserId: req.userId,
        toUserId: to.id,
        content,
        createdAt: msg.createdAt,
      });
    } catch (_) {}

    return res.json({
      ok: true,
      message: {
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content,
        createdAt: msg.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "send failed" });
  }
});

// Sažetak konverzacija (recent)
router.get("/messages/recent", requireAuth, async (req, res) => {
  try {
    // Nadji sve peer-ove sa kojima je korisnik razmenio poruke ili giftove
    const userId = req.userId;

    const lastMsgs = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const lastGifts = await prisma.giftEvent.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      include: { from: { select: { id: true, username: true } }, to: { select: { id: true, username: true } }, gift: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // grupišemo po peeru i uzimamo najskoriji item (msg ili gift)
    const map = new Map(); // key = peerId
    function pushCandidate(peerId, peerUsername, item) {
      const prev = map.get(peerId);
      if (!prev || new Date(item.createdAt) > new Date(prev.createdAt)) {
        map.set(peerId, { peer: { id: peerId, username: peerUsername }, last: item });
      }
    }

    for (const m of lastMsgs) {
      const peerId = m.senderId === userId ? m.recipientId : m.senderId;
      const peer = await prisma.user.findUnique({ where: { id: peerId }, select: { username: true } });
      pushCandidate(peerId, peer?.username || "", { kind: "msg", id: `m-${m.id}`, content: m.content, createdAt: m.createdAt });
    }

    for (const g of lastGifts) {
      const peerId = g.fromUserId === userId ? g.toUserId : g.fromUserId;
      const peerUsername = g.fromUserId === userId ? g.to.username : g.from.username;
      pushCandidate(peerId, peerUsername || "", {
        kind: "gift",
        id: `g-${g.id}`,
        createdAt: g.createdAt,
        code: g.gift.code, name: g.gift.name, price: g.gift.price,
        fromUserId: g.fromUserId, toUserId: g.toUserId,
      });
    }

    const threads = Array.from(map.values()).sort((a, b) => new Date(b.last.createdAt) - new Date(a.last.createdAt));
    return res.json({ ok: true, threads });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "recent failed" });
  }
});

// Jedna nit: PORUKE + GIFT-ovi u istom vremenskom nizu
router.get("/messages/thread", requireAuth, async (req, res) => {
  try {
    const peerUsername = norm(req.query?.peer);
    if (!peerUsername) return res.status(400).json({ ok: false, error: "peer je obavezan" });

    const peer = await prisma.user.findUnique({ where: { username: peerUsername } });
    if (!peer) return res.status(404).json({ ok: false, error: "peer nije pronađen" });

    const [msgs, gifts] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: req.userId, recipientId: peer.id },
            { senderId: peer.id, recipientId: req.userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
      prisma.giftEvent.findMany({
        where: {
          OR: [
            { fromUserId: req.userId, toUserId: peer.id },
            { fromUserId: peer.id, toUserId: req.userId },
          ],
        },
        include: { gift: true },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
    ]);

    const timeline = [
      ...msgs.map(m => ({
        kind: "msg",
        id: `m-${m.id}`,
        createdAt: m.createdAt,
        senderId: m.senderId,
        content: m.content,
      })),
      ...gifts.map(g => ({
        kind: "gift",
        id: `g-${g.id}`,
        createdAt: g.createdAt,
        fromUserId: g.fromUserId,
        toUserId: g.toUserId,
        coins: g.coins,
        message: g.message || "",
        gift: { code: g.gift.code, name: g.gift.name, price: g.gift.price, iconUrl: g.gift.iconUrl },
      })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.json({ ok: true, items: timeline });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "thread failed" });
  }
});

export default router;
