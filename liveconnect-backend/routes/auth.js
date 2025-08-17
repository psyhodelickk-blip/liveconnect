// liveconnect-backend/routes/auth.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const router = Router();

const {
  JWT_SECRET = "dev_secret_change_me",
  JWT_EXPIRES_IN = "7d",
  COOKIE_NAME = "lc_session",
  COOKIE_SECURE = "false",
  COOKIE_SAME_SITE = "lax",
} = process.env;

function setCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE === "true",
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ ok: false, error: "REQUIRED" });

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ ok: false, error: "ALREADY_EXISTS" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, name: username, password: hash },
    });

    setCookie(res, { id: user.id, username: user.username, name: user.name });
    res.json({ ok: true, user: { id: user.id, username: user.username, name: user.name } });
  } catch (e) {
    console.error("register error", e);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ ok: false, error: "REQUIRED" });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    setCookie(res, { id: user.id, username: user.username, name: user.name });
    res.json({ ok: true, user: { id: user.id, username: user.username, name: user.name } });
  } catch (e) {
    console.error("login error", e);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    res.json({ ok: true, user: { id: user.id, username: user.username, name: user.name } });
  } catch {
    res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
  }
});

export default router;
