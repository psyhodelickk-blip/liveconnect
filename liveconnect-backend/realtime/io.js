// backend/routes/realtime/io.js
import { Server } from "socket.io";

const rooms = new Map();       // room -> [{id, from, text, room, ts}]
const online = new Map();      // socket.id -> { username }

function presenceList() {
  return Array.from(online.values()).map(u => ({ username: u.username }));
}

export function initIO(httpServer, origin) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    transports: ["websocket"],
    cors: { origin, credentials: true }
  });

  io.on("connection", (socket) => {
    const username =
      socket.handshake.auth?.username ||
      `user-${socket.id.slice(0, 5)}`;

    online.set(socket.id, { username });
    io.emit("presence:list", presenceList());

    socket.on("join", (room = "lobby") => {
      room = String(room || "lobby");
      socket.join(room);
      const items = rooms.get(room) || [];
      socket.emit("chat:history", { room, items });
    });

    socket.on("chat:send", ({ room = "lobby", text } = {}) => {
      const msg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        room: String(room),
        text: String(text || ""),
        from: username,
        ts: Date.now()
      };
      if (!rooms.has(room)) rooms.set(room, []);
      rooms.get(room).push(msg);
      io.to(room).emit("chat:new", msg);
    });

    socket.on("disconnect", () => {
      online.delete(socket.id);
      io.emit("presence:list", presenceList());
    });
  });

  console.log(`[IO] listening on path /socket.io (origin: ${origin})`);
  return io;
}
