// src/components/Composer.jsx
import React, { useRef, useState } from "react";
import { api } from "../services/api";
import { getSocket } from "../socket";

const norm = (v) => String(v || "").trim().toLowerCase();

export default function Composer({ peerUsername, onSent }) {
  const [text, setText] = useState("");
  const debounceRef = useRef(null);

  async function send() {
    const to = norm(peerUsername);
    if (!to || !text.trim()) return;
    const { data } = await api.post("/messages/send", { toUsername: to, content: text });
    setText("");
    emitTyping(false);
    onSent?.(data?.message);
  }

  function emitTyping(isTyping) {
    const s = getSocket();
    if (!s) return;
    const to = norm(peerUsername);
    if (!to) return;
    s.emit("typing", { toUsername: to, isTyping });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function onChange(e) {
    setText(e.target.value);
    emitTyping(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => emitTyping(false), 900);
  }

  const disabled = !norm(peerUsername);

  return (
    <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
      <textarea
        value={text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={disabled ? "Izaberi korisnika iz liste..." : "Napiši poruku (Enter za slanje, Shift+Enter za novi red)"}
        disabled={disabled}
        rows={2}
        style={{ flex: 1, resize: "none", padding: 10 }}
      />
      <button onClick={send} disabled={disabled || !text.trim()} style={{ padding: "8px 14px", height: 40, alignSelf: "end" }}>
        Pošalji
      </button>
    </div>
  );
}
