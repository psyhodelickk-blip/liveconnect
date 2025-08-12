// src/components/Composer.jsx
import React, { useState } from "react";
import { api } from "../services/api";

export default function Composer({ peerUsername, onSent }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function send() {
    const content = String(text || "").trim();
    if (!peerUsername) { setErr("Izaberi sagovornika."); return; }
    if (!content) return;
    setErr("");
    try {
      const { data } = await api.post("/messages/send", { to: peerUsername, content });
      if (data?.ok) {
        setText("");
        onSent?.(data.message);
      }
    } catch (e) {
      setErr(e?.response?.data?.error || "Slanje nije uspelo");
    }
  }

  return (
    <div style={{ padding: 8, borderTop: "1px solid #eee", background: "#fff", display: "flex", gap: 8 }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="poruka..."
        style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
      />
      <button onClick={send}>Pošalji</button>
      {err && <div style={{ color: "#c00", fontSize: 12, alignSelf: "center" }}>{err}</div>}
    </div>
  );
}
