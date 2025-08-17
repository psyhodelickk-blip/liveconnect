// liveconnect-frontend/src/components/Chat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "./api";

function dmRoom(a, b) {
  const [x, y] = [Number(a), Number(b)].sort((m, n) => m - n);
  return `dm:${x}-${y}`;
}

export default function Chat({ user }) {
  const [room, setRoom] = useState("lobby");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [online, setOnline] = useState([]);  // [{id, username, name}]
  const [typingUsers, setTypingUsers] = useState(new Set());
  const bottomRef = useRef(null);

  const socket = useMemo(() => io("/", { withCredentials: true }), []);

  // učitaj istoriju kad se menja soba
  async function loadHistory(r) {
    const data = await fetch(`/api/chat/history?room=${encodeURIComponent(r)}`, {
      credentials: "include",
    }).then((res) => res.json());
    if (data?.ok) setMessages(data.items || []);
  }

  // presence inicijalno (REST), a posle preko soketa
  async function loadOnline() {
    try {
      const res = await fetch("/api/chat/users-online", { credentials: "include" }).then((r) => r.json());
      if (res?.ok) setOnline(res.items || []);
    } catch {}
  }

  useEffect(() => {
    loadHistory(room);
  }, [room]);

  useEffect(() => {
    loadOnline();

    socket.on("joined", () => {});
    socket.on("presence", (payload) => setOnline(payload.users || []));
    socket.on("chat_message", (msg) => {
      if (msg.room === room) setMessages((prev) => [...prev, msg]);
    });
    socket.on("typing", ({ room: r, userId, typing }) => {
      if (r !== room || userId === user.id) return;
      setTypingUsers((prev) => {
        const n = new Set(prev);
        if (typing) n.add(userId);
        else n.delete(userId);
        return n;
      });
      if (typing) {
        // auto-isključi posle 2s ako ne dođe false
        setTimeout(() => {
          setTypingUsers((prev) => {
            const n = new Set(prev);
            n.delete(userId);
            return n;
          });
        }, 2000);
      }
    });

    socket.emit("join_room", room);

    return () => {
      socket.off("joined");
      socket.off("presence");
      socket.off("chat_message");
      socket.off("typing");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // kad promeniš sobu, reci serveru
  useEffect(() => {
    socket.emit("join_room", room);
  }, [room, socket]);

  // auto skrol
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // typing emit (lagano)
  useEffect(() => {
    if (!text) return;
    socket.emit("typing", { room, typing: true });
    const t = setTimeout(() => socket.emit("typing", { room, typing: false }), 1200);
    return () => clearTimeout(t);
  }, [text, room, socket]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText("");
    socket.emit("chat_message", { room, content }, (ack) => {
      if (!ack?.ok) {
        alert(ack?.error || "Slanje nije uspelo");
        setText(content); // vrati tekst
      }
    });
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // UI
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12 }}>
      {/* Sidebar */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Sobe</div>
        <button
          onClick={() => setRoom("lobby")}
          style={{ width: "100%", marginBottom: 8, background: room === "lobby" ? "#eee" : undefined }}
        >
          # lobby
        </button>

        <div style={{ fontWeight: 700, margin: "10px 0 6px" }}>Online</div>
        {online.length === 0 && <div style={{ color: "#666" }}>nema nikoga 🙃</div>}
        {online
          .filter((u) => u.id !== user.id)
          .map((u) => {
            const dm = dmRoom(user.id, u.id);
            return (
              <button
                key={u.id}
                onClick={() => setRoom(dm)}
                style={{ width: "100%", marginBottom: 6, background: room === dm ? "#eee" : undefined }}
                title={`DM sa ${u.username}`}
              >
                @ {u.username || u.name || u.id}
              </button>
            );
          })}
      </div>

      {/* Chat panel */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Soba: {room.startsWith("dm:") ? room.replace("dm:", "DM ") : room}
        </div>

        <div style={{ height: 360, overflowY: "auto", background: "#fafafa", padding: 8, borderRadius: 8 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ margin: "6px 0" }}>
              <b>{m.sender?.username ?? m.senderId}:</b> {m.content}
              <div style={{ fontSize: 11, color: "#666" }}>
                {new Date(m.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {/* Typing indikator */}
          {typingUsers.size > 0 && (
            <div style={{ fontStyle: "italic", color: "#666", marginTop: 8 }}>
              {Array.from(typingUsers).length === 1
                ? "neko kuca…"
                : "više njih kuca…"}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <textarea
            rows={2}
            placeholder="Poruka…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            style={{ flex: 1 }}
          />
          <button onClick={send}>Pošalji</button>
        </div>
      </div>
    </div>
  );
}
