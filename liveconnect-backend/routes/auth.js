// liveconnect-backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Username i password su obavezni." });
    }

    const exists = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          ...(email ? [{ email: email }] : []),
        ],
      },
      select: { id: true },
    });

    if (exists) {
      return res.status(400).json({ ok: false, error: "Korisnik već postoji." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email: email ?? null, passwordHash },
      select: { id: true, username: true, email: true, createdAt: true, updatedAt: true },
    });

    // TODO: set-cookie token/sesija ako treba
    return res.json({ ok: true, user });
  } catch (e) {
    console.error("REGISTER error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// POST /auth/login  (username ILI email + password)
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    // frontend može slati { username, password } – pokrij oba
    const nameOrEmail = identifier || req.body?.username || req.body?.email;

    if (!nameOrEmail || !password) {
      return res.status(400).json({ ok: false, error: "Username/email i password su obavezni." });
    }

    const isEmail = String(nameOrEmail).includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: nameOrEmail } : { username: nameOrEmail },
    });

    if (!user) {
      return res.status(400).json({ ok: false, error: "Pogrešan username/email ili lozinka." });
    }

    const okPass = await bcrypt.compare(password, user.passwordHash || "");
    if (!okPass) {
      return res.status(400).json({ ok: false, error: "Pogrešan username/email ili lozinka." });
    }

    // Ovde običan “stub” za sesiju (dovoljno da vidimo 200 OK; kasnije ćemo ubaciti pravi token)
    // res.cookie("sid", "dev", { httpOnly: true, sameSite: "lax" });

    const { id, username, email, createdAt, updatedAt } = user;
    return res.json({ ok: true, user: { id, username, email, createdAt, updatedAt } });
  } catch (e) {
    console.error("LOGIN error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// GET /auth/me  (za auto-login check; trenutno samo “stub”)
router.get("/me", async (_req, res) => {
  // Ako nemamo pravu sesiju još, vrati ok:false da frontend zna da nije ulogovan.
  return res.json({ ok: false });
});

// POST /auth/logout  (stub)
router.post("/logout", (req, res) => {
  // res.clearCookie("sid");
  return res.json({ ok: true });
});

export default router;
