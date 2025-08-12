// src/components/Conversations.jsx
import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Conversations({ currentUser, selected, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/messages/recent");
      if (data?.ok) setItems(data.threads || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    const u = String(newUser || "").trim().toLowerCase();
    const me = String(currentUser?.username || "").toLowerCase();
    if (!u || u === me) return;
    onSelect?.(u);
    setNewUser("");
  }

  return (
    <div style={{ width: 260, borderRight: "1px solid #eee", background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Razgovori</div>

        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={newUser}
            placeholder="username..."
            onChange={(e) => setNewUser(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openNew()}
            style={{ flex: 1, padding: 6, border: "1px solid #ddd", borderRadius: 8 }}
          />
          <button onClick={openNew}>Otvori</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 12, color: "#888" }}>Učitavam…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 12, color: "#888" }}>Nema poruka još.</div>
        ) : (
          items.map((t) => {
            const peer = (t.peer?.username || "").toLowerCase();
            const isSel = selected && peer === selected.toLowerCase();
            return (
              <button
                key={peer}
                onClick={() => onSelect?.(peer)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 10,
                  border: "none",
                  borderBottom: "1px solid #f2f2f2",
                  background: isSel ? "#f7faff" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>@{peer}</div>
                {t.last && <div style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.last.content || (t.last.kind === "gift" ? `🎁 ${t.last.name} (${t.last.price})` : "")}</div>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
