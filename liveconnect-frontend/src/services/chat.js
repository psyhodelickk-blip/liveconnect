// src/services/chat.js
import { api } from "./api";

export const ChatAPI = {
  peers: async () => (await api.get("/messages/peers")).data.peers,
  loadThread: async (peerId) =>
    (await api.get(`/messages/thread/${peerId}`)).data.messages,
  send: async (toUserId, body) =>
    (await api.post("/messages/send", { toUserId, body })).data.message,
};
