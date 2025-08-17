import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./auth.js";
import chatRouter from "./chat.js";
import { initSocket } from "../socket.js";

const app = express();

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8080";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health (oba puta, zbog nginx-a)
app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "backend", origin: ORIGIN })
);
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "backend", origin: ORIGIN })
);

// AUTH
app.use("/auth", authRouter);
app.use("/api/auth", authRouter); // tolerantan mount

// CHAT
app.use("/chat", chatRouter);
app.use("/api/chat", chatRouter); // tolerantan mount

// Debug: izlistaj rute (pomaže kad treba)
app.get("/_routes", (_req, res) => {
  const routes = [];
  const src = app._router?.stack || [];
  for (const layer of src) {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods)
        .map((m) => m.toUpperCase())
        .join(",");
      routes.push(`${methods} ${layer.route.path}`);
    } else if (layer.name === "router" && layer.handle?.stack) {
      for (const r of layer.handle.stack) {
        if (r.route?.path) {
          const methods = Object.keys(r.route.methods)
            .map((m) => m.toUpperCase())
            .join(",");
          routes.push(`${methods} ${r.route.path}`);
        }
      }
    }
  }
  res.json({ ok: true, routes });
});

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Backend (routes/index.js) listening on :${PORT} (origin: ${ORIGIN})`);
});