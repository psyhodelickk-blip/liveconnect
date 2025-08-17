import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import prisma from "./prismaClient.js";
import online from "./realtime/online.js";

const ORIGINS = (process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:3000", "http://localhost:8080"]).map((s) => s.trim());

const PORT = process.env.PORT || 4000;
const { JWT_SECRET = "dev_secret_change_me", COOKIE_NAME = "lc_session" } = process.env;

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// health
app.get("/health", (_req, res) => res.json({ ok: true, origins: ORIGINS }));

// routes
app.use("/auth", authRouter);
app.use("/chat", chatRouter);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: ORIGINS, credentials: true },
  path: "/socket.io",
});

// JWT iz cookie-a
function getUserFromCookie(headers) {
  try {
    const cookieHeader = headers?.cookie || "";
    const parts = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((s) => s.trim().split("=").map(decodeURIComponent))
        .filter((x) => x[0])
    );
    const token = parts[COOKIE_NAME];
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET);
    return { id: payload.id, username: payload.username, name: payload.name ?? payload.username };
  } catch {
    return null;
  }
}

io.on("connection", async (socket) => {
  const user = getUserFromCookie(socket.handshake.headers) || { id: null, username: "anon", name: "anon" };
  socket.data.user = user;

  // upiši da je online
  online.add(socket.id, user);

  // podrazumevana soba
  const defaultRoom = "lobby";
  socket.join(defaultRoom);

  socket.on("join", (room) => {
    try {
      const r = (room || "lobby").toString();
      for (const joined of socket.rooms) {
        if (joined !== socket.id) socket.leave(joined);
      }
      socket.join(r);
      socket.emit("joined", { room: r });
    } catch {}
  });

  socket.on("message", async ({ room, message }) => {
    try {
      const r = (room || "lobby").toString();
      const text = String(message ?? "").slice(0, 2000);
      const saved = await prisma.message.create({
        data: { room: r, text, userId: socket.data.user?.id ?? null },
        include: { user: { select: { id: true, username: true, name: true } } },
      });

      io.to(r).emit("message", {
        id: saved.id,
        room: saved.room,
        text: saved.text,
        ts: saved.createdAt,
        user: saved.user
          ? { id: saved.user.id, username: saved.user.username, name: saved.user.name ?? saved.user.username }
          : { id: null, username: "anon", name: "anon" },
      });
    } catch (e) {
      console.error("socket message error:", e);
    }
  });

  socket.on("disconnect", () => {
    online.remove(socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on :${PORT}`);
});
