import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signJwt } from "../utils/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// === Helpers ===============================================================

function sanitizeUser(u) {
  if (!u) return u;
  const { passwordHash, ...rest } = u;
  return rest;
}

function normalizeUsername(u) {
  return String(u || "").trim().toLowerCase();
}
function isValidUsername(u) {
  return /^[a-z0-9._]{3,30}$/.test(u);
}

/** Proveri da li tabela ima određenu kolonu (radi i ako je "User"/"user"). */
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

// Keširamo šta tabela ima, da ne pingamo bazu svaki put
let hasEmailCol = null;
let hasUsernameCol = null;
async function ensureColumnInfo() {
  if (hasEmailCol === null) {
    hasEmailCol = await tableHasColumn("User", "email");
  }
  if (hasUsernameCol === null) {
    hasUsernameCol = await tableHasColumn("User", "username");
  }
}

// === Routes ================================================================

/**
 * POST /auth/register
 * Body: { username, password, email?, name? }
 * - username i password su OBAVEZNI
 * - email je OPCIONO (koristimo ga samo ako kolona postoji)
 */
router.post("/auth/register", async (req, res) => {
  try {
    await ensureColumnInfo();

    let { username, password, email, name } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        error: "Username i password su obavezni",
      });
    }

    username = normalizeUsername(username);
    if (!isValidUsername(username)) {
      return res.status(400).json({
        ok: false,
        error:
          "Username mora biti 3-30 znakova, samo mala slova, brojevi, tačka ili donja crta (a-z 0-9 . _)",
      });
    }

    // Provera da li su zauzeti (dinamički, prema postojećim kolonama)
    const orConds = [];
    if (hasUsernameCol) orConds.push({ username });
    if (hasEmailCol && email) orConds.push({ email: String(email).trim().toLowerCase() });

    if (orConds.length > 0) {
      const exists = await prisma.user.findFirst({ where: { OR: orConds } });
      if (exists) {
        // odredi šta je duplo
        if (hasEmailCol && email && exists.email === String(email).trim().toLowerCase()) {
          return res.status(409).json({ ok: false, error: "Email je već zauzet" });
        }
        return res.status(409).json({ ok: false, error: "Username je već zauzet" });
      }
    }

    const passwordHash = await hashPassword(password);

    // Dinamički sklapamo data samo sa postojećim kolonama
    const data = { passwordHash, name: name ? String(name) : null };
    if (hasUsernameCol) data.username = username;
    if (hasEmailCol && email) data.email = String(email).trim().toLowerCase();

    const user = await prisma.user.create({ data });

    const token = signJwt({ userId: user.id });
    res.cookie("lc_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true na produkciji (HTTPS)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Register failed" });
  }
});

/**
 * POST /auth/login
 * Body varijante:
 *  - { username, password }  (uvek radi)
 *  - { email, password }     (samo ako postoji email kolona)
 */
router.post("/auth/login", async (req, res) => {
  try {
    await ensureColumnInfo();

    let { email, username, password } = req.body || {};
    if (!password || (!username && !email)) {
      return res.status(400).json({
        ok: false,
        error: "Potrebni su password i (username ili email)",
      });
    }

    let user = null;

    // Prvenstveno probaj po username-u (uvek podržan)
    if (username) {
      username = normalizeUsername(username);
      if (!isValidUsername(username)) {
        return res.status(400).json({ ok: false, error: "Neispravan username format" });
      }
      if (hasUsernameCol) {
        user = await prisma.user.findUnique({ where: { username } });
      }
    }

    // Ako nije našao i imamo email kolonu + poslat email – probaj po email-u
    if (!user && hasEmailCol && email) {
      email = String(email).trim().toLowerCase();
      // findFirst jer email možda nije unique u tvojoj šemi
      user = await prisma.user.findFirst({ where: { email } });
    }

    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

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
