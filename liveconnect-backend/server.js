// server.js (ESM, prod-ready)
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import healthRouter from "./routes/health.js";
import dbRouter from "./routes/db.js";           // ako nemaš, ukloni import i try blok
import authRouter from "./routes/auth.js";
import messagesRouter from "./routes/messages.js";
import paymentsRouter from "./routes/payments.js";
import { attachIO } from "./realtime/io.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT || 4000);
const ORIGINS_RAW =
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://localhost:8080,http://localhost:5173";
const ALLOWED_ORIGINS = ORIGINS_RAW.split(",").map((s) => s.trim()).filter(Boolean);

// Cookie config
const COOKIE_NAME = process.env.COOKIE_NAME || "lc_token";
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || "").toLowerCase() === "true";
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || (COOKIE_SECURE ? "none" : "lax");
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// Security & perf
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body + cookies
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  })
);

// Rate limits
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const msgLimiter  = rateLimit({ windowMs: 10 * 1000, max: 40 });

app.use("/auth", authLimiter);
app.use("/messages/send", msgLimiter);

// Cookie opcije kroz app.locals
app.locals.cookieOpts = {
  name: COOKIE_NAME,
  options: { httpOnly: true, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, domain: COOKIE_DOMAIN, path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 },
};

// Routes
app.use(healthRouter);
try { app.use(dbRouter); } catch {}
app.use(authRouter);
app.use(messagesRouter);
app.use(paymentsRouter);

// Root ping
app.get("/", (_req, res) => res.send("LiveConnect backend up"));

// HTTP + WS
const server = http.createServer(app);
attachIO(server, ALLOWED_ORIGINS);

// Start
server.listen(PORT, () => {
  console.log(`✅ HTTP+WS listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origins:`, ALLOWED_ORIGINS);
  console.log(`Cookie:`, { name: COOKIE_NAME, sameSite: COOKIE_SAMESITE, secure: COOKIE_SECURE, domain: COOKIE_DOMAIN });
});

export function getCookieConfig() {
  return app.locals.cookieOpts;
}
