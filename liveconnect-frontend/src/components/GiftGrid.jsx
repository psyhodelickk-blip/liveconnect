// src/components/GiftGrid.jsx
import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export default function GiftGrid({ peerUsername, onSent }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/gifts");
      if (data?.ok) setGifts(data.items);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Greška pri učitavanju giftova");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function sendGift(code) {
    if (!peerUsername) return setMsg("Izaberi razgovor");
    setMsg("");
    try {
      const { data } = await api.post("/gifts/send", {
        toUsername: String(peerUsername).toLowerCase(),
        code,
        reference: `gift-${Date.now()}`,
      });
      if (data?.ok) onSent?.(code);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Greška pri slanju gifta");
    }
  }

  if (loading) return <div style={{ padding: 10, fontSize: 12 }}>Učitavam giftove…</div>;

  return (
    <div style={{ padding: 10 }}>
      {msg && <div style={{ color: "#c00", fontSize: 12, marginBottom: 8 }}>{msg}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
        {gifts.map((g) => (
          <button
            key={g.id}
            onClick={() => sendGift(g.code)}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 10,
              background: "#fff",
              textAlign: "center",
              cursor: "pointer"
            }}
            title={`${g.name} • ${g.price} coins`}
          >
            {g.iconUrl ? (
              <img src={g.iconUrl} alt={g.name} style={{ width: 48, height: 48, objectFit: "contain" }} />
            ) : (
              <div style={{ fontSize: 32 }}>🎁</div>
            )}
            <div style={{ marginTop: 6, fontWeight: 600 }}>{g.name}</div>
            <div style={{ fontSize: 12, color: "#555" }}>{g.price} coins</div>
          </button>
        ))}
      </div>
    </div>
  );
}
