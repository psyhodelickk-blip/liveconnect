import express from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/payments/send
 * body: { receiverId: number, amount: number }  // amount in decimal (e.g. 1.50)
 * We treat money in cents to avoid float issues.
 * Fee: 10% platform fee
 */
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, amount } = req.body;
    if (!receiverId || !amount) return res.status(400).json({ message: 'Nedostaju podaci' });

    // convert to cents integer
    const amountCents = Math.round(Number(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return res.status(400).json({ message: 'Neispravan iznos' });

    // load users
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await prisma.user.findUnique({ where: { id: Number(receiverId) } });
    if (!sender || !receiver) return res.status(404).json({ message: 'Korisnik nije pronađen' });

    if (sender.balanceCents < amountCents) return res.status(400).json({ message: 'Nedovoljno sredstava' });

    // compute fee and net
    const feeCents = Math.round(amountCents * 0.10); // 10%
    const netCents = amountCents - feeCents;

    // transaction: update balances and create transaction record, update platform fees
    const result = await prisma.$transaction(async (tx) => {
      // deduct from sender
      await tx.user.update({
        where: { id: senderId },
        data: { balanceCents: { decrement: amountCents } }
      });

      // credit receiver with net amount
      await tx.user.update({
        where: { id: Number(receiverId) },
        data: { balanceCents: { increment: netCents } }
      });

      // create transaction record
      const trans = await tx.transaction.create({
        data: {
          senderId,
          receiverId: Number(receiverId),
          amountCents,
          feeCents,
          netCents
        }
      });

      // update platform (assume single row id=1)
      const platformRow = await tx.platform.findFirst();
      if (platformRow) {
        await tx.platform.update({ where: { id: platformRow.id }, data: { totalFees: { increment: feeCents } } });
      } else {
        await tx.platform.create({ data: { totalFees: feeCents } });
      }

      return trans;
    });

    res.json({ message: 'Uspesno poslato', transaction: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri plaćanju' });
  }
});

// GET /api/payments/history - transaction history for user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const txs = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(txs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dohvatu transakcija' });
  }
});

export default router;
