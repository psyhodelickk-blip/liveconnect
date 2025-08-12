// src/socket.js
import { io as createIO } from "socket.io-client";
import { api } from "./services/api";

let socket = null;

export function connectSocket() {
  if (socket) return socket;
  const url = api.defaults.baseURL; // npr. http://localhost:4000
  socket = createIO(url, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
