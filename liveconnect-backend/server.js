// liveconnect-backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import authRoutes from "./routes/auth.js";
import { initIO } from "./realtime/io.js";

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8080";

const app = express();

// CORS + parsers
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health uvek radi
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend", time: new Date().toISOString() });
});

// Auth odmah montiramo (radi samostalno)
app.use("/auth", authRoutes);

// Ostale rute montiramo *dinamički* da ne sruše boot ako imaju grešku
(async () => {
  try {
    const { default: messagesRoutes } = await import("./routes/messages.js");
    app.use("/messages", messagesRoutes);
  } catch (e) {
    console.error("(!) Messages route nije montiran:", e.message);
  }

  try {
    const { default: paymentsRoutes } = await import("./routes/payments.js");
    app.use("/payments", paymentsRoutes);
  } catch (e) {
    console.error("(!) Payments route nije montiran:", e.message);
  }

  // Tek sada startujemo HTTP + socket.io
  const server = http.createServer(app);
  initIO(server);

  server.listen(PORT, () => {
    console.log(`Backend listening on :${PORT} (origin: ${ORIGIN})`);
  });
})();
