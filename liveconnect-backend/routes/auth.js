import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signJwt } from "../utils/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function sanitizeUser(u) {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
}
const norm = (s) => String(s || "").trim().toLowerCase();
const isU = (u) => /^[a-z0-9._]{3,30}$/.test(u);

function cookieConf(req) {
  const { name, options } = req.app.locals.cookieOpts || { name: "lc_token", options: {} };
  return { name, options };
}

router.post("/auth/register", async (req, res) => {
  try {
    let { username, password, email } = req.body || {};
    if (!username || !password) return res.status(400).json({ ok: false, error: "Username i password su obavezni" });
    username = norm(username);
    if (!isU(username)) return res.status(400).json({ ok: false, error: "Username 3-30 znakova (a-z 0-9 . _)" });

    // zauzeÄ‡e
    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, ...(email ? [{ email: norm(email) }] : [])] },
    });
    if (exists) return res.status(409).json({ ok: false, error: "Username ili email zauzet" });

    const user = await prisma.user.create({
      data: { username, password: await hashPassword(password), ...(email ? { email: norm(email) } : {}) },
    });

    const token = signJwt({ userId: user.id });
    const { name, options } = cookieConf(req);
    res.cookie(name, token, options);
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Register failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    let { username, email, password } = req.body || {};
    if (!password || (!username && !email)) {
      return res.status(400).json({ ok: false, error: "Potrebni su password i (username ili email)" });
    }
    let user = null;
    if (username) {
      username = norm(username);
      if (!isU(username)) return res.status(400).json({ ok: false, error: "Neispravan username" });
      user = await prisma.user.findUnique({ where: { username } });
    }
    if (!user && email) user = await prisma.user.findFirst({ where: { email: norm(email) } });
    if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const token = signJwt({ userId: user.id });
    const { name, options } = cookieConf(req);
    res.cookie(name, token, options);
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Login failed" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to load me" });
  }
});

router.post("/auth/logout", (_req, res) => {
  const name = (_req.app.locals.cookieOpts?.name) || "lc_token";
  const options = _req.app.locals.cookieOpts?.options || {};
  res.clearCookie(name, { ...options, maxAge: undefined }); // za svaki sluÄaj
  return res.json({ ok: true });
});

export default router;

