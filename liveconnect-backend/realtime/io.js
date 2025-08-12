// realtime/io.js (ESM) — presence + typing
import { Server } from "socket.io";
import { verifyJwt } from "../utils/jwt.js";
import { prisma } from "../prismaClient.js";

let ioInstance = null;

// userId -> Set<socketId>
const online = new Map();
// userId -> username (cache)
const userCache = new Map();

function parseCookies(raw) {
  const out = {};
  (raw || "").split(";").map((s) => s.trim()).forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

async function getUsername(userId) {
  if (userCache.has(userId)) return userCache.get(userId);
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  const name = u?.username ?? String(userId);
  userCache.set(userId, name);
  return name;
}

async function buildPresenceList() {
  const ids = Array.from(online.keys());
  const list = [];
  for (const id of ids) {
    const username = await getUsername(id);
    list.push({ userId: id, username });
  }
  return list;
}

export function attachIO(httpServer, allowedOrigins) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked: ${origin}`), false);
      },
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  ioInstance.on("connection", async (socket) => {
    const cookies = parseCookies(socket.request.headers.cookie || "");
    const token = cookies["lc_token"];
    const payload = token ? verifyJwt(token) : null;
    if (!payload?.userId) {
      socket.disconnect(true);
      return;
    }

    const userId = payload.userId;
    const username = await getUsername(userId);

    // mark online
    if (!online.has(userId)) online.set(userId, new Set());
    online.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    // pošalji listu trenutno online usera samo novom klijentu
    socket.emit("presence:list", await buildPresenceList());
    // obavesti sve da je ovaj user online
    ioInstance.emit("presence:online", { userId, username });

    // typing signal
    socket.on("typing", async (payload) => {
      const toUserId = Number(payload?.toUserId || 0);
      const toUsername = String(payload?.toUsername || "").trim().toLowerCase();
      const isTyping = Boolean(payload?.isTyping);

      let recipientId = toUserId || null;
      if (!recipientId && toUsername) {
        const u = await prisma.user.findUnique({ where: { username: toUsername }, select: { id: true } });
        if (u) recipientId = u.id;
      }
      if (!recipientId) return;

      ioInstance.to(`user:${recipientId}`).emit("typing", {
        fromUserId: userId,
        fromUsername: username,
        isTyping,
      });
    });

    socket.on("disconnect", async () => {
      const set = online.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          online.delete(userId);
          ioInstance.emit("presence:offline", { userId, username: await getUsername(userId) });
        }
      }
    });
  });

  return ioInstance;
}

export function io() {
  return ioInstance;
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}
