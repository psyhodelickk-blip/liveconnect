import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Registracija (name + email + password)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Sva polja su obavezna' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Korisnik već postoji' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, password: hashed, balanceCents: 0 }
    });

    res.status(201).json({ message: 'Korisnik registrovan' });
  } catch {
    res.status(500).json({ message: 'Greška na serveru' });
  }
});

// Login (email + password)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email i lozinka su obavezni' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Pogrešan email ili lozinka' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Pogrešan email ili lozinka' });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, userId: user.id, name: user.name, email: user.email, balanceCents: user.balanceCents });
  } catch {
    res.status(500).json({ message: 'Greška na serveru' });
  }
});

// Dohvati podatke o ulogovanom
router.get('/me', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, balanceCents: true }
  });
  res.json(user);
});

export default router;
