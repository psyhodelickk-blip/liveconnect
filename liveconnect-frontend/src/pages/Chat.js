// src/pages/Chat.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import MessagesTest from "../MessagesTest";
import { api } from "../services/api";
import { disconnectSocket } from "../socket";

export default function Chat({ user, onLogout = () => {} }) {
  const navigate = useNavigate();

  async function doLogout() {
    try { await api.post("/auth/logout"); } catch {}
    disconnectSocket();
    onLogout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ maxWidth: 920, margin: "20px auto", padding: 12, fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>LiveConnect</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#444" }}>
            Ulogovan: <b>{user.username}</b> (id: {user.id})
          </span>
          <button onClick={doLogout}>Logout</button>
        </div>
      </header>

      <MessagesTest currentUser={user} />
    </div>
  );
}
