// src/components/Conversations.jsx
import React, { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { connectSocket, getSocket } from "../socket";

const norm = (v) => String(v || "").trim().toLowerCase();

export default function Conversations({ currentUser, selected, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/messages/conversations");
      if (data?.ok) setItems(data.items || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(load, 5000);
    return () => timer.current && clearInterval(timer.current);
  }, []);

  useEffect(() => {
    const s = connectSocket() || getSocket();
    if (!s) return;
    const onNew = () => load();
    const onRead = () => load();
    s.on("message:new", onNew);
    s.on("messages:read", onRead);
    return () => {
      s.off("message:new", onNew);
      s.off("messages:read", onRead);
    };
  }, []);

  async function choose(u) {
    onSelect(u);
    // odmah skini unread za izabranog peer-a
    try { await api.post("/messages/read", { fromUsername: norm(u) }); } catch {}
    // i odmah osveži listu
    load();
  }

  return (
    <div style={{ width: 300, borderRight: "1px solid #ddd", padding: 10, height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>
        Razgovori {loading ? "…" : ""}
      </div>
      {items.length === 0 && <div style={{ color: "#888" }}>Nema poruka još.</div>}
      <div style={{ display: "grid", gap: 6 }}>
        {items.map((c) => {
          const isActive = norm(selected) === norm(c.peer.username);
          return (
            <button
              key={c.peer.id}
              onClick={() => choose(c.peer.username)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: isActive ? "#eef6ff" : "#fff",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.peer.username}</div>
                {c.unread > 0 && (
                  <span style={{
                    background: "#ff4d4f", color: "#fff", borderRadius: 999,
                    padding: "0 8px", fontSize: 12, lineHeight: "18px", minWidth: 22, textAlign: "center"
                  }}>{c.unread}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {c.lastMessage.senderId === currentUser.id ? "ti: " : ""}
                {c.lastMessage.content.slice(0, 40)}{c.lastMessage.content.length > 40 ? "…" : ""}
              </div>
              <div style={{ fontSize: 11, color: "#999" }}>
                {new Date(c.lastMessage.createdAt).toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
