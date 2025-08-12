// src/App.js
import React, { useEffect, useState } from "react";
import { api } from "./services/api";
import { connectSocket, disconnectSocket } from "./socket";
import AuthTest from "./AuthTest";
import MessagesTest from "./MessagesTest";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data?.ok && data?.user) {
          setUser(data.user);
          connectSocket(); // handshake koristi cookie
        }
      } catch {}
      setChecking(false);
    })();
  }, []);

  function handleAuth(u) {
    setUser(u || null);
    if (u) connectSocket();
  }
  function handleLogout() {
    setUser(null);
    disconnectSocket();
  }

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 12, fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>LiveConnect</h1>
        <div style={{ fontSize: 14, color: "#444" }}>
          {checking ? "Provera sesije..." : user ? (
            <>Ulogovan: <b>{user.username}</b> (id: {user.id})</>
          ) : (
            "Nisi ulogovan"
          )}
        </div>
      </header>

      <AuthTest onAuth={handleAuth} onLogout={handleLogout} />

      {user && (
        <>
          <hr style={{ margin: "28px 0" }} />
          <MessagesTest currentUser={user} />
        </>
      )}
    </div>
  );
}
