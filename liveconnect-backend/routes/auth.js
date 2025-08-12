import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signJwt } from "../utils/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// === Helpers ===============================================================
function sanitizeUser(u) {
  if (!u) return u;
  const { password, ...rest } = u; // <-- u tvojoj šemi je "password" polje
  return rest;
}

function normalizeUsername(u) {
  return String(u || "").trim().toLowerCase();
}
function isValidUsername(u) {
  return /^[a-z0-9._]{3,30}$/.test(u);
}

/** Proveri da li tabela ima određenu kolonu (npr. email). */
async function tableHasColumn(tableName, columnName) {
  try {
    const rows = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND lower(table_name) = lower(${tableName})
          AND lower(column_name) = lower(${columnName})
      ) AS present
    `;
    return Boolean(rows?.[0]?.present);
  } catch {
    return false;
  }
}
let hasEmailCol = null;
async function ensureColumnInfo() {
  if (hasEmailCol === null) {
    hasEmailCol = await tableHasColumn("User", "email");
  }
}

// === Routes ================================================================

/**
 * POST /auth/register
 * Body: { username, password, email? }
 * - username i password su OBAVEZNI
 * - email je OPCIONO (samo ako postoji kolona u bazi)
 */
router.post("/auth/register", async (req, res) => {
  try {
    await ensureColumnInfo();

    let { username, password, email } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Username i password su obavezni" });
    }

    username = normalizeUsername(username);
    if (!isValidUsername(username)) {
      return res.status(400).json({
        ok: false,
        error: "Username mora biti 3-30 znakova (a-z 0-9 . _)",
      });
    }

    // Provera zauzetosti
    const orConds = [{ username }];
    if (hasEmailCol && email) orConds.push({ email: String(email).trim().toLowerCase() });

    const exists = await prisma.user.findFirst({ where: { OR: orConds } });
    if (exists) {
      if (hasEmailCol && email && exists.email === String(email).trim().toLowerCase()) {
        return res.status(409).json({ ok: false, error: "Email je već zauzet" });
      }
      return res.status(409).json({ ok: false, error: "Username je već zauzet" });
    }

    const passwordHashed = await hashPassword(password);

    // Sastavi data u skladu sa realnim kolonama
    const data = { username, password: passwordHashed };
    if (hasEmailCol && email) data.email = String(email).trim().toLowerCase();

    const user = await prisma.user.create({ data });

    const token = signJwt({ userId: user.id });
    res.cookie("lc_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true na HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Register failed" });
  }
});

/**
 * POST /auth/login
 * Body: { username?, email?, password }
 * - login po username-u uvek
 * - login po email-u samo ako kolona postoji
 */
router.post("/auth/login", async (req, res) => {
  try {
    await ensureColumnInfo();

    let { username, email, password } = req.body || {};
    if (!password || (!username && !email)) {
      return res.status(400).json({
        ok: false,
        error: "Potrebni su password i (username ili email)",
      });
    }

    let user = null;

    if (username) {
      username = normalizeUsername(username);
      if (!isValidUsername(username)) {
        return res.status(400).json({ ok: false, error: "Neispravan username format" });
      }
      user = await prisma.user.findUnique({ where: { username } }); // username je unique
    }

    if (!user && hasEmailCol && email) {
      email = String(email).trim().toLowerCase();
      user = await prisma.user.findFirst({ where: { email } });
    }

    if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const ok = await verifyPassword(password, user.password); // <-- koristi "password" polje iz šeme
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const token = signJwt({ userId: user.id });
    res.cookie("lc_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Login failed" });
  }
});

/** GET /auth/me */
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to load me" });
  }
});

/** POST /auth/logout */
router.post("/auth/logout", (_req, res) => {
  res.clearCookie("lc_token", { httpOnly: true, sameSite: "lax", secure: false });
  return res.json({ ok: true });
});

export default router;
