// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "./services/api";
import { connectSocket, disconnectSocket } from "./socket";
import Login from "./pages/Login";
import Chat from "./pages/Chat";

function AppShell() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // proveri sesiju na start
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data?.ok && data?.user) {
          setUser(data.user);
          connectSocket();
        }
      } catch {}
      setChecking(false);
    })();
  }, []);

  const onAuth = (u) => {
    setUser(u);
    connectSocket();
  };

  const onLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setUser(null);
    disconnectSocket();
  };

  if (checking) {
    return <div style={{ padding: 24, fontFamily: "sans-serif" }}>Provera sesije...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/chat" replace /> : <Login onAuth={onAuth} />}
      />
      <Route
        path="/chat"
        element={
          user ? <Chat user={user} onLogout={onLogout} /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="*"
        element={<Navigate to={user ? "/chat" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
