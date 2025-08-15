// backend/routes/realtime/io.js
import { Server } from "socket.io";
let io;

export function initIO(httpServer, origin) {
  io = new Server(httpServer, {
    cors: { origin, credentials: true },
    cookie: { name: "sid" },
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      if (userId) socket.join(String(userId));
    });
  });

  return io;
}

export function getIO() {
  return io;
}
