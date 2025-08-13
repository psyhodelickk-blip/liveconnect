// realtime/io.js
import { Server } from "socket.io";

let io = null;
// userId -> Set(socketId)
const userSockets = new Map();

export function setupRealtime(httpServer, allowedOrigins = ["http://localhost:3000", "http://localhost:8080"]) {
  io = new Server(httpServer, {
    cors: {
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error("CORS blocked: " + origin));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Klijent odmah šalje svoj userId da ga vežemo
    socket.on("auth:bind", (payload = {}) => {
      const userId = Number(payload.userId || 0);
      if (!userId) return;
      socket.userId = userId;
      let set = userSockets.get(userId);
      if (!set) {
        set = new Set();
        userSockets.set(userId, set);
      }
      set.add(socket.id);
    });

    socket.on("disconnect", () => {
      const uid = socket.userId;
      if (!uid) return;
      const set = userSockets.get(uid);
      if (!set) return;
      set.delete(socket.id);
      if (set.size === 0) userSockets.delete(uid);
    });
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io) return;
  const set = userSockets.get(Number(userId));
  if (!set) return;
  for (const sid of set) {
    io.to(sid).emit(event, payload);
  }
}
