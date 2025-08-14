// liveconnect-backend/realtime/io.js
import { Server } from "socket.io";

let io = null;

export function initIO(httpServer) {
  const origin = process.env.FRONTEND_ORIGIN || "http://localhost:8080";
  io = new Server(httpServer, {
    cors: { origin, credentials: true },
  });

  io.on("connection", (socket) => {
    // minimalni handler
    socket.on("disconnect", () => {});
  });
}

export function getIO() {
  if (!io) throw new Error("Socket.IO nije inicijalizovan");
  return io;
}
