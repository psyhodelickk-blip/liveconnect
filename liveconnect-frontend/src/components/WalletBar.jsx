// src/components/WalletBar.jsx
import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export default function WalletBar({ currentUser, peerUsername }) {
  const [balance, setBalance] = useState(null);
  const [msg, setMsg] = useState("");

  async function loadBalance() {
    try {
      const { data } = await api.get("/coins/balance");
      if (data?.ok) setBalance(data.balance);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Greška pri učitavanju balansa");
    }
  }

  useEffect(() => { loadBalance(); }, []);

  // (opciono) osluškuj socket događaj iz backenda: wallet:update
  useEffect(() => {
    const sock = (window && window.lcSocket) || null; // ako već imaš socket exportovan na window
    if (!sock || !sock.on) return;
    const handler = (payload) => {
      if (typeof payload?.balance === "number") setBalance(payload.balance);
    };
    sock.on("wallet:update", handler);
    return () => { sock.off && sock.off("wallet:update", handler); };
  }, []);

  async function addDev100() {
    setMsg("");
    try {
      const { data } = await api.post("/coins/purchase", { amount: 100, reference: `dev-${Date.now()}` });
      if (data?.ok) setBalance(data.balance);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Greška pri kupovini");
    }
  }

  async function tip10() {
    if (!peerUsername) {
      setMsg("Izaberi sagovornika sa leve strane");
      return;
    }
    setMsg("");
    try {
      const { data } = await api.post("/coins/tip", {
        toUsername: String(peerUsername).toLowerCase(),
        amount: 10,
        reference: `tip-${Date.now()}`,
      });
      if (data?.ok) setBalance(data.balance);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Greška pri slanju napojnice");
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: 10,
      border: "1px solid #eee", borderRadius: 12, background: "#fff", marginBottom: 12
    }}>
      <div style={{ fontWeight: 700 }}>Wallet</div>
      <div style={{ color: "#444" }}>
        Saldo: <b>{balance === null ? "…" : `${balance} coins`}</b>
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={addDev100}>+100 (dev)</button>
      <button onClick={tip10}>Tip 10 @{peerUsername || "peer"}</button>
      {msg && <div style={{ marginLeft: 10, fontSize: 12, color: "#c00" }}>{msg}</div>}
    </div>
  );
}
