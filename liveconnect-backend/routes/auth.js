// C:\Users\user\Desktop\liveconnect\liveconnect-backend\routes\auth.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const router = Router();

const {
  JWT_SECRET = "",
  JWT_EXPIRES_IN = "7d",
  COOKIE_NAME = "lc_session",
  COOKIE_SECURE = "false",
  COOKIE_SAME_SITE = "lax",
} = process.env;

function signAndSetCookie(res, payload) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET missing");
  }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE === "true",
    sameSite: COOKIE_SAME_SITE, // 'lax' recommended for localhost
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function publicUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

router.get("/me", async (req, res) => {
  try {
    const raw = req.cookies?.[COOKIE_NAME];
    if (!raw) return res.json({ ok: true, user: null });
    if (!JWT_SECRET) return res.status(500).json({ ok: false, error: "SERVER_ENV" });

    const decoded = jwt.verify(raw, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    return res.json({ ok: true, user: null });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!(username || email) || !password) {
      return res.status(400).json({ ok: false, error: "REQUIRED" });
    }
    const hash = await bcrypt.hash(password, 10);

    // napravimo where OR za jedinstvenost
    const where = email ? { email } : { username };
    const exists = await prisma.user.findFirst({ where });
    if (exists) {
      return res.status(409).json({ ok: false, error: "ALREADY_EXISTS" });
    }

    const created = await prisma.user.create({
      data: {
        username: username ?? null,
        email: email ?? null,
        password: hash,
        name: username ?? email ?? null,
      },
    });

    signAndSetCookie(res, { id: created.id });
    return res.status(201).json({ ok: true, user: publicUser(created) });
  } catch (err) {
    console.error("POST /auth/register error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const idField = email || username; // podrži oba
    if (!idField || !password) {
      return res.status(400).json({ ok: false, error: "REQUIRED" });
    }

    // Probaj email pa username
    const user =
      (await prisma.user.findFirst({ where: { email: idField } })) ||
      (await prisma.user.findFirst({ where: { username: idField } }));

    if (!user) {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }

    signAndSetCookie(res, { id: user.id });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

export default router;
