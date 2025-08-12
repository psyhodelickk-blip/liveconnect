// LiveConnect backend server (ESM)
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import healthRouter from "./routes/health.js";
import dbRouter from "./routes/db.js";       // ako nemaš, slobodno ukloni
import authRouter from "./routes/auth.js";
import messagesRouter from "./routes/messages.js";

import { attachIO } from "./realtime/io.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 4000);
const ORIGINS_RAW =
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  "http://localhost:3000,http://localhost:5173";
const ALLOWED_ORIGINS = ORIGINS_RAW.split(",").map((s) => s.trim()).filter(Boolean);

// body + cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS za HTTP (REST)
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

// Routes
app.use(healthRouter);
try { app.use(dbRouter); } catch {}
app.use(authRouter);
app.use(messagesRouter);

// Root ping
app.get("/", (_req, res) => res.send("LiveConnect backend up"));

// HTTP server + Socket.IO
const server = http.createServer(app);
attachIO(server, ALLOWED_ORIGINS);

// Start
server.listen(PORT, () => {
  console.log(`✅ HTTP+WS listening on http://localhost:${PORT}`);
  console.log(`CORS allowed origins:`, ALLOWED_ORIGINS);
});
