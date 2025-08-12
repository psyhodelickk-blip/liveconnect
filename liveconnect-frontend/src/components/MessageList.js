// src/components/MessageList.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";

export default function MessageList({ currentUser, peerUsername }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const boxRef = useRef(null);

  const loadThread = useCallback(async () => {
    if (!peerUsername) return;
    setLoading(true);
    try {
      const { data } = await api.get("/messages/thread", { params: { peer: String(peerUsername).toLowerCase() } });
      if (data?.ok) setItems(data.items || []);
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
      }, 50);
    }
  }, [peerUsername]);

  useEffect(() => { loadThread(); }, [loadThread]);

  // Realtime: nova poruka / gift
  useEffect(() => {
    const sock = (window && window.lcSocket) || null;
    if (!sock || !sock.on) return;

    const onMsg = (m) => {
      const me = (currentUser?.id);
      const isForThisThread =
        (m.fromUserId === me && m.toUserId && String(peerUsername || "").length) ||
        (m.toUserId === me && String(peerUsername || "").length);
      // jednostavnije: samo osveži nit ako je ovo taj peer
      loadThread();
    };

    const onGift = (g) => {
      // ako je poklon iz/ka trenutnom peer-u, osveži
      const me = currentUser?.id;
      const isMine = g.fromUserId === me || g.toUserId === me;
      if (isMine) loadThread();
    };

    sock.on("messages:new", onMsg);
    sock.on("gift:received", onGift);
    return () => {
      sock.off && sock.off("messages:new", onMsg);
      sock.off && sock.off("gift:received", onGift);
    };
  }, [currentUser?.id, peerUsername, loadThread]);

  if (!peerUsername) return <div style={{ padding: 16, color: "#666" }}>Izaberi razgovor sa leve strane.</div>;
  if (loading) return <div style={{ padding: 16 }}>Učitavam…</div>;

  function MsgBubble({ mine, children, ts }) {
    return (
      <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", padding: "6px 10px" }}>
        <div style={{
          maxWidth: 520,
          background: mine ? "#dcf8c6" : "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 10,
          boxShadow: "0 1px 1px rgba(0,0,0,0.02)"
        }}>
          <div style={{ whiteSpace: "pre-wrap" }}>{children}</div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#777", marginTop: 4 }}>
            {new Date(ts).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  function GiftCard({ mine, item }) {
    const g = item.gift || {};
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 10px" }}>
        <div style={{
          width: "min(520px, 90%)",
          background: "#fffdf7",
          border: "1px solid #f5e6a3",
          borderRadius: 12,
          padding: 12,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 13, color: "#444" }}>
            {mine ? "Poslao si" : "Dobio si"} gift:&nbsp;<b>{g.name || item.code}</b> ({g.price || item.price} coins)
          </div>
          {g.iconUrl ? (
            <img src={g.iconUrl} alt={g.name} style={{ width: 60, height: 60, objectFit: "contain", margin: "8px auto" }} />
          ) : (
            <div style={{ fontSize: 40, lineHeight: "1.2" }}>🎁</div>
          )}
          {item.message && <div style={{ color: "#555", marginTop: 6 }}>{item.message}</div>}
          <div style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
            {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={boxRef} style={{ flex: 1, overflowY: "auto", background: "#fafafa" }}>
      {items.length === 0 ? (
        <div style={{ padding: 16, color: "#888" }}>Nema poruka još.</div>
      ) : (
        items.map((it) => {
          if (it.kind === "gift") {
            const mine = it.fromUserId === currentUser?.id;
            return <GiftCard key={it.id} mine={mine} item={it} />;
          } else {
            const mine = it.senderId === currentUser?.id;
            return <MsgBubble key={it.id} mine={mine} ts={it.createdAt}>{it.content}</MsgBubble>;
          }
        })
      )}
    </div>
  );
}
