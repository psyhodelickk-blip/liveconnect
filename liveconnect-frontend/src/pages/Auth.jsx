// liveconnect-frontend/src/pages/Auth.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { connectSocket, disconnectSocket } from "../socket";

export default function Auth({ onAuth, onLogout }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function loadMe() {
    try {
      const r = await api("/auth/me");
      const d = await r.json();
      if (d?.ok) {
        setUser(d.user);
        onAuth?.(d.user);
        connectSocket();
      } else {
        setUser(null);
        onLogout?.();
        disconnectSocket();
      }
    } catch {
      setUser(null);
      onLogout?.();
      disconnectSocket();
    }
  }

  useEffect(() => {
    loadMe();
    return () => disconnectSocket();
  }, []);

  async function submit(e) {
    e.preventDefault();
    const ep = mode === "login" ? "/auth/login" : "/auth/register";
    const r = await api(ep, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const d = await r.json();
    if (d?.ok) {
      setUser(d.user);
      onAuth?.(d.user);
      connectSocket();
    } else {
      alert(d?.error || "Greška");
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    onLogout?.();
    disconnectSocket();
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 360, margin: "16px auto" }}>
        <h3>{mode === "login" ? "Prijava" : "Registracija"}</h3>
        <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
          <button type="submit">
            {mode === "login" ? "Uloguj se" : "Registruj se"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{ marginTop: 8 }}
        >
          {mode === "login"
            ? "Nemaš nalog? Registruj se"
            : "Imaš nalog? Uloguj se"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: "16px auto" }}>
      <div>Zdravo, {user.name || user.username}</div>
      <button onClick={logout}>Odjava</button>
    </div>
  );
}
