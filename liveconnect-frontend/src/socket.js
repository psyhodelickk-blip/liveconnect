// src/socket.js
import { io } from "socket.io-client";

// jedan deljeni socket klijent
export const socket = io("/", {
  path: "/socket.io",
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: false, // ručno ćemo ga povezati posle logina
});

// OVO JE BITNO: ove dve funkcije traži Auth.jsx
export function connectSocket(token) {
  try {
    if (!socket.connected) {
      if (token) socket.auth = { token }; // nije obavezno (koristimo cookie), ali ne smeta
      socket.connect();
    }
  } catch {}
}

export function disconnectSocket() {
  try {
    if (socket.connected) socket.disconnect();
  } catch {}
}
