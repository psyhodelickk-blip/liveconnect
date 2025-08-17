// realtime/online.js
const sockets = new Map(); // socket.id -> { id, username, name }

function add(socketId, user) {
  sockets.set(socketId, {
    id: user?.id ?? null,
    username: user?.username ?? "anon",
    name: user?.name ?? user?.username ?? "anon",
  });
}
function remove(socketId) { sockets.delete(socketId); }
function list() { return Array.from(sockets.values()); }

export default { add, remove, list };
