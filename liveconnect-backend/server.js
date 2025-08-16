// liveconnect-backend/server.js
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import { initSocket } from "./socket.js"; // vidi fajl ispod

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8080";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "backend", origin: FRONTEND_ORIGIN });
});

// >>> KLJUČNO: mount pod /api/*
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);

// HTTP server + Socket.IO
const server = http.createServer(app);
initSocket(server, {
  origin: FRONTEND_ORIGIN,
  path: "/socket.io",
});

server.listen(PORT, () => {
  console.log(`Backend (server.js) listening on :${PORT} (origin: ${FRONTEND_ORIGIN})`);
});
