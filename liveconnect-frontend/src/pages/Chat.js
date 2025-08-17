// src/pages/Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import { socket } from "../socket";

function api(path, opts = {}) {
  return fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || "SERVER_ERROR");
    return data;
  });
}

export default function Chat() {
  const [room, setRoom] = useState("lobby");
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);
  const [text, setText] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onMsg = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on("message", onMsg);
    return () => socket.off("message", onMsg);
  }, []);

  // učitaj istoriju kad se promeni soba
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api(`/chat/history?room=${encodeURIComponent(room)}&limit=50`);
        if (active) setMessages(data.items || []);
      } catch (e) {
        console.error("history", e);
        setMessages([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [room]);

  // “ko je online” — osveži na 5s
  useEffect(() => {
    let t;
    const load = async () => {
      try {
        const data = await api("/chat/users-online");
        setOnline(data.items || []);
      } catch {}
    };
    load();
    t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  // scroll na dno kad stigne poruka
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    socket.emit("message", { room, message: t });
    setText("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, padding: 16 }}>
      <div>
        <div><b>Sobe</b></div>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          onBlur={() => socket.emit("join", room)}
          style={{ width: "100%" }}
        />
        <div style={{ marginTop: 16 }}><b>Online</b></div>
        <ul>
          {online.map((u, i) => <li key={`${u.username}-${i}`}>{u.username}</li>)}
        </ul>
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>
          <b>Soba:</b> {room} <span style={{ color: "green" }}>●</span>
        </div>

        <div
          ref={boxRef}
          style={{ border: "1px solid #ccc", height: 360, padding: 8, overflowY: "auto", marginBottom: 8 }}
        >
          {messages.map((m) => (
            <div key={m.id ?? `${m.ts}-${m.text.slice(0,5)}`}>
              <b>{m.user?.username || "anon"}:</b> {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={send}>
          <input
            style={{ width: "80%" }}
            placeholder="Poruka..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" style={{ marginLeft: 8 }}>Pošalji</button>
        </form>
      </div>
    </div>
  );
}
