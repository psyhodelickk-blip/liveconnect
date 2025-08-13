// src/socket.js
import { io as IO } from "socket.io-client";
import { api } from "./services/api";

let socket = null;

export async function connectSocket() {
  if (socket) return socket;

  // sačekaćemo /auth/me da znamo userId
  let userId = null;
  try {
    const { data } = await api.get("/auth/me");
    userId = data?.user?.id || null;
  } catch (_) {}

  socket = IO(process.env.REACT_APP_API_URL || "http://localhost:4000", {
    withCredentials: true,
    transports: ["websocket"],
  });

  window.lcSocket = socket; // da ga vide komponente

  socket.on("connect", () => {
    if (userId) socket.emit("auth:bind", { userId });
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
    window.lcSocket = null;
  }
}
