// src/components/MessageList.jsx
import React, { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { connectSocket, getSocket } from "../socket";

const norm = (v) => String(v || "").trim().toLowerCase();

export default function MessageList({ currentUser, peerUsername }) {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingFromPeer, setTypingFromPeer] = useState(false);

  const listRef = useRef(null);
  const topSentinel = useRef(null);
  const typingTimer = useRef(null);

  function scrollToBottom() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  async function loadThread(cursor) {
    if (!peerUsername) return;
    setLoading(true);
    try {
      const { data } = await api.get(
        `/messages/thread/${encodeURIComponent(norm(peerUsername))}${cursor ? `?cursor=${cursor}` : ""}`
      );
      if (!cursor) {
        setItems([...data.items].reverse());
      } else {
        setItems((prev) => [...data.items.reverse(), ...prev]);
      }
      setNextCursor(data.nextCursor || null);

      // Mark as read (sve od peer-a)
      await api.post("/messages/read", { fromUsername: norm(peerUsername) });

      if (!cursor) setTimeout(scrollToBottom, 10);
    } finally {
      setLoading(false);
    }
  }

  // init + promene peer-a
  useEffect(() => { setItems([]); setNextCursor(null); if (peerUsername) loadThread(null); }, [peerUsername]);

  // infinite scroll na vrhu
  useEffect(() => {
    const root = listRef.current;
    const sentinel = topSentinel.current;
    if (!root || !sentinel) return;

    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextCursor && !loading) {
        loadThread(nextCursor);
      }
    }, { root });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [nextCursor, loading, peerUsername]);

  // realtime novi message
  useEffect(() => {
    const s = connectSocket() || getSocket();
    if (!s) return;

    function onNew(msg) {
      const u = norm(peerUsername);
      if (!u) return;
      const involves = msg.senderId === currentUser?.id || msg.recipientId === currentUser?.id;
      const belongs =
        msg.sender?.username?.toLowerCase() === u || msg.recipient?.username?.toLowerCase() === u;
      if (involves && belongs) {
        setItems((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        // ako poruka stiže TEBI od peer-a, odmah je označi kao pročitanu
        if (msg.recipientId === currentUser.id) {
          api.post("/messages/read", { fromUsername: u }).catch(() => {});
        }
        setTimeout(scrollToBottom, 10);
      }
    }
    function onTyping({ fromUsername, isTyping }) {
      if (norm(fromUsername) === norm(peerUsername)) {
        setTypingFromPeer(isTyping);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        if (isTyping) typingTimer.current = setTimeout(() => setTypingFromPeer(false), 2500);
      }
    }

    s.on("message:new", onNew);
    s.on("typing", onTyping);
    return () => {
      s.off("message:new", onNew);
      s.off("typing", onTyping);
    };
  }, [currentUser, peerUsername]);

  return (
    <div ref={listRef} style={{ flex: 1, padding: 12, overflowY: "auto", background: "#fafafa" }}>
      <div ref={topSentinel} />
      {items.map((m) => {
        const mine = m.senderId === currentUser.id;
        return (
          <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", margin: "6px 0" }}>
            <div style={{
              maxWidth: "70%",
              padding: "10px 12px",
              borderRadius: 12,
              background: mine ? "#d6f5d6" : "#fff",
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 0 rgba(0,0,0,0.03)"
            }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {m.sender?.username} • {new Date(m.createdAt).toLocaleString()}
                {m.readAt ? " • ✓" : ""}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          </div>
        );
      })}
      {typingFromPeer && (
        <div style={{ fontSize: 12, color: "#666", margin: "6px 0" }}>… {norm(peerUsername)} kuca</div>
      )}
      {loading && <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Učitavam…</div>}
    </div>
  );
}
