// liveconnect-frontend/src/pages/AuthPage.jsx
import React, { useState } from "react";
import { api } from "../services/api";

export default function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "register") {
        const { data } = await api.post("/auth/register", { username, password, email });
        if (data.ok) onAuthed(data.user);
        else setErr(data.error || "Greška");
      } else {
        const { data } = await api.post("/auth/login", { username, password });
        if (data.ok) onAuthed(data.user);
        else setErr(data.error || "Greška");
      }
    } catch (e) {
      setErr(e?.response?.data?.error || "Server error");
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setMode("login")} disabled={mode === "login"}>Login</button>
        <button onClick={() => setMode("register")} disabled={mode === "register"}>Register</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: 10 }}>
            <label>Email (opciono)</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {err && <div style={{ color: "red", marginBottom: 10 }}>{err}</div>}

        <button type="submit">{mode === "register" ? "Napravi nalog" : "Uđi"}</button>
      </form>
    </div>
  );
}
