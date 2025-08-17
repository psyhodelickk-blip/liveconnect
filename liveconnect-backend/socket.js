// liveconnect-frontend/src/socket.js
import { io } from "socket.io-client";

export const socket = io("/", {
  path: "/socket.io",
  withCredentials: true,
  // Fallback na polling ako WS ne prođe (dev proxy, firew., itd.)
  transports: ["websocket", "polling"],
  autoConnect: false,
});

// Omogući i default import
export default socket;

export function connectSocket(token) {
  if (!socket.connected) {
    if (token) socket.auth = { token };
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}
