// liveconnect-backend/routes/auth.js
import { Router } from "express";
import prisma from "../prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const {
  JWT_SECRET = "",
  JWT_EXPIRES_IN = "7d",
  COOKIE_NAME = "lc_session",
  COOKIE_SECURE = "false",     // u dev = false
  COOKIE_SAME_SITE = "lax",    // u dev = lax
} = process.env;

function signToken(user) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// *** KLJUČNO: path: '/' da bi cookie važio i za /socket.io/ ***
function cookieOpts() {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE === "true",
    sameSite: COOKIE_SAME_SITE, // "lax" u dev
    path: "/",                   // <<< OVO JE BITNO
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dana
  };
}

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "REQUIRED" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, cookieOpts());

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    console.error("POST /auth/login", e);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "REQUIRED" });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ ok: false, error: "ALREADY_EXISTS" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hash, name: username },
    });

    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, cookieOpts());

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    console.error("POST /auth/register", e);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

router.post("/logout", async (_req, res) => {
  try {
    // *** isto path: '/' da bi brisanje radilo ***
    res.clearCookie(COOKIE_NAME, { path: "/" });
  } catch {}
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token || !JWT_SECRET) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
  }
});

export default router;
