import express from "express";
import { prisma } from "../prismaClient.js";

const router = express.Router();

// /auth/me — koristi se za guard na frontendu
router.get("/me", async (req, res) => {
  if (!req.session?.userId) return res.json({ ok: false });
  return res.json({
    ok: true,
    user: { id: req.session.userId, username: req.session.username },
  });
});

// /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "REQUIRED" });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ ok: false, error: "USERNAME_TAKEN" });

    const user = await prisma.user.create({
      data: { username, password }, // u šemi postoji "password"
      select: { id: true, username: true },
    });

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ ok: true, user });
  } catch (e) {
    next(e);
  }
});

// /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "REQUIRED" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ ok: false, error: "BAD_CREDENTIALS" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (e) {
    next(e);
  }
});

// /auth/logout
router.post("/logout", (req, res) => {
  try {
    req.session?.destroy?.(() => {});
  } catch {}
  res.json({ ok: true });
});

export default router;
