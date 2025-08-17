// liveconnect-backend/routes/realtime/io.js
import { Server } from "socket.io";

const online = new Map(); // userId -> Set<socketId>
let seq = 1000;           // za dodelu ID ako ga nemamo

export function getOnlineUserIds() {
  return Array.from(online.keys());
}

export function initIO(server, origin) {
  const io = new Server(server, {
    cors: { origin, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    // Pokušaj da uzmeš userId iz query-a (opciono); ako nema – dodeli fake
    let userId = Number(socket.handshake.auth?.userId || socket.handshake.query?.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      userId = ++seq; // dodeli privremeni ID
    }

    const set = online.get(userId) || new Set();
    set.add(socket.id);
    online.set(userId, set);

    socket.join("lobby");
    socket.emit("joined", { room: "lobby", userId });

    // broadcast presence
    io.emit("presence", {
      users: getOnlineUserIds().map((id) => ({ id, username: `user${id}` })),
    });

    socket.on("join_room", (room) => {
      if (typeof room === "string" && room) socket.join(room);
    });

    socket.on("typing", ({ room = "lobby", typing = false } = {}) => {
      io.to(room).emit("typing", { room, userId, typing });
    });

    // minimalni chat: samo emit, bez baze
    socket.on("chat_message", ({ room = "lobby", content } = {}, cb) => {
      try {
        const text = (content || "").trim();
        if (!text) return cb?.({ ok: false, error: "EMPTY" });
        const msg = {
          id: Date.now(),
          room,
          content: text,
          senderId: userId,
          sender: { id: userId, username: `user${userId}` },
          createdAt: new Date().toISOString(),
        };
        io.to(room).emit("chat_message", msg);
        cb?.({ ok: true, message: msg });
      } catch (e) {
        console.error("chat_message error:", e);
        cb?.({ ok: false, error: "SERVER_ERROR" });
      }
    });

    socket.on("disconnect", () => {
      const s = online.get(userId);
      if (s) {
        s.delete(socket.id);
        if (s.size === 0) online.delete(userId);
      }
      io.emit("presence", {
        users: getOnlineUserIds().map((id) => ({ id, username: `user${id}` })),
      });
    });
  });

  return io;
}
