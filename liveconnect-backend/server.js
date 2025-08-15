// backend/server.js
import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import http from "http";

import authRoutes from "./routes/auth.js";
import paymentsRoutes from "./routes/payments.js";
import messagesRoutes from "./routes/messages.js";           // <-- NOVO
import { initIO } from "./routes/realtime/io.js";            // <-- NOVO (ok je i ako IO ne koristiš odmah)

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:8080";

const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.set("trust proxy", 1);
app.use(express.json());

// Cookie session
app.use(
  cookieSession({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    sameSite: "lax",
    httpOnly: true,
    secure: false, // lokalno
  })
);

// Health i debug
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend", origin: FRONTEND_ORIGIN });
});
app.post("/debug/echo", (req, res) => {
  res.json({ ok: true, received: req.body || null });
});

// Rute
app.use("/auth", authRoutes);
app.use("/payments", paymentsRoutes);
app.use("/messages", messagesRoutes);                       // <-- KLJUČNO

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "SERVER_ERROR" });
});

// HTTP server + socket.io
const server = http.createServer(app);
initIO(server, FRONTEND_ORIGIN);                            // <-- OK je i ako IO ne koristiš odmah

server.listen(PORT, () => {
  console.log(`Backend listening on :${PORT} (origin: ${FRONTEND_ORIGIN})`);
});
