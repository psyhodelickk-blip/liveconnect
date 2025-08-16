// src/socket.js
import { io } from "socket.io-client";

export const socket = io("/", {
  path: "/socket.io",
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: false,
});

export function connectSocket(token) {
  if (!socket.connected) {
    if (token) socket.auth = { token };
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}
