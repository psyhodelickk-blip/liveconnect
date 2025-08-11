import express from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/list  - list of users (id + name) for selecting receiver
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true } });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dohvatu korisnika' });
  }
});

export default router;
