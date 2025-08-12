// routes/payments.js
import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { emitToUser } from "../realtime/io.js";

const router = Router();
const norm = (s) => String(s || "").trim().toLowerCase();

async function ensureWallet(userId) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}

async function getBalance(userId) {
  const w = await ensureWallet(userId);
  return w.balance;
}

async function debitWalletAtomic(userId, amount) {
  const rows = await prisma.$queryRaw`
    UPDATE "Wallet"
    SET "balance" = "balance" - ${amount}
    WHERE "userId" = ${userId} AND "balance" >= ${amount}
    RETURNING "balance";
  `;
  if (!rows || rows.length === 0) {
    const b = await getBalance(userId);
    throw new Error(`Insufficient balance (${b})`);
  }
  return rows[0].balance;
}

router.get("/coins/balance", requireAuth, async (req, res) => {
  try {
    const balance = await getBalance(req.userId);
    res.json({ ok: true, balance });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Balance failed" });
  }
});

router.post("/coins/purchase", requireAuth, async (req, res) => {
  try {
    const amount = Math.max(0, parseInt(req.body?.amount ?? 0, 10));
    const reference = req.body?.reference || null;
    if (!amount) return res.status(400).json({ ok: false, error: "amount > 0" });

    await ensureWallet(req.userId);

    const result = await prisma.$transaction(async (txp) => {
      const w = await txp.wallet.update({
        where: { userId: req.userId },
        data: { balance: { increment: amount } },
      });
      const tx = await txp.coinTransaction.create({
        data: { userId: req.userId, type: "PURCHASE", amount, reference, metadata: { source: "dev" } },
      });
      return { w, tx };
    });

    emitToUser(req.userId, "wallet:update", { balance: result.w.balance });
    res.json({ ok: true, balance: result.w.balance, txId: result.tx.id });
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.message || "Purchase failed" });
  }
});

router.post("/coins/tip", requireAuth, async (req, res) => {
  try {
    const toUsername = norm(req.body?.toUsername);
    const amount = Math.max(0, parseInt(req.body?.amount ?? 0, 10));
    const reference = req.body?.reference || null;
    const message = String(req.body?.message || "");
    if (!toUsername || !amount) return res.status(400).json({ ok: false, error: "toUsername i amount su obavezni" });

    const to = await prisma.user.findUnique({ where: { username: toUsername } });
    if (!to) return res.status(404).json({ ok: false, error: "Primaoc nije pronađen" });
    if (to.id === req.userId) return res.status(400).json({ ok: false, error: "Ne možeš tip sebi" });

    await ensureWallet(req.userId);

    const result = await prisma.$transaction(async (txp) => {
      await debitWalletAtomic(req.userId, amount);
      const tx = await txp.coinTransaction.create({
        data: { userId: req.userId, type: "TIP", amount: -amount, reference, metadata: { toUserId: to.id, message } },
      });
      const w = await txp.wallet.findUnique({ where: { userId: req.userId } });
      return { balance: w?.balance ?? 0, txId: tx.id };
    });

    emitToUser(req.userId, "wallet:update", { balance: result.balance });
    res.json({ ok: true, balance: result.balance, txId: result.txId });
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.message || "Tip failed" });
  }
});

router.get("/gifts", requireAuth, async (_req, res) => {
  try {
    const items = await prisma.giftCatalog.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    res.json({ ok: true, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Gifts load failed" });
  }
});

router.post("/gifts/send", requireAuth, async (req, res) => {
  try {
    const toUsername = norm(req.body?.toUsername);
    const code = norm(req.body?.code);
    const reference = req.body?.reference || null;
    const message = String(req.body?.message || "");
    if (!toUsername || !code) return res.status(400).json({ ok: false, error: "toUsername i code su obavezni" });

    const [to, gift] = await Promise.all([
      prisma.user.findUnique({ where: { username: toUsername } }),
      prisma.giftCatalog.findUnique({ where: { code } }),
    ]);
    if (!to) return res.status(404).json({ ok: false, error: "Primaoc nije pronađen" });
    if (!gift || !gift.isActive) return res.status(404).json({ ok: false, error: "Gift nije dostupan" });
    if (to.id === req.userId) return res.status(400).json({ ok: false, error: "Ne možeš slati sebi" });

    await ensureWallet(req.userId);

    const result = await prisma.$transaction(async (txp) => {
      await debitWalletAtomic(req.userId, gift.price);

      const tx = await txp.coinTransaction.create({
        data: { userId: req.userId, type: "GIFT", amount: -gift.price, reference, metadata: { toUserId: to.id, code } },
      });

      const evt = await txp.giftEvent.create({
        data: { fromUserId: req.userId, toUserId: to.id, giftId: gift.id, message, coins: gift.price },
      });

      const w = await txp.wallet.findUnique({ where: { userId: req.userId } });
      return { balance: w?.balance ?? 0, txId: tx.id, eventId: evt.id };
    });

    emitToUser(req.userId, "wallet:update", { balance: result.balance });
    // ✨ PRIMALAC dobija realtime obaveštenje
    emitToUser(to.id, "gift:received", {
      fromUserId: req.userId,
      toUserId: to.id,
      code: gift.code,
      name: gift.name,
      price: gift.price,
      iconUrl: gift.iconUrl,
      message,
      createdAt: new Date().toISOString(),
    });

    res.json({ ok: true, balance: result.balance, txId: result.txId, eventId: result.eventId });
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.message || "Gift failed" });
  }
});

export default router;
