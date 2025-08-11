import express from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/messages  - sve poruke za ulogovanog korisnika (poslate ili primljene)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dohvatu poruka' });
  }
});

// POST /api/messages  - pošalji poruku
router.post('/', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, nsfw } = req.body;
    if (!receiverId || !content) return res.status(400).json({ message: 'Nedostaju podaci' });

    // Optionally: check receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: Number(receiverId) } });
    if (!receiver) return res.status(404).json({ message: 'Primalac nije pronađen' });

    const message = await prisma.message.create({
      data: {
        content,
        nsfw: nsfw || false,
        senderId: senderId,
        receiverId: Number(receiverId)
      },
      include: { sender: { select: { id: true, name: true } }, receiver: { select: { id: true, name: true } } }
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri slanju poruke' });
  }
});

export default router;
