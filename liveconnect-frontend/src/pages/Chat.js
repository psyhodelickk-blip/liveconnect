// src/pages/Chat.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { disconnectSocket } from "../socket";
import Conversations from "../components/Conversations";
import MessageList from "../components/MessageList";
import Composer from "../components/Composer";
import WalletBar from "../components/WalletBar";
import GiftGrid from "../components/GiftGrid";

export default function Chat({ user, onLogout = () => {} }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [showGifts, setShowGifts] = useState(false);
  const [quickPeer, setQuickPeer] = useState("");

  async function doLogout() {
    try { await api.post("/auth/logout"); } catch {}
    disconnectSocket();
    onLogout();
    navigate("/login", { replace: true });
  }

  function openQuick() {
    const u = String(quickPeer || "").trim().toLowerCase();
    if (!u || u === String(user?.username || "").toLowerCase()) return;
    setSelected(u);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "20px auto", padding: 12, fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>LiveConnect</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#444" }}>
            Ulogovan: <b>{user.username}</b> (id: {user.id})
          </span>
          <button onClick={doLogout}>Logout</button>
        </div>
      </header>

      <WalletBar currentUser={user} peerUsername={selected} />

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setShowGifts((v) => !v)}>
          {showGifts ? "Sakrij gifts" : "Prikaži gifts"}
        </button>
      </div>

      {showGifts && (
        <div style={{ border: "1px solid #eee", borderRadius: 12, marginBottom: 12, background: "#fff" }}>
          <GiftGrid peerUsername={selected} onSent={() => {}} />
        </div>
      )}

      <div style={{ display: "flex", minHeight: "70vh", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <Conversations currentUser={user} selected={selected} onSelect={setSelected} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {!selected ? (
            <div style={{ padding: 24, color: "#666" }}>
              <div style={{ marginBottom: 8 }}>Izaberi razgovor sa leve strane ili započni novi:</div>
              <div style={{ display: "flex", gap: 6, maxWidth: 360 }}>
                <input
                  value={quickPeer}
                  placeholder="username..."
                  onChange={(e) => setQuickPeer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && openQuick()}
                  style={{ flex: 1, padding: 6, border: "1px solid #ddd", borderRadius: 8 }}
                />
                <button onClick={openQuick}>Otvori</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee", background: "#fff" }}>
                <b>@{selected}</b>
              </div>
              <MessageList currentUser={user} peerUsername={selected} />
              <Composer peerUsername={selected} onSent={() => {}} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
