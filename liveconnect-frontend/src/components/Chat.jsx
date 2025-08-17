import React, { useEffect, useMemo, useRef, useState } from "react";
import socket from "../socket";

export default function Chat() {
  const [me] = useState(() => {
    // minimalno ime (možeš da vežeš na /api/auth/me kasnije)
    return { username: `nik-${Math.floor(Math.random() * 1000)}` };
  });

  const [wsOk, setWsOk] = useState(false);
  const [room] = useState("lobby");
  const [msgs, setMsgs] = useState([]);
  const [online, setOnline] = useState([]);
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    socket.auth = { username: me.username };
    socket.connect();

    const onConnect = () => {
      setWsOk(true);
      socket.emit("join", room);
    };
    const onDisconnect = () => setWsOk(false);

    const onHistory = (p) => {
      if (p?.room === room) setMsgs(p.items || []);
    };
    const onNew = (m) => {
      if (m?.room === room) setMsgs((prev) => [...prev, m]);
    };
    const onPresence = (list) => setOnline(list || []);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat:history", onHistory);
    socket.on("chat:new", onNew);
    socket.on("presence:list", onPresence);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:history", onHistory);
      socket.off("chat:new", onNew);
      socket.off("presence:list", onPresence);
      socket.disconnect();
    };
  }, [me.username, room]);

  const canSend = useMemo(() => wsOk && text.trim().length > 0, [wsOk, text]);

  const send = (e) => {
    e?.preventDefault?.();
    const t = text.trim();
    if (!t) return;
    socket.emit("chat:send", { room, text: t });
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Sobe</div>
        <input value={`# ${room}`} readOnly style={{ width: "100%" }} />
        <div style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Online</div>
        {online.length === 0 ? (
          <div>niko drugi nije online 😔</div>
        ) : (
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {online.map((u, i) => <li key={i}>{u.username}</li>)}
          </ul>
        )}
      </div>

      <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            display: "inline-block", width: 10, height: 10, borderRadius: "50%",
            background: wsOk ? "#2ecc71" : "#e74c3c"
          }} />
          <strong>Soba:</strong> {room}
          {!wsOk && <span style={{ color: "#e74c3c" }}> websocket error</span>}
        </div>

        <div style={{
          background: "#fafafa", border: "1px solid #ddd", borderRadius: 6,
          height: 300, padding: 8, overflow: "auto", marginBottom: 8, whiteSpace: "pre-wrap"
        }}>
          {msgs.length === 0 ? (
            <div style={{ opacity: 0.6 }}>Nema poruka u ovoj sobi.</div>
          ) : msgs.map(m => (
            <div key={m.id} style={{ marginBottom: 6 }}>
              <strong>{m.from}</strong>: {m.text}
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {new Date(m.ts).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Poruka…"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={!canSend}>Pošalji</button>
        </form>
      </div>
    </div>
  );
}
